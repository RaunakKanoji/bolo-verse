import { expect, it } from "vitest";
import { validatePreviewAsset, MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import { imageDimensions } from "@/lib/contracts/xr-image-metadata";
const json = (value: unknown) => new TextEncoder().encode(JSON.stringify(value));
it("allows self-contained glTF and rejects external nested resource requests", () => {
  expect(() =>
    validatePreviewAsset(
      json({
        asset: { version: "2.0" },
        buffers: [{ uri: "data:application/octet-stream;base64,AA==", byteLength: 1 }],
      }),
      "model/gltf+json",
    ),
  ).not.toThrow();
  for (const uri of [
    "https://example.com/private",
    "/api/projects",
    "../secret.bin",
    "blob:unsafe",
  ]) {
    expect(() =>
      validatePreviewAsset(
        json({ asset: { version: "2.0" }, images: [{ uri }] }),
        "model/gltf+json",
      ),
    ).toThrow(/self-contained/);
  }
});
it("validates binary glTF headers and JSON before model loading", () => {
  expect(() => validatePreviewAsset(new Uint8Array([1, 2, 3]), "model/gltf-binary")).toThrow();
  const metadata = new TextEncoder().encode(
    JSON.stringify({ asset: { version: "2.0" } }).padEnd(32, " "),
  );
  const bytes = new Uint8Array(20 + metadata.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, metadata.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.set(metadata, 20);
  expect(() => validatePreviewAsset(bytes, "model/gltf-binary")).not.toThrow();
});
it("rejects active document formats, oversized files and mismatched image signatures", () => {
  expect(() => validatePreviewAsset(json({}), "text/html")).toThrow(/supported/);
  expect(() => validatePreviewAsset(new Uint8Array(MAX_PREVIEW_BYTES + 1), "image/png")).toThrow(
    /large/,
  );
  expect(() => validatePreviewAsset(json({}), "image/png")).toThrow(/match/);
});

const encodeData = (bytes: Uint8Array, mime = "application/octet-stream") =>
  `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
function pngHeader(width: number, height: number) {
  const bytes = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=",
      "base64",
    ),
  );
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}
function triangle() {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  return {
    asset: { version: "2.0" },
    buffers: [{ byteLength: 36, uri: encodeData(new Uint8Array(positions.buffer)) }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: "VEC3",
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
    ],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
  };
}

it("rejects the small-JSON implicit-accessor allocation bomb without allocating geometry", () => {
  const document = {
    asset: { version: "2.0" },
    accessors: Array.from({ length: 200 }, () => ({
      componentType: 5126,
      count: 1_000_000,
      type: "VEC3",
    })),
    meshes: Array.from({ length: 200 }, (_, index) => ({
      primitives: [{ attributes: { POSITION: index } }],
    })),
    nodes: Array.from({ length: 200 }, (_, mesh) => ({ mesh })),
    scenes: [{ nodes: Array.from({ length: 200 }, (_, index) => index) }],
  };
  expect(json(document).byteLength).toBeLessThan(40_000);
  expect(() => validatePreviewAsset(json(document), "model/gltf+json")).toThrow(/budget|limit/);
});
it("rejects sparse and unsupported multiplying model features", () => {
  for (const document of [
    {
      ...triangle(),
      accessors: [{ componentType: 5126, count: 100, type: "VEC3", sparse: { count: 1 } }],
    },
    { ...triangle(), skins: [{}] },
    { ...triangle(), animations: [{}] },
    {
      ...triangle(),
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, targets: [{ POSITION: 0 }] }] }],
    },
    {
      ...triangle(),
      nodes: [
        { mesh: 0, extensions: { EXT_mesh_gpu_instancing: { attributes: { TRANSLATION: 0 } } } },
      ],
    },
  ])
    expect(() => validatePreviewAsset(json(document), "model/gltf+json")).toThrow();
});
it("bounds aggregate accessors, implicit arrays, buffer lengths and buffer-view copies", () => {
  for (const document of [
    {
      asset: { version: "2.0" },
      accessors: Array.from({ length: 3 }, () => ({
        componentType: 5126,
        count: 100_000,
        type: "VEC3",
      })),
    },
    { asset: { version: "2.0" }, accessors: [{ componentType: 5126, count: -1, type: "VEC3" }] },
    {
      asset: { version: "2.0" },
      buffers: [{ byteLength: 1_000_000_000, uri: encodeData(new Uint8Array([0])) }],
    },
    {
      ...triangle(),
      bufferViews: Array.from({ length: 257 }, () => ({ buffer: 0, byteLength: 36 })),
    },
    { ...triangle(), accessors: [{ bufferView: 0, componentType: 5126, count: 4, type: "VEC3" }] },
  ])
    expect(() => validatePreviewAsset(json(document), "model/gltf+json")).toThrow();
});
it("bounds primitive fanout and rejects cyclic or multiply-parented node graphs", () => {
  for (const nodes of [
    [{ children: [0] }],
    [{ children: [1] }, { children: [0] }],
    [{ children: [2] }, { children: [2] }, {}],
    [{ children: [1, 1] }, {}],
  ]) {
    expect(() =>
      validatePreviewAsset(json({ asset: { version: "2.0" }, nodes }), "model/gltf+json"),
    ).toThrow();
  }
  expect(() =>
    validatePreviewAsset(
      json({
        ...triangle(),
        meshes: [
          { primitives: Array.from({ length: 201 }, () => ({ attributes: { POSITION: 0 } })) },
        ],
      }),
      "model/gltf+json",
    ),
  ).toThrow();
  expect(() =>
    validatePreviewAsset(
      json({
        ...triangle(),
        nodes: Array.from({ length: 201 }, () => ({ mesh: 0 })),
        scenes: [{ nodes: Array.from({ length: 201 }, (_, index) => index) }],
      }),
      "model/gltf+json",
    ),
  ).toThrow();
});
it("checks embedded image dimensions before image or model decoding", () => {
  const image = pngHeader(100_000, 100_000);
  expect(() =>
    validatePreviewAsset(
      json({
        ...triangle(),
        images: [{ uri: encodeData(image, "image/png") }],
        textures: [{ source: 0 }],
      }),
      "model/gltf+json",
    ),
  ).toThrow(/dimension|pixel|texture|large/i);
  const packed = new Uint8Array(36 + image.length);
  packed.set(new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer));
  packed.set(image, 36);
  expect(() =>
    validatePreviewAsset(
      json({
        ...triangle(),
        buffers: [{ byteLength: packed.length, uri: encodeData(packed) }],
        bufferViews: [
          { buffer: 0, byteLength: 36 },
          { buffer: 0, byteOffset: 36, byteLength: image.length },
        ],
        images: [{ bufferView: 1, mimeType: "image/png" }],
        textures: [{ source: 0 }],
      }),
      "model/gltf+json",
    ),
  ).toThrow(/dimension|pixel|texture|large/i);
});
it("bounds total decoded texture bytes, including repeated image references", () => {
  const document = {
    ...triangle(),
    images: [{ uri: encodeData(pngHeader(4096, 4096), "image/png") }],
    textures: [{ source: 0 }, { source: 0 }],
  };
  expect(() => validatePreviewAsset(json(document), "model/gltf+json")).toThrow(/texture|budget/i);
});
it("retains a real small self-contained static triangle with a bounded PNG texture", () => {
  const document = {
    ...triangle(),
    images: [{ uri: encodeData(pngHeader(1, 1), "image/png") }],
    textures: [{ source: 0 }],
    materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }],
  };
  expect(() => validatePreviewAsset(json(document), "model/gltf+json")).not.toThrow();
});

it("retains a real GLB triangle whose accessors resolve inside the binary chunk", () => {
  const document = { ...triangle(), buffers: [{ byteLength: 36 }] };
  const encoded = json(document);
  const metadata = new Uint8Array(Math.ceil(encoded.length / 4) * 4).fill(32);
  metadata.set(encoded);
  const binary = new Uint8Array(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer);
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
  expect(() => validatePreviewAsset(bytes, "model/gltf-binary")).not.toThrow();
});

it("bounds overlapping buffer-view copies even when the source buffer is small", () => {
  const byteLength = 1024 * 1024;
  const document = {
    asset: { version: "2.0" },
    buffers: [{ byteLength, uri: encodeData(new Uint8Array(byteLength)) }],
    bufferViews: Array.from({ length: 33 }, () => ({ buffer: 0, byteLength })),
  };
  expect(() => validatePreviewAsset(json(document), "model/gltf+json")).toThrow(/budget|limit/);
});

it("bounds node depth even when children precede parents in the file", () => {
  const nodes = Array.from({ length: 40 }, (_, index) => (index ? { children: [index - 1] } : {}));
  expect(() =>
    validatePreviewAsset(json({ asset: { version: "2.0" }, nodes }), "model/gltf+json"),
  ).toThrow(/limit|budget/);
});

it("rejects inherited accessor type names rather than bypassing allocation arithmetic", () => {
  for (const type of ["constructor", "toString", "__proto__"])
    expect(() =>
      validatePreviewAsset(
        json({ asset: { version: "2.0" }, accessors: [{ componentType: 5126, count: 1, type }] }),
        "model/gltf+json",
      ),
    ).toThrow();
});

it("rejects high bit-depth PNGs and duplicate image dimension headers", () => {
  const deep = pngHeader(1, 1);
  deep[24] = 16;
  expect(() => imageDimensions(deep, "image/png")).toThrow();
  const source = pngHeader(1, 1);
  const duplicate = new Uint8Array(source.length + 25);
  duplicate.set(source.subarray(0, 33));
  duplicate.set(pngHeader(100_000, 100_000).subarray(8, 33), 33);
  duplicate.set(source.subarray(33), 58);
  expect(() => imageDimensions(duplicate, "image/png")).toThrow();
});

it.each([
  [
    "image/jpeg",
    "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCYAqoa/9k=",
  ],
  [
    "image/webp",
    "UklGRjoAAABXRUJQVlA4IC4AAADQAQCdASoCAAMAAUAmJaACdLoB+AADsAD+5fo/+2h/Wh/Wh/2sf/mwNUWb5aAA",
  ],
  ["image/gif", "R0lGODlhAgADAIAAAExpcTR49iH5BAUAAAAALAAAAAACAAMAAAICjF8AOw=="],
])("reads real small %s dimensions without invoking a pixel decoder", (mime, base64) => {
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  expect(imageDimensions(bytes, mime)).toEqual({ width: 2, height: 3 });
  expect(() => validatePreviewAsset(bytes, mime)).not.toThrow();
});

it("rejects truncated and excessive image headers before decoding", () => {
  expect(() => imageDimensions(pngHeader(8193, 1), "image/png")).toThrow(/dimension/);
  expect(() => imageDimensions(pngHeader(1, 1).slice(0, 20), "image/png")).toThrow();
  const gif = Uint8Array.from(
    Buffer.from("R0lGODlhAgADAIAAAExpcTR49iH5BAUAAAAALAAAAAACAAMAAAICjF8AOw==", "base64"),
  );
  new DataView(gif.buffer).setUint16(6, 65_000, true);
  expect(() => imageDimensions(gif, "image/gif")).toThrow(/dimension/);
});
