import { createHash } from "node:crypto";
import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  readShotstackOutput,
  readAuthorizedShotstackSource,
  validateShotstackOutputUrl,
  validateShotstackMp4,
  writeShotstackOutput,
} from "@/server/providers/shotstack-media";
const storage = vi.hoisted(() => ({ write: vi.fn(), read: vi.fn() }));
vi.mock("@/server/providers/r2-preview", () => ({
  R2PreviewReader: class {
    readObject = storage.read;
  },
}));
vi.mock("@/server/providers/r2-recording", () => ({ writePrivateRecording: storage.write }));
const id = "d6000000-0000-4000-8000-000000000001";
const url = `https://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/owner/${id}.mp4`;
function box(type: string, ...content: Uint8Array[]) {
  const bytes = Buffer.concat(content);
  const header = Buffer.alloc(8);
  header.writeUInt32BE(bytes.length + 8);
  header.write(type, 4);
  return Buffer.concat([header, bytes]);
}
// Structural fixture only, no decoding or playable-media claim.
const mp4 = box("ftyp", Buffer.from("isom\0\0\0\0isom"));
const body = Buffer.concat([
  mp4,
  box(
    "moov",
    box("mvhd", Buffer.alloc(100)),
    box(
      "trak",
      box("tkhd", Buffer.alloc(84)),
      box(
        "mdia",
        box("mdhd", Buffer.alloc(24)),
        box("hdlr", Buffer.from("\0\0\0\0\0\0\0\0vide")),
        box("minf", box("stbl", box("stsd", Buffer.alloc(16)))),
      ),
    ),
  ),
  box("mdat", Buffer.from([1, 2, 3, 4])),
]);
const hash = createHash("sha256").update(body).digest("hex");
it("bounds and hashes actual MP4 bytes fetched without redirects or credentials", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(body, {
      headers: { "Content-Type": "video/mp4", "Content-Length": String(body.length) },
    }),
  );
  expect(await readShotstackOutput(url, undefined, fetcher)).toEqual({
    bytes: new Uint8Array(body),
    mimeType: "video/mp4",
    checksumSha256: hash,
  });
  expect(fetcher.mock.calls[0]).toEqual([
    url,
    expect.objectContaining({
      redirect: "error",
      cache: "no-store",
      signal: expect.any(AbortSignal),
    }),
  ]);
});
it.each([
  "https://127.0.0.1/file.mp4",
  "http://shotstack-api-stage-output.s3-ap-southeast-2.amazonaws.com/file.mp4",
  url + "?token=secret",
  url.replace("amazonaws.com", "amazonaws.com.evil.com"),
  url.replace("https://", "https://secret@"),
  url.replace("owner/", "owner/%2e%2e/"),
])("rejects unsafe output URL before network access: %s", async (unsafe) => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(readShotstackOutput(unsafe, undefined, fetcher)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("binds output to render and configured environment", () => {
  expect(() => validateShotstackOutputUrl(url, id, "production")).toThrow();
  expect(() => validateShotstackOutputUrl(url, id.replace(/1$/, "2"), "sandbox")).toThrow();
});
it.each([
  new Response(body, { status: 302, headers: { Location: "https://evil.test" } }),
  new Response(body, { headers: { "Content-Type": "text/html" } }),
  new Response(body, { headers: { "Content-Type": "video/mp4", "Content-Length": "20971521" } }),
  new Response(body.subarray(0, 24), { headers: { "Content-Type": "video/mp4" } }),
  new Response(body, {
    headers: { "Content-Type": "video/mp4", "Content-Length": String(body.length + 1) },
  }),
])("rejects redirects, MIME, oversize, truncation and false lengths", async (response) => {
  await expect(
    readShotstackOutput(url, undefined, vi.fn<typeof fetch>().mockResolvedValue(response)),
  ).rejects.toThrow();
});
it("rejects header-only and invalid box-size MP4s", () => {
  expect(() => validateShotstackMp4(mp4)).toThrow();
  const corrupted = Buffer.from(body);
  corrupted.writeUInt32BE(body.length + 100, 0);
  expect(() => validateShotstackMp4(corrupted)).toThrow();
});
it("checks authorized source MIME, full bytes/hash and structure before issuing any URL", async () => {
  const asset = {
    id,
    projectId: id,
    objectKey: "private/key",
    mimeType: "video/mp4",
    byteSize: body.length,
    checksumSha256: hash,
    width: null,
    height: null,
    durationSeconds: null,
  };
  const readObject = vi.fn().mockResolvedValue({ bytes: body, mimeType: "video/mp4" }),
    sign = vi.fn().mockResolvedValue({ url: "https://private.invalid/transient" });
  expect(await readAuthorizedShotstackSource({ asset }, { readObject, sign })).toEqual({
    assetId: id,
    mimeType: "video/mp4",
    url: "https://private.invalid/transient",
    durationSeconds: null,
  });
  expect(sign.mock.calls[0][0]).toMatchObject({ objectKey: "private/key", expiresInSeconds: 3600 });
  sign.mockClear();
  for (const override of [
    { checksumSha256: "0".repeat(64) },
    { mimeType: "audio/wav" },
    { byteSize: 20971521 },
  ])
    await expect(
      readAuthorizedShotstackSource({ asset: { ...asset, ...override } }, { readObject, sign }),
    ).rejects.toThrow();
  expect(sign).not.toHaveBeenCalled();
});
it("writes only verified immutable MP4 bytes using the existing conditional R2 writer", async () => {
  const objectKey = `private/recordings/${id}/${id}/${hash}.mp4`;
  await writeShotstackOutput({ objectKey, bytes: body, checksumSha256: hash });
  expect(storage.write).toHaveBeenCalledWith({
    objectKey,
    bytes: body,
    checksumSha256: hash,
    mimeType: "video/mp4",
  });
  storage.write.mockClear();
  await expect(
    writeShotstackOutput({ objectKey, bytes: body, checksumSha256: "0".repeat(64) }),
  ).rejects.toThrow();
  expect(storage.write).not.toHaveBeenCalled();
});

it("recovers an already-written immutable output only when the private object matches", async () => {
  const { BoundaryError } = await import("@/server/auth/errors");
  const objectKey = `private/recordings/${id}/${id}/${hash}.mp4`;
  storage.write.mockRejectedValue(new BoundaryError(409, "CONFLICT", "Already exists"));
  storage.read.mockResolvedValue({ bytes: body, mimeType: "video/mp4" });
  await expect(
    writeShotstackOutput({ objectKey, bytes: body, checksumSha256: hash }),
  ).resolves.toBeUndefined();
  expect(storage.read.mock.calls[0][0]).toMatchObject({ objectKey, maxBytes: body.length });
  storage.read.mockResolvedValue({
    bytes: Buffer.concat([body, Buffer.from([0])]),
    mimeType: "video/mp4",
  });
  await expect(
    writeShotstackOutput({ objectKey, bytes: body, checksumSha256: hash }),
  ).rejects.toThrow();
  storage.read.mockResolvedValue({ bytes: body, mimeType: "text/html" });
  await expect(
    writeShotstackOutput({ objectKey, bytes: body, checksumSha256: hash }),
  ).rejects.toThrow();
  storage.write.mockReset();
  storage.read.mockReset();
});
