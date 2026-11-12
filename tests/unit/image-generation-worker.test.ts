import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ claim: vi.fn(), read: vi.fn(), started: vi.fn(), complete: vi.fn(), fail: vi.fn(), recover: vi.fn(), generate: vi.fn(), readImage: vi.fn(), write: vi.fn() }));
vi.mock("@/server/db/image-generations", () => ({ claimImageGeneration: mocks.claim, readClaimedImageGeneration: mocks.read, markImageProviderStarted: mocks.started, completeImageGeneration: mocks.complete, failImageGeneration: mocks.fail, recoverExpiredImageGenerations: mocks.recover }));
vi.mock("@/server/providers/gemini-image", () => ({ createGeminiImageProvider: () => ({ generate: mocks.generate }) }));
vi.mock("@/server/providers/r2-ingestion", () => ({ readStagedImage: mocks.readImage, writePrivateImage: mocks.write }));
import { processImageGeneration } from "@/server/services/image-generation";
const image = { bytes: new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64")), mimeType: "image/png" };
const lease = new Date(Date.now() + 300_000);
const claim = { job: { id: "job", projectId: "project", leaseExpiresAt: lease }, request: { ownerClerkId: "owner", prompt: "Sunlight", modelId: "gemini-3.1-flash-image", aspectRatio: "16:9", referenceAssetId: null }, reference: null };
beforeEach(() => {
  vi.resetAllMocks(); mocks.claim.mockResolvedValue(claim); mocks.read.mockResolvedValue(claim); mocks.started.mockResolvedValue(true); mocks.generate.mockResolvedValue(image); mocks.write.mockResolvedValue(undefined); mocks.complete.mockResolvedValue({ status: "ready" }); mocks.fail.mockResolvedValue(true);
});
describe("image worker lifecycle", () => {
  it("stores validated immutable bytes and publishes only through the owned lease", async () => {
    expect(await processImageGeneration("job")).toBe(true);
    expect(mocks.started).toHaveBeenCalledWith("job", lease);
    expect(mocks.generate).toHaveBeenCalledTimes(1);
    expect(mocks.write).toHaveBeenCalledWith(expect.objectContaining({ objectKey: "private/generated/project/job", bytes: image.bytes, checksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(mocks.complete).toHaveBeenCalledWith("job", lease, expect.objectContaining({ width: 1, height: 1, byteSize: image.bytes.length }));
  });
  it("does not dispatch for an already claimed job or duplicate provider-start CAS", async () => {
    mocks.claim.mockResolvedValueOnce(null); expect(await processImageGeneration("job")).toBe(false);
    mocks.started.mockResolvedValueOnce(false); await processImageGeneration("job");
    expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.write).not.toHaveBeenCalled();
  });
  it("discards results when cancelled or revoked during the provider await", async () => {
    mocks.generate.mockImplementationOnce(async () => { mocks.read.mockResolvedValue(null); return image; });
    await processImageGeneration("job");
    expect(mocks.write).not.toHaveBeenCalled(); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("does not publish when cancellation occurs during storage", async () => {
    mocks.write.mockImplementationOnce(async () => { mocks.read.mockResolvedValue(null); });
    await processImageGeneration("job"); expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("validates bounded reference metadata and rechecks access before provider dispatch", async () => {
    const referenced = { ...claim, request: { ...claim.request, referenceAssetId: "reference" }, reference: { id: "reference", projectId: "project", ownerClerkId: "owner", status: "ready", objectKey: "private/ref", mimeType: "image/png", byteSize: image.bytes.length, checksumSha256: null } };
    mocks.claim.mockResolvedValue(referenced); mocks.read.mockResolvedValue(referenced); mocks.readImage.mockImplementation(async () => { mocks.read.mockResolvedValue(null); return image; });
    await processImageGeneration("job"); expect(mocks.generate).not.toHaveBeenCalled();
  });
  it("sanitizes ambiguous failures without re-dispatching or auto-retrying", async () => {
    mocks.generate.mockRejectedValue(new Error("secret-key signedlink prompt"));
    await processImageGeneration("job");
    expect(mocks.generate).toHaveBeenCalledTimes(1); expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.fail).toHaveBeenCalledWith("job", lease, "GENERATION_FAILED", expect.not.stringMatching(/secret-key|signedlink|prompt/));
  });
});
