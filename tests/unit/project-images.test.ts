import { expect, it, vi, afterEach } from "vitest";
import { listProjectImages, readProjectImage } from "@/features/projects/project-images";
const projectId = "11111111-1111-4111-8111-111111111111";
const assetId = "22222222-2222-4222-8222-222222222222";
const asset = { id: assetId, projectId, mimeType: "image/png", byteSize: 3, width: 1, height: 1, durationSeconds: null, createdAt: "2026-11-13T10:00:00.000Z", contentUrl: `/api/v1/assets/${assetId}/content`, nativeContentUrl: null };
afterEach(() => vi.unstubAllGlobals());
it("rejects a foreign catalog or mismatched private content path", async () => {
  for (const change of [{ projectId: assetId }, { contentUrl: `/api/v1/assets/${projectId}/content` }]) {
    vi.stubGlobal("fetch", async () => Response.json({ ok: true, data: { assets: [{ ...asset, ...change }], hasMore: false }, requestId: "test" }));
    await expect(listProjectImages(projectId, new AbortController().signal)).rejects.toThrow();
  }
});
it("bounds streamed private image bytes and recognizes access loss without decoding", async () => {
  vi.stubGlobal("fetch", async () => new Response(new Uint8Array(4), { headers: { "Content-Type": "image/png" } }));
  await expect(readProjectImage(asset, new AbortController().signal)).rejects.toThrow();
  vi.stubGlobal("fetch", async () => new Response(null, { status: 403 }));
  await expect(readProjectImage(asset, new AbortController().signal)).rejects.toMatchObject({ status: 403 });
});
