import { createDefaultXRLayout, type XRWorkspaceData } from "../../apps/web/src/lib/contracts/xr-workspace";

// Explicit fixture content for the isolated component harness, never application auth/data.
export const TEST_PROJECT_ID = "b4000000-0000-4000-8000-000000000001";
export const TEST_ASSET_IDS = ["c4000001-0000-4000-8000-000000000001", "c4000002-0000-4000-8000-000000000002"];
export const TEST_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMwqfj2HwAFKAKi8NmfRgAAAABJRU5ErkJggg==";
// A visible triangle with one embedded buffer, no external resources or extensions.
const TEST_MODEL_DOCUMENT = {
  asset: { version: "2.0" },
  buffers: [{ byteLength: 36, uri: "data:application/octet-stream;base64,AAAAvwAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAgD8AAAAA" }],
  bufferViews: [{ buffer: 0, byteLength: 36 }],
  accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [-0.5, 0, 0], max: [0.5, 1, 0] }],
  materials: [{ doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [0.2, 0.45, 0.95, 1], metallicFactor: 0, roughnessFactor: 1 } }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
  nodes: [{ mesh: 0 }],
  scenes: [{ nodes: [0] }],
  scene: 0,
};
export const TEST_GLTF = JSON.stringify(TEST_MODEL_DOCUMENT);

export function createTestGLB(): Uint8Array {
  const encoded = new TextEncoder().encode(JSON.stringify({ ...TEST_MODEL_DOCUMENT, buffers: [{ byteLength: 36 }] }));
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

export function createMediaWorkspaceFixture(
  asset: Omit<XRWorkspaceData["content"]["assets"][number], "id">,
): XRWorkspaceData {
  const fixture = createWorkspaceFixture();
  fixture.content.assets = [{ id: TEST_ASSET_IDS[0], ...asset }];
  fixture.workspace.layout = createDefaultXRLayout(fixture.content);
  return fixture;
}

export function createWorkspaceFixture(canEdit = true): XRWorkspaceData {
  const content: XRWorkspaceData["content"] = {
    brief: null, artifacts: [], reviews: [],
    assets: TEST_ASSET_IDS.map(id => ({ id, mimeType: "image/png", byteSize: 70, width: 1, height: 1, durationSeconds: null })),
  };
  return {
    project: { id: TEST_PROJECT_ID, name: "Component test project", objective: "Exercise real workspace UI with explicit test fixtures. No live account or provider is connected." },
    canEdit,
    content,
    workspace: {
      id: "d4000000-0000-4000-8000-000000000001", projectId: TEST_PROJECT_ID, version: 1,
      layout: createDefaultXRLayout(content), updatedAt: "2026-11-12T00:00:00.000Z",
    },
  };
}
