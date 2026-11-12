import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const storage = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const original = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return { ...original, S3Client: class extends original.S3Client { send = storage.send; destroy = storage.destroy; } };
});
import { writePrivateImage } from "@/server/providers/r2-ingestion";
const bytes = Uint8Array.of(1, 2, 3);
const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
const input = { objectKey: "private/images/final.png", bytes, mimeType: "image/png", checksumSha256 };
beforeEach(() => {
  vi.stubEnv("R2_ACCOUNT_ID", "a".repeat(32)); vi.stubEnv("R2_ACCESS_KEY_ID", "test-id");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret"); vi.stubEnv("R2_BUCKET", "private-assets");
  storage.send.mockReset().mockResolvedValue({}); storage.destroy.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("immutable private image writes", () => {
  it("atomically requires an absent key and sends the supported Content-MD5 checksum", async () => {
    await writePrivateImage(input);
    expect(storage.send.mock.calls[0][0].input).toMatchObject({
      Bucket: "private-assets", Key: input.objectKey, Body: bytes,
      ContentType: "image/png", ContentLength: bytes.length, IfNoneMatch: "*",
      ContentMD5: createHash("md5").update(bytes).digest("base64"),
    });
    expect(storage.send.mock.calls[0][0].input).not.toHaveProperty("ChecksumSHA256");
    expect(storage.send.mock.calls[0][0].input).not.toHaveProperty("ChecksumAlgorithm");
    expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("rejects inconsistent checksums before accessing storage", async () => {
    await expect(writePrivateImage({ ...input, checksumSha256: "0".repeat(64) })).rejects.toMatchObject({ status: 400 });
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("never overwrites an existing object after a conditional conflict", async () => {
    storage.send.mockRejectedValue({ name: "PreconditionFailed", $metadata: { httpStatusCode: 412 } });
    await expect(writePrivateImage(input)).rejects.toMatchObject({ status: 409 });
    expect(storage.send).toHaveBeenCalledOnce(); expect(storage.destroy).toHaveBeenCalledOnce();
  });
  it("requires private storage configuration and bounded image inputs", async () => {
    await expect(writePrivateImage({ ...input, mimeType: "text/html" })).rejects.toMatchObject({ status: 400 });
    vi.stubEnv("R2_BUCKET", "");
    await expect(writePrivateImage(input)).rejects.toMatchObject({ status: 503, code: "PROVIDER_UNCONFIGURED" });
    expect(storage.send).not.toHaveBeenCalled();
  });
});

// Signing is local cryptography; this test never contacts the storage service.
describe("private upload reservations", () => {
  it("signs a PUT for one exact key, MIME and size for at most ten minutes", async () => {
    const { signImageUpload } = await import("@/server/providers/r2-ingestion");
    const signed = await signImageUpload({ objectKey: "staging/images/session.png", mimeType: input.mimeType, byteSize: bytes.length, checksumSha256, expiresInSeconds: 600 });
    const url = new URL(signed.uploadUrl);
    expect(url.hostname).toBe(`${"a".repeat(32)}.r2.cloudflarestorage.com`);
    expect(url.pathname).toBe("/private-assets/staging/images/session.png");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("if-none-match");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).not.toContain("checksum");
    expect([...url.searchParams.keys()].some((key) => /checksum/i.test(key))).toBe(false);
    expect(Object.keys(signed.headers).some((key) => /checksum/i.test(key))).toBe(false);
    expect(signed.headers).toMatchObject({ "Content-Type": "image/png" });
    expect(storage.send).not.toHaveBeenCalled();
  });
  it("refuses invalid reservation sizes, MIME and expiry bounds", async () => {
    const { signImageUpload } = await import("@/server/providers/r2-ingestion");
    for (const override of [{ byteSize: 0 }, { byteSize: 20 * 1024 * 1024 + 1 }, { mimeType: "image/svg+xml" }, { expiresInSeconds: 601 }]) {
      await expect(signImageUpload({ objectKey: "staging/images/session.png", mimeType: input.mimeType, byteSize: bytes.length, checksumSha256, expiresInSeconds: 600, ...override })).rejects.toMatchObject({ status: 400 });
    }
  });
});
