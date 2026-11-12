import { describe, expect, it } from "vitest";
import { CreateImageGenerationSchema, CreateImageUploadSchema } from "@/lib/contracts/creation";

const projectId = "c1000000-0000-4000-8000-000000000001";
const idempotencyKey = "c1000000-0000-4000-8000-000000000002";
describe("private creation request boundaries", () => {
  it("accepts a bounded image request and rejects caller-selected provider URLs or storage keys", () => {
    const input = { projectId, idempotencyKey, prompt: "An ivory product photograph", modelId: "gemini-3.1-flash-image", aspectRatio: "4:5", referenceAssetId: null };
    expect(CreateImageGenerationSchema.parse(input)).toEqual(input);
    expect(CreateImageGenerationSchema.safeParse({ ...input, providerUrl: "https://attacker.invalid" }).success).toBe(false);
    expect(CreateImageGenerationSchema.safeParse({ ...input, objectKey: "another-project/private.png" }).success).toBe(false);
    expect(CreateImageGenerationSchema.safeParse({ ...input, prompt: " ", referenceAssetId: "other" }).success).toBe(false);
    expect(CreateImageGenerationSchema.safeParse({ ...input, prompt: "x".repeat(4001) }).success).toBe(false);
  });
  it("bounds image uploads and requires actual SHA-256 identity", () => {
    const input = { projectId, idempotencyKey, fileName: "reference.png", mimeType: "image/png", byteSize: 256, checksumSha256: "a".repeat(64) };
    expect(CreateImageUploadSchema.parse(input)).toEqual(input);
    for (const patch of [{ byteSize: 20 * 1024 * 1024 + 1 }, { mimeType: "image/svg+xml" }, { checksumSha256: "not-a-hash" }, { fileName: "private\u0000.png" }, { objectKey: "caller-key" }]) {
      expect(CreateImageUploadSchema.safeParse({ ...input, ...patch }).success).toBe(false);
    }
  });
});
