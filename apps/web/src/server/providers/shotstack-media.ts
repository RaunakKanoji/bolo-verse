import "server-only";
import { createHash } from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv } from "@/server/config/env";
import { validateIngestedImage } from "@/server/services/image-ingestion";
import { R2PreviewReader } from "./r2-preview";
import { writePrivateRecording } from "./r2-recording";

export type ShotstackSource = {
  assetId: string;
  mimeType: string;
  url: string;
  durationSeconds: number | null;
};
export type ShotstackSourceAssetSnapshot = {
  id: string;
  projectId: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  checksumSha256: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};
const invalid = () =>
  new BoundaryError(503, "SERVICE_UNAVAILABLE", "The video bytes could not be safely verified.");
/** Exact vendor output bucket hosts, never a general AWS/CDN wildcard.
 * https://shotstack.io/docs/api/#renderresponsedata */
const hosts = {
  sandbox: "shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com",
  production: "shotstack-api-v1-output.s3-ap-southeast-2.amazonaws.com",
};
export function validateShotstackOutputUrl(
  value: string,
  jobId?: string,
  environment?: "sandbox" | "production",
): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }
  const match =
    /^\/([a-zA-Z0-9_-]{1,100})\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.mp4$/.exec(
      url.pathname,
    );
  if (
    value !== url.href ||
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !Object.values(hosts).includes(url.hostname) ||
    (environment && hosts[environment] !== url.hostname) ||
    !match ||
    (jobId && match[2] !== jobId)
  )
    throw invalid();
  return url;
}
/** Conservative ISO BMFF structure validation, not a codec/playback assertion. */
export function validateShotstackMp4(bytes: Uint8Array): void {
  if (bytes.length < 48 || bytes.length > MAX_PREVIEW_BYTES) throw invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  type Box = { type: string; start: number; end: number };
  let count = 0;
  function boxes(start: number, end: number): Box[] {
    const result: Box[] = [];
    for (let at = start; at < end;) {
      if (++count > 4096 || at + 8 > end) throw invalid();
      const size = view.getUint32(at),
        type = ascii(at + 4);
      // Extended/zero-size boxes are unnecessary for this bounded nonfragmented subset.
      if (size < 8 || at + size > end || !/^[a-zA-Z0-9 ]{4}$/.test(type)) throw invalid();
      result.push({ type, start: at + 8, end: at + size });
      at += size;
    }
    return result;
  }
  const top = boxes(0, bytes.length),
    ftyp = top[0];
  if (
    ftyp?.type !== "ftyp" ||
    ftyp.end - ftyp.start < 8 ||
    (ftyp.end - ftyp.start) % 4 ||
    !["isom", "iso2", "mp41", "mp42", "avc1"].includes(ascii(ftyp.start))
  )
    throw invalid();
  const moov = top.filter((box) => box.type === "moov"),
    mdat = top.filter((box) => box.type === "mdat");
  if (
    moov.length !== 1 ||
    !mdat.some((box) => box.end > box.start) ||
    top.some((box) => ["moof", "sidx"].includes(box.type))
  )
    throw invalid();
  const movie = boxes(moov[0].start, moov[0].end);
  if (!movie.some((box) => box.type === "mvhd" && box.end - box.start >= 100)) throw invalid();
  let video = false;
  for (const track of movie.filter((box) => box.type === "trak")) {
    const children = boxes(track.start, track.end);
    if (!children.some((box) => box.type === "tkhd" && box.end - box.start >= 84)) throw invalid();
    const mdia = children.find((box) => box.type === "mdia");
    if (!mdia) throw invalid();
    const media = boxes(mdia.start, mdia.end),
      hdlr = media.find((box) => box.type === "hdlr");
    if (
      !media.some((box) => box.type === "mdhd" && box.end - box.start >= 24) ||
      !hdlr ||
      hdlr.end - hdlr.start < 12
    )
      throw invalid();
    const minf = media.find((box) => box.type === "minf");
    if (!minf) throw invalid();
    const stbl = boxes(minf.start, minf.end).find((box) => box.type === "stbl");
    if (
      !stbl ||
      !boxes(stbl.start, stbl.end).some((box) => box.type === "stsd" && box.end - box.start >= 8)
    )
      throw invalid();
    if (ascii(hdlr.start + 8) === "vide") video = true;
  }
  if (!video) throw invalid();
}
export async function readShotstackBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const length = response.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) {
    await response.body?.cancel().catch(() => undefined);
    throw invalid();
  }
  if (!response.body) throw invalid();
  const reader = response.body.getReader(),
    chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBytes) throw invalid();
      chunks.push(part.value);
    }
    if (!total || (length !== null && Number(length) !== total)) throw invalid();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
/** The URL is provider-only authority. Never expose or persist it in browser DTOs. */
export async function readShotstackOutput(
  url: string,
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<{ bytes: Uint8Array; mimeType: "video/mp4"; checksumSha256: string }> {
  validateShotstackOutputUrl(url);
  try {
    const response = await fetcher(url, {
      redirect: "error",
      cache: "no-store",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
    if (
      !response.ok ||
      response.redirected ||
      response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "video/mp4"
    ) {
      await response.body?.cancel().catch(() => undefined);
      throw invalid();
    }
    const bytes = await readShotstackBoundedBody(response, MAX_PREVIEW_BYTES);
    validateShotstackMp4(bytes);
    return {
      bytes,
      mimeType: "video/mp4",
      checksumSha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch {
    throw invalid();
  }
}
/** Local signing only. Caller authorizes the immutable object and rechecks access
 * after signing. This one-hour capability is transient and server/provider-only. */
export async function createReadUrlForShotstack(input: {
  objectKey: string;
  expiresInSeconds?: number;
  signal?: AbortSignal;
}): Promise<{ url: string }> {
  const env = getServerEnv();
  if (
    !env.R2_ACCOUNT_ID ||
    !/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID) ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET
  )
    throw new BoundaryError(
      503,
      "PROVIDER_UNCONFIGURED",
      "Private video storage is not configured.",
    );
  if (
    !input.objectKey ||
    input.objectKey.length > 512 ||
    (input.expiresInSeconds !== undefined && input.expiresInSeconds !== 3600)
  )
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Use an authorized private object and one-hour source capability.",
    );
  input.signal?.throwIfAborted();
  const client = new S3Client({
    region: "auto",
    forcePathStyle: true,
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    maxAttempts: 1,
  });
  try {
    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: input.objectKey }),
      { expiresIn: 3600 },
    );
    input.signal?.throwIfAborted();
    return { url };
  } finally {
    client.destroy();
  }
}
/** Requires a caller-authorized same-project READY snapshot, never browser metadata. */
export async function readAuthorizedShotstackSource(
  input: { asset: ShotstackSourceAssetSnapshot; signal?: AbortSignal },
  dependencies: {
    readObject?: (input: {
      objectKey: string;
      maxBytes: number;
      signal?: AbortSignal;
    }) => Promise<{ bytes: Uint8Array; mimeType: string }>;
    sign?: typeof createReadUrlForShotstack;
  } = {},
): Promise<ShotstackSource> {
  const asset = input.asset;
  if (
    !["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"].includes(
      asset.mimeType,
    ) ||
    !Number.isSafeInteger(asset.byteSize) ||
    asset.byteSize <= 0 ||
    asset.byteSize > MAX_PREVIEW_BYTES ||
    !/^[a-f0-9]{64}$/.test(asset.checksumSha256)
  )
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Use a verified project image or video of at most 20 MiB.",
    );
  const stored = await (
    dependencies.readObject ?? ((request) => new R2PreviewReader().readObject(request))
  )({ objectKey: asset.objectKey, maxBytes: asset.byteSize, signal: input.signal });
  if (
    stored.mimeType !== asset.mimeType ||
    stored.bytes.byteLength !== asset.byteSize ||
    createHash("sha256").update(stored.bytes).digest("hex") !== asset.checksumSha256
  )
    throw invalid();
  try {
    validatePreviewAsset(stored.bytes, asset.mimeType);
    if (asset.mimeType.startsWith("image/"))
      await validateIngestedImage({
        ...stored,
        byteSize: asset.byteSize,
        checksumSha256: asset.checksumSha256,
      });
    else if (asset.mimeType === "video/mp4") validateShotstackMp4(stored.bytes);
  } catch {
    throw invalid();
  }
  const signed = await (dependencies.sign ?? createReadUrlForShotstack)({
    objectKey: asset.objectKey,
    expiresInSeconds: 3600,
    signal: input.signal,
  });
  return {
    assetId: asset.id,
    mimeType: asset.mimeType,
    url: signed.url,
    durationSeconds: asset.durationSeconds,
  };
}
export async function writeShotstackOutput(input: {
  objectKey: string;
  bytes: Uint8Array;
  checksumSha256: string;
  signal?: AbortSignal;
}): Promise<void> {
  validateShotstackMp4(input.bytes);
  if (createHash("sha256").update(input.bytes).digest("hex") !== input.checksumSha256)
    throw invalid();
  try {
    await writePrivateRecording({ ...input, mimeType: "video/mp4" });
  } catch (error) {
    if (!(error instanceof BoundaryError) || error.status !== 409) throw error;
    // Recover a crash after immutable PUT but before SQL publication. The key
    // remains server-generated; existing bytes never inherit trust from a 412.
    const stored = await new R2PreviewReader().readObject({
      objectKey: input.objectKey,
      maxBytes: input.bytes.byteLength,
      signal: input.signal,
    });
    if (
      stored.mimeType !== "video/mp4" ||
      stored.bytes.byteLength !== input.bytes.byteLength ||
      createHash("sha256").update(stored.bytes).digest("hex") !== input.checksumSha256
    )
      throw invalid();
    validateShotstackMp4(stored.bytes);
  }
}
