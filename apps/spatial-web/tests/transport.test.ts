import { describe, expect, it } from "vitest";
import { parseBootstrap, assetPreviewKind, createSpatialApi } from "../src/lib/api";
import type { AssetSummary } from "../../../packages/api-contract/generated/models";

const id = "11111111-1111-4111-8111-111111111111";
const asset: AssetSummary = { id, projectId: id, mimeType: "model/gltf-binary", byteSize: 100, width: null, height: null, durationSeconds: null, createdAt: "2026-11-12T00:00:00Z", nativeContentUrl: null, contentUrl: `/api/v1/assets/${id}/content` };
const wrap = (data: unknown) => ({ ok: true, data, requestId: "request_123" });
const scene = { projectId: id, sceneId: id, revision: 0, document: { sceneId: id, version: 1, objects: [] }, canEdit: false, updatedAt: null };

describe("spatial transport boundary", () => {
  it("validates all project-owned bootstrap payloads and rejects a foreign asset", () => {
    const project = wrap({ project: { id, name: "Studio", objective: "Arrange assets", sample: false, createdAt: "2026-11-12T00:00:00Z" } });
    expect(parseBootstrap(id, project, wrap({ assets: [asset], hasMore: false }), wrap({ scene })).snapshot.canEdit).toBe(false);
    expect(() => parseBootstrap(id, project, wrap({ assets: [{ ...asset, projectId: "22222222-2222-4222-8222-222222222222" }], hasMore: false }), wrap({ scene }))).toThrow();
  });
  it("supports bounded same-origin GLB and images and keeps other assets explicit", () => {
    expect(assetPreviewKind(asset)).toBe("model");
    expect(assetPreviewKind({ ...asset, mimeType: "image/png", width: 400, height: 400 })).toBe("image");
    expect(assetPreviewKind({ ...asset, contentUrl: "https://example.com/private.glb" })).toBe(null);
    expect(assetPreviewKind({ ...asset, mimeType: "model/vnd.usdz+zip" })).toBe(null);
    expect(assetPreviewKind({ ...asset, byteSize: 21 * 1024 * 1024 })).toBe(null);
  });
  it("saves only to relative generated routes with no-store and the expected CAS revision", async () => {
    let captured: { path: string; init: RequestInit } | undefined;
    const fetcher = (async (path, init) => {
      captured = { path: String(path), init: init ?? {} };
      return Response.json(wrap({ scene: { ...scene, revision: 1 } }));
    }) as typeof fetch;
    const api = createSpatialApi(fetcher);
    const saved = await api.save(id, { expectedRevision: 0, document: scene.document as typeof scene.document & { version: 1 } });
    expect(saved.revision).toBe(1);
    expect(captured?.path).toBe(`/api/v1/projects/${id}/spatial-scene`);
    expect(captured?.init.cache).toBe("no-store");
    expect(captured?.init.credentials).toBe("same-origin");
    expect(JSON.parse(String(captured?.init.body)).expectedRevision).toBe(0);
  });
});
