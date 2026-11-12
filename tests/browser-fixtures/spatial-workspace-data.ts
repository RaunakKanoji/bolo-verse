import type { AssetSummary, ProjectSummary } from "../../packages/api-contract/generated/models";
import { SpatialSceneSnapshotSchema, type SpatialSceneSnapshot } from "@shape/scene-schema";

// Bounded, fabricated data for a localhost-only component fixture. These IDs
// never grant access to a project or asset in either production application.
export const SPATIAL_PROJECT_ID = "b5000000-0000-4000-8000-000000000001";
export const SPATIAL_ASSET_IDS = {
  model: "c5000001-0000-4000-8000-000000000001",
  image: "c5000002-0000-4000-8000-000000000002",
  unsupported: "c5000003-0000-4000-8000-000000000003",
};
export const SPATIAL_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMwqfj2HwAFKAKi8NmfRgAAAABJRU5ErkJggg==";

/** One visible triangle; no remote buffers, textures, extensions or scripts. */
export function createSpatialGLB(): Uint8Array {
  const document = {
    asset: { version: "2.0" },
    buffers: [{ byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-0.5, 0, 0], max: [0.5, 1, 0] }],
    materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.2, 0.45, 0.95, 1], metallicFactor: 0, roughnessFactor: 1 } }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    nodes: [{ mesh: 0 }], scenes: [{ nodes: [0] }], scene: 0,
  };
  const encoded = new TextEncoder().encode(JSON.stringify(document));
  const metadata = new Uint8Array(Math.ceil(encoded.length / 4) * 4).fill(32);
  metadata.set(encoded);
  const binary = new Uint8Array(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0]).buffer);
  const bytes = new Uint8Array(28 + metadata.length + binary.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, metadata.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(metadata, 20);
  view.setUint32(20 + metadata.length, binary.length, true);
  view.setUint32(24 + metadata.length, 0x004e4942, true);
  bytes.set(binary, 28 + metadata.length);
  return bytes;
}

export type SpatialWorkspaceFixture = {
  project: ProjectSummary;
  assets: AssetSummary[];
  snapshot: SpatialSceneSnapshot;
  hasMoreAssets: boolean;
  sessionFixture?: boolean;
};

export function createSpatialFixture(canEdit = true): SpatialWorkspaceFixture {
  const createdAt = "2026-11-12T00:00:00.000Z";
  const asset = (id: string, mimeType: string, byteSize: number, image = false): AssetSummary => ({
    id, projectId: SPATIAL_PROJECT_ID, mimeType, byteSize,
    width: image ? 1 : null, height: image ? 1 : null, durationSeconds: null,
    createdAt, contentUrl: mimeType === "model/vnd.usdz+zip" ? null : `/api/v1/assets/${id}/content`, nativeContentUrl: null,
  });
  return {
    project: { id: SPATIAL_PROJECT_ID, name: "Spatial fixture project", objective: "Exercise the real canonical editor with explicit HTTP fixtures.", sample: false, createdAt },
    assets: [
      asset(SPATIAL_ASSET_IDS.model, "model/gltf-binary", createSpatialGLB().length),
      asset(SPATIAL_ASSET_IDS.image, "image/png", 70, true),
      asset(SPATIAL_ASSET_IDS.unsupported, "model/vnd.usdz+zip", 100),
    ],
    snapshot: SpatialSceneSnapshotSchema.parse({
      projectId: SPATIAL_PROJECT_ID, sceneId: SPATIAL_PROJECT_ID, revision: 1,
      document: { sceneId: SPATIAL_PROJECT_ID, version: 1, objects: [] }, updatedAt: createdAt, canEdit,
    }),
    hasMoreAssets: false,
  };
}
