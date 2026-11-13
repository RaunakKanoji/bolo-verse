import "server-only";
import { createHash } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { imageCreationMaxBytes } from "@/lib/contracts/creation";
import { BoundaryError } from "@/server/auth/errors";
import { createPrivateStorageClient } from "./private-storage";
import { R2BoundedReader } from "./r2-bounded";

const MAX_IMAGE_BYTES = imageCreationMaxBytes;
const allowedMime = new Set(["image/png", "image/jpeg", "image/webp"]);
export type ImageUploadSigningInput = {
  objectKey: string;
  mimeType: string;
  byteSize: number;
  checksumSha256: string;
  expiresInSeconds: number;
  signal?: AbortSignal;
};
export type PrivateImageWriteInput = {
  objectKey: string;
  bytes: Uint8Array;
  mimeType: string;
  checksumSha256: string;
  signal?: AbortSignal;
};
function validate(input: {
  objectKey: string;
  mimeType: string;
  byteSize: number;
  checksumSha256: string;
}) {
  if (
    !input.objectKey ||
    input.objectKey.length > 512 ||
    !allowedMime.has(input.mimeType) ||
    !Number.isSafeInteger(input.byteSize) ||
    input.byteSize < 1 ||
    input.byteSize > MAX_IMAGE_BYTES ||
    !/^[a-f0-9]{64}$/.test(input.checksumSha256)
  ) {
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Provide a bounded PNG, JPEG or WebP image with its SHA256 checksum.",
    );
  }
}
function signalWithTimeout(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(20_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}
/** Local signing only. Keys are generated and authorized by the server service. */
export async function signImageUpload(
  input: ImageUploadSigningInput,
): Promise<{ uploadUrl: string; headers: Record<string, string> }> {
  validate(input);
  if (
    !Number.isInteger(input.expiresInSeconds) ||
    input.expiresInSeconds < 1 ||
    input.expiresInSeconds > 600
  ) {
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Image upload sessions expire within ten minutes.",
    );
  }
  input.signal?.throwIfAborted();
  const { client, bucket } = createPrivateStorageClient();
  try {
    // Keep the signed upload path to basic headers; finalization verifies the reserved SHA256 server-side.
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.objectKey,
        ContentType: input.mimeType,
        ContentLength: input.byteSize,
        IfNoneMatch: "*",
      }),
      {
        expiresIn: input.expiresInSeconds,
        signableHeaders: new Set(["content-type", "content-length", "if-none-match"]),
      },
    );
    input.signal?.throwIfAborted();
    // Content-Length is signed but browsers derive it from the body; scripts cannot set it.
    return { uploadUrl, headers: { "Content-Type": input.mimeType, "If-None-Match": "*" } };
  } finally {
    client.destroy();
  }
}
/** Shared bounded private read; accepts authorized object keys, never client URLs. */
export async function readStagedImage(input: {
  objectKey: string;
  maxBytes: number;
  signal?: AbortSignal;
}): Promise<{ bytes: Uint8Array; mimeType: string }> {
  try {
    return await new R2BoundedReader(MAX_IMAGE_BYTES).readObject(input);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (("name" in error && error.name === "NoSuchKey") ||
        ("$metadata" in error &&
          (error.$metadata as { httpStatusCode?: number })?.httpStatusCode === 404))
    )
      throw new BoundaryError(
        409,
        "CONFLICT",
        "The image upload is incomplete. Retry the transfer before finalizing.",
      );
    throw error;
  }
}
/** Conditional creation preserves immutable final bytes. SHA256 identifies them; R2-supported MD5 protects transport. */
export async function writePrivateImage(input: PrivateImageWriteInput): Promise<void> {
  validate({ ...input, byteSize: input.bytes.byteLength });
  if (createHash("sha256").update(input.bytes).digest("hex") !== input.checksumSha256) {
    throw new BoundaryError(400, "INVALID_INPUT", "The image checksum does not match its bytes.");
  }
  const { client, bucket } = createPrivateStorageClient();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.objectKey,
        Body: input.bytes,
        ContentType: input.mimeType,
        ContentLength: input.bytes.byteLength,
        IfNoneMatch: "*",
        ContentMD5: createHash("md5").update(input.bytes).digest("base64"),
      }),
      { abortSignal: signalWithTimeout(input.signal) },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (("name" in error && error.name === "PreconditionFailed") ||
        ("$metadata" in error &&
          (error.$metadata as { httpStatusCode?: number })?.httpStatusCode === 412))
    ) {
      throw new BoundaryError(409, "CONFLICT", "This private image object already exists.");
    }
    throw error;
  } finally {
    client.destroy();
  }
}
