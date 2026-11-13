import { createHash } from "node:crypto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const storage = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (original) => {
  const sdk = await original<typeof import("@aws-sdk/client-s3")>();
  return {
    ...sdk,
    S3Client: class extends sdk.S3Client {
      send = storage.send;
      destroy = storage.destroy;
    },
  };
});
import { writePrivateRecording } from "@/server/providers/r2-recording";
const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 1, 2, 3, 4]),
  checksumSha256 = createHash("sha256").update(bytes).digest("hex");
const input = {
  bytes,
  mimeType: "video/webm",
  checksumSha256,
  objectKey: `private/recordings/d6000000-0000-4000-8000-000000000001/d6000000-0000-4000-8000-000000000002/${checksumSha256}.webm`,
};
beforeEach(() => {
  for (const [k, v] of Object.entries({
    R2_ACCOUNT_ID: "a".repeat(32),
    R2_ACCESS_KEY_ID: "test",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "private",
  }))
    vi.stubEnv(k, v);
  storage.send.mockReset().mockResolvedValue({});
  storage.destroy.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
it("conditionally writes a bounded private video with supported transport checksum", async () => {
  await writePrivateRecording(input);
  expect(storage.send.mock.calls[0][0].input).toMatchObject({
    IfNoneMatch: "*",
    ContentType: "video/webm",
    ContentLength: bytes.length,
    ContentMD5: createHash("md5").update(bytes).digest("base64"),
  });
  expect(storage.destroy).toHaveBeenCalledOnce();
});
it("requires configuration and refuses MIME/hash/key spoofing before storage", async () => {
  for (const override of [
    { mimeType: "text/html" },
    { checksumSha256: "0".repeat(64) },
    { objectKey: "public/anything" },
  ])
    await expect(writePrivateRecording({ ...input, ...override })).rejects.toMatchObject({
      status: 400,
    });
  vi.stubEnv("R2_BUCKET", "");
  await expect(writePrivateRecording(input)).rejects.toMatchObject({
    status: 503,
    code: "PROVIDER_UNCONFIGURED",
  });
  expect(storage.send).not.toHaveBeenCalled();
});
it("never replaces immutable existing bytes", async () => {
  storage.send.mockRejectedValueOnce({
    name: "PreconditionFailed",
    $metadata: { httpStatusCode: 412 },
  });
  await expect(writePrivateRecording(input)).rejects.toMatchObject({ status: 409 });
  expect(storage.send).toHaveBeenCalledOnce();
  expect(storage.destroy).toHaveBeenCalledOnce();
});
it("creates library objects conditionally while keeping the recording endpoint video-only", async () => {
  const { writePrivateLibraryAsset } = await import("@/server/providers/r2-recording");
  const bytes = new TextEncoder().encode("%PDF-1.7\n%%EOF"),
    checksumSha256 = createHash("sha256").update(bytes).digest("hex");
  const asset = {
    bytes,
    mimeType: "application/pdf",
    checksumSha256,
    objectKey: `private/library/d6000000-0000-4000-8000-000000000001/d6000000-0000-4000-8000-000000000002/${checksumSha256}.pdf`,
  };
  await writePrivateLibraryAsset(asset);
  expect(storage.send.mock.calls[0][0].input).toMatchObject({
    IfNoneMatch: "*",
    ContentType: "application/pdf",
    ContentLength: bytes.length,
  });
  await expect(
    writePrivateRecording({
      ...asset,
      objectKey: asset.objectKey.replace("/library/", "/recordings/"),
    }),
  ).rejects.toMatchObject({ status: 400 });
  await expect(
    writePrivateLibraryAsset({ ...asset, objectKey: asset.objectKey.replace(".pdf", ".glb") }),
  ).rejects.toMatchObject({ status: 400 });
});
