import { afterEach, expect, it, vi } from "vitest";
import { loadVideoPreview } from "@/features/video/private-preview";
const id = "e67ea056-e196-445c-8c9b-55b2058a5d58";
const asset = {
  id,
  projectId: id,
  contentUrl: `/api/v1/assets/${id}/content`,
  mimeType: "video/webm",
  byteSize: 8,
};
afterEach(() => vi.unstubAllGlobals());
it("never fetches an external or mismatched private source capability", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(
    loadVideoPreview(
      { ...asset, contentUrl: "https://evil.test/private" },
      new AbortController().signal,
    ),
  ).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it("rejects incomplete and signature-mismatched media before making a blob URL", async () => {
  vi.stubGlobal(
    "fetch",
    async () => new Response(new Uint8Array(8), { headers: { "content-type": "video/webm" } }),
  );
  await expect(loadVideoPreview(asset, new AbortController().signal)).rejects.toThrow(/bytes/i);
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), {
        headers: { "content-type": "video/webm" },
      }),
  );
  await expect(loadVideoPreview(asset, new AbortController().signal)).rejects.toThrow(
    /incomplete/i,
  );
});
it("creates a caller-owned blob only for exact bounded private media", async () => {
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]), {
        headers: { "content-type": "video/webm" },
      }),
  );
  const url = await loadVideoPreview(asset, new AbortController().signal);
  expect(url).toMatch(/^blob:/);
  URL.revokeObjectURL(url);
});
