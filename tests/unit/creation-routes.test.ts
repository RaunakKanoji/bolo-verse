import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ subject: vi.fn(), create: vi.fn(), list: vi.fn(), read: vi.fn(), cancel: vi.fn(), after: vi.fn(), worker: vi.fn(), capabilities: vi.fn() }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/server/auth/api-identity", () => ({ getV1Subject: mocks.subject }));
vi.mock("@/server/providers/gemini-image", () => ({ getImageGenerationCapabilities: mocks.capabilities }));
vi.mock("@/server/services/image-generation", () => ({ processImageGeneration: mocks.worker }));
vi.mock("@/server/db/image-generations", () => ({ createImageGeneration: mocks.create, listImageGenerations: mocks.list, readImageGeneration: mocks.read, cancelImageGeneration: mocks.cancel }));
import { POST } from "@/app/api/v1/generations/route";
import { GET as LIST } from "@/app/api/v1/projects/[projectId]/generations/route";
import { GET as READ } from "@/app/api/v1/generations/[jobId]/route";
import { POST as CANCEL } from "@/app/api/v1/generations/[jobId]/cancel/route";
import { BoundaryError } from "@/server/auth/errors";
const id = "c1000000-0000-4000-8000-000000000001";
const input = { projectId: id, idempotencyKey: id, prompt: "A fragrance", modelId: "gemini-3.1-flash-image", aspectRatio: "16:9", referenceAssetId: null };
const request = (body: unknown) => new Request("http://localhost:3000/api/v1/generations", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" }, body: JSON.stringify(body) });
beforeEach(() => { vi.resetAllMocks(); mocks.subject.mockResolvedValue("owner"); mocks.capabilities.mockReturnValue({ availability: "configured", models: [{ id: input.modelId }] }); mocks.create.mockResolvedValue({ id, status: "queued" }); mocks.list.mockResolvedValue([]); mocks.read.mockResolvedValue({ id }); mocks.cancel.mockResolvedValue({ id, status: "cancelled" }); });
describe("creation route boundaries", () => {
  it("persists before scheduling, authenticates mutations and responds without provider latency", async () => {
    const response = await POST(request(input)); expect(response.status).toBe(202); expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.subject).toHaveBeenCalledWith(expect.any(Request), { mutation: true });
    expect(mocks.create).toHaveBeenCalledWith("owner", input); expect(mocks.after).toHaveBeenCalledOnce(); expect(mocks.worker).not.toHaveBeenCalled();
    await mocks.after.mock.calls[0][0](); expect(mocks.worker).toHaveBeenCalledWith(id);
  });
  it("rejects unknown fields, unavailable models and unauthenticated requests before persistence", async () => {
    expect((await POST(request({ ...input, providerUrl: "https://attacker.invalid" }))).status).toBe(400);
    mocks.capabilities.mockReturnValue({ availability: "unconfigured", models: [] }); expect((await POST(request(input))).status).toBe(503);
    mocks.subject.mockRejectedValue(new BoundaryError(401, "UNAUTHORIZED", "Sign in")); expect((await POST(request(input))).status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.after).not.toHaveBeenCalled();
  });
  it("validates private resource IDs and cancellation bodies", async () => {
    const get = new Request("http://localhost:3000/api/v1/generations");
    expect((await LIST(get, { params: Promise.resolve({ projectId: id }) })).status).toBe(200);
    expect((await READ(get, { params: Promise.resolve({ jobId: "bad" }) })).status).toBe(400);
    expect((await CANCEL(request({ force: true }), { params: Promise.resolve({ jobId: id }) })).status).toBe(400);
    expect((await CANCEL(request({}), { params: Promise.resolve({ jobId: id }) })).status).toBe(200);
    expect(mocks.cancel).toHaveBeenCalledWith("owner", id);
  });
});
