import { imageDimensions } from "./xr-image-metadata";

export const MAX_PREVIEW_BYTES = 20 * 1024 * 1024;
export const PREVIEW_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "model/gltf-binary",
  "model/gltf+json",
] as const;
export function previewSupported(mimeType: string, byteSize: number) {
  return (
    (PREVIEW_MIME_TYPES as readonly string[]).includes(mimeType) &&
    byteSize > 0 &&
    byteSize <= MAX_PREVIEW_BYTES
  );
}

const MAX_GLTF_JSON_BYTES = 2 * 1024 * 1024;
const MAX_ACCESSOR_ENTRIES = 250_000;
const MAX_DECODED_GEOMETRY_BYTES = 32 * 1024 * 1024;
const MAX_TEXTURE_BYTES = 64 * 1024 * 1024;

type Definition = Record<string, unknown>;
const invalidModel = (): never => {
  throw new Error("Invalid or unsupported static glTF preview structure.");
};
const budget = (): never => {
  throw new Error("This model exceeds the preview allocation budget or complexity limit.");
};
const record = (value: unknown): Definition =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Definition)
    : invalidModel();
const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max
    ? value
    : invalidModel();
const definitions = (root: Definition, key: string, max: number): Definition[] => {
  if (root[key] === undefined) return [];
  if (!Array.isArray(root[key]) || root[key].length > max) return budget();
  return root[key].map(record);
};
const reference = (value: unknown, length: number) => integer(value, 0, length - 1);

function decodeDataUri(
  value: unknown,
  allowed: readonly string[],
): { bytes: Uint8Array; mimeType: string } {
  if (typeof value !== "string") return invalidModel();
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=\s]+)$/.exec(value);
  if (!match || !allowed.includes(match[1]))
    throw new Error("Model previews must be self-contained; external resources are not allowed.");
  const base64 = match[2].replace(/\s/g, "");
  if (
    base64.length > Math.ceil(MAX_PREVIEW_BYTES / 3) * 4 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
  )
    return budget();
  const binary = atob(base64);
  return {
    bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    mimeType: match[1],
  };
}

/** A conservative static subset bounds allocations before GLTFLoader sees the document. */
function validateGLTF(value: unknown, binaryChunk?: Uint8Array) {
  const root = record(value);
  if (record(root.asset).version !== "2.0") throw new Error("Only glTF 2.0 is supported.");
  const queue: { value: unknown; depth: number }[] = [{ value: root, depth: 0 }];
  let visited = 0;
  while (queue.length) {
    const current = queue.pop()!;
    if (++visited > 50_000 || current.depth > 40) return budget();
    if (!current.value || typeof current.value !== "object") continue;
    for (const [key, item] of Object.entries(current.value)) {
      // All extensions are excluded, including compression, instancing and texture transforms.
      if (key === "extensions" && Object.keys(record(item)).length)
        throw new Error("Model extensions are not enabled in static previews.");
      if (
        key === "uri" &&
        (typeof item !== "string" ||
          !/^data:(?:application\/octet-stream|image\/(?:png|jpeg|webp|gif));base64,[a-zA-Z0-9+/=\s]+$/.test(
            item,
          ))
      )
        throw new Error(
          "Model previews must be self-contained; external resources are not allowed.",
        );
      if (typeof item === "object") queue.push({ value: item, depth: current.depth + 1 });
    }
  }
  for (const key of ["extensionsUsed", "extensionsRequired", "animations", "skins"] as const) {
    if (root[key] !== undefined && (!Array.isArray(root[key]) || root[key].length))
      throw new Error("Animations, skins and extensions are not enabled in static model previews.");
  }
  const buffers = definitions(root, "buffers", 16),
    views = definitions(root, "bufferViews", 256);
  const accessors = definitions(root, "accessors", 256),
    meshes = definitions(root, "meshes", 200);
  const nodes = definitions(root, "nodes", 256),
    scenes = definitions(root, "scenes", 1);
  const images = definitions(root, "images", 32),
    textures = definitions(root, "textures", 32);
  const materials = definitions(root, "materials", 64),
    samplers = definitions(root, "samplers", 32);
  definitions(root, "cameras", 16);
  const bufferBytes: Uint8Array[] = [];
  let totalBufferBytes = 0;
  for (const [index, buffer] of buffers.entries()) {
    const declared = integer(buffer.byteLength, 1, MAX_PREVIEW_BYTES);
    totalBufferBytes += declared;
    if (totalBufferBytes > MAX_PREVIEW_BYTES) return budget();
    const bytes =
      buffer.uri === undefined
        ? index === 0 && binaryChunk
          ? binaryChunk
          : invalidModel()
        : decodeDataUri(buffer.uri, ["application/octet-stream"]).bytes;
    if (bytes.length < declared || bytes.length > declared + (buffer.uri === undefined ? 3 : 0))
      return invalidModel();
    bufferBytes.push(bytes.subarray(0, declared));
  }
  let viewBytes = 0;
  const slices = views.map((item) => {
    const bytes = bufferBytes[reference(item.buffer, buffers.length)];
    const offset = integer(item.byteOffset ?? 0),
      length = integer(item.byteLength, 1);
    if (offset + length > bytes.length) return invalidModel();
    viewBytes += length;
    if (viewBytes > MAX_DECODED_GEOMETRY_BYTES) return budget();
    if (item.byteStride !== undefined && integer(item.byteStride, 4, 252) % 4 !== 0)
      return invalidModel();
    return bytes.subarray(offset, offset + length);
  });
  const componentBytes: Record<number, number> = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
  };
  const elements: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  let entries = 0,
    decodedBytes = 0;
  const accessorCounts = accessors.map((accessor) => {
    if (accessor.sparse !== undefined)
      throw new Error("Sparse accessors are not enabled in static model previews.");
    const count = integer(accessor.count, 1);
    entries += count;
    if (entries > MAX_ACCESSOR_ENTRIES) return budget();
    const width = componentBytes[integer(accessor.componentType)];
    const itemSize =
      typeof accessor.type === "string" && Object.hasOwn(elements, accessor.type)
        ? elements[accessor.type]
        : 0;
    if (!width || !itemSize) return invalidModel();
    const itemBytes = width * itemSize;
    const offset = integer(accessor.byteOffset ?? 0);
    if (
      offset % width ||
      (accessor.normalized !== undefined && typeof accessor.normalized !== "boolean")
    )
      return invalidModel();
    let stride = itemBytes;
    if (accessor.bufferView !== undefined) {
      const viewIndex = reference(accessor.bufferView, views.length);
      stride = Number(views[viewIndex].byteStride ?? itemBytes);
      if (
        stride < itemBytes ||
        stride % width ||
        offset + (count - 1) * stride + itemBytes > slices[viewIndex].length
      )
        return invalidModel();
    } else if (offset) return invalidModel();
    // Count implicit zero-filled arrays and interleaved spans, not only file bytes.
    decodedBytes += count * Math.max(stride, itemBytes);
    if (decodedBytes > MAX_DECODED_GEOMETRY_BYTES) return budget();
    for (const key of ["min", "max"] as const)
      if (accessor[key] !== undefined) {
        const limits = accessor[key];
        if (
          !Array.isArray(limits) ||
          limits.length !== itemSize ||
          limits.some((item) => typeof item !== "number" || !Number.isFinite(item))
        )
          return invalidModel();
      }
    return count;
  });
  let totalPrimitives = 0;
  const meshCosts = meshes.map((mesh) => {
    if (mesh.weights !== undefined)
      throw new Error("Morph targets are not enabled in static model previews.");
    const primitives = definitions(mesh, "primitives", 200);
    if (!primitives.length) return invalidModel();
    totalPrimitives += primitives.length;
    if (totalPrimitives > 200) return budget();
    let vertices = 0;
    for (const primitive of primitives) {
      if (primitive.targets !== undefined)
        throw new Error("Morph targets are not enabled in static model previews.");
      if (primitive.mode !== undefined && integer(primitive.mode, 0, 6) !== 4)
        throw new Error("Only triangle primitives are enabled in model previews.");
      const attributes = record(primitive.attributes);
      const positionIndex = reference(attributes.POSITION, accessors.length);
      if (accessors[positionIndex].type !== "VEC3") return invalidModel();
      for (const index of Object.values(attributes)) reference(index, accessors.length);
      if (Object.keys(attributes).length > 16) return budget();
      const count =
        primitive.indices === undefined
          ? accessorCounts[positionIndex]
          : accessorCounts[reference(primitive.indices, accessors.length)];
      if (
        primitive.indices !== undefined &&
        accessors[reference(primitive.indices, accessors.length)].type !== "SCALAR"
      )
        return invalidModel();
      vertices += count;
      if (vertices > MAX_ACCESSOR_ENTRIES) return budget();
      if (primitive.material !== undefined) reference(primitive.material, materials.length);
    }
    return { primitives: primitives.length, vertices };
  });
  const parents = new Array<number>(nodes.length).fill(-1);
  const children = nodes.map((node, index) => {
    if (node.skin !== undefined || node.weights !== undefined)
      throw new Error("Skins and morph targets are not enabled in static model previews.");
    if (node.camera !== undefined) reference(node.camera, definitions(root, "cameras", 16).length);
    if (node.mesh !== undefined) reference(node.mesh, meshes.length);
    const childNodes = node.children ?? [];
    if (!Array.isArray(childNodes) || childNodes.length > 32) return budget();
    return childNodes.map((value) => {
      const child = reference(value, nodes.length);
      if (parents[child] !== -1) return invalidModel();
      parents[child] = index;
      return child;
    });
  });
  // Parent walks bound both cycles and depth regardless of node ordering in the file.
  for (let index = 0; index < children.length; index++) {
    const path = new Set<number>();
    for (let current = index; current !== -1; current = parents[current]) {
      if (path.has(current)) return invalidModel();
      path.add(current);
      if (path.size > 32) return budget();
    }
  }
  let drawPrimitives = 0,
    drawVertices = 0;
  for (const node of nodes)
    if (node.mesh !== undefined) {
      const cost = meshCosts[reference(node.mesh, meshes.length)];
      drawPrimitives += cost.primitives;
      drawVertices += cost.vertices;
      if (drawPrimitives > 200 || drawVertices > MAX_ACCESSOR_ENTRIES) return budget();
    }
  if (root.scene !== undefined) reference(root.scene, scenes.length);
  for (const scene of scenes) {
    const roots = scene.nodes ?? [];
    if (
      !Array.isArray(roots) ||
      roots.length > nodes.length ||
      new Set(roots).size !== roots.length
    )
      return invalidModel();
    for (const value of roots)
      if (parents[reference(value, nodes.length)] !== -1) return invalidModel();
  }
  let decodedImageBytes = 0;
  const imageCosts = images.map((image) => {
    let bytes: Uint8Array, mime: string;
    if (image.uri !== undefined) {
      if (image.bufferView !== undefined) return invalidModel();
      const data = decodeDataUri(image.uri, ["image/png", "image/jpeg", "image/webp", "image/gif"]);
      bytes = data.bytes;
      mime = data.mimeType;
      if (image.mimeType !== undefined && image.mimeType !== mime) return invalidModel();
    } else {
      bytes = slices[reference(image.bufferView, views.length)];
      if (typeof image.mimeType !== "string") return invalidModel();
      mime = image.mimeType;
    }
    const { width, height } = imageDimensions(bytes, mime);
    const cost = width * height * 4;
    decodedImageBytes += cost;
    if (decodedImageBytes > MAX_TEXTURE_BYTES) return budget();
    return cost;
  });
  let textureBytes = 0;
  for (const texture of textures) {
    textureBytes += imageCosts[reference(texture.source, images.length)];
    if (textureBytes > MAX_TEXTURE_BYTES)
      throw new Error("This model exceeds the decoded texture budget.");
    if (texture.sampler !== undefined) reference(texture.sampler, samplers.length);
  }
  for (const material of materials) {
    const maps = [material.normalTexture, material.occlusionTexture, material.emissiveTexture];
    if (material.pbrMetallicRoughness !== undefined) {
      const pbr = record(material.pbrMetallicRoughness);
      maps.push(pbr.baseColorTexture, pbr.metallicRoughnessTexture);
    }
    for (const map of maps) if (map !== undefined) reference(record(map).index, textures.length);
  }
}

function parseModelJson(bytes: Uint8Array, binaryChunk?: Uint8Array) {
  if (bytes.length > MAX_GLTF_JSON_BYTES) return budget();
  validateGLTF(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), binaryChunk);
}

/** Validate untrusted storage bytes before any browser model parser sees them. */
export function validatePreviewAsset(bytes: Uint8Array, mimeType: string): void {
  if (!bytes.length || bytes.length > MAX_PREVIEW_BYTES)
    throw new Error("The preview file is empty or too large.");
  if (!(PREVIEW_MIME_TYPES as readonly string[]).includes(mimeType))
    throw new Error("This file type is not supported for preview.");
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  const signatureMatches =
    mimeType === "image/png"
      ? bytes[0] === 137 && ascii(1, 3) === "PNG"
      : mimeType === "image/jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : mimeType === "image/webp"
          ? ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP"
          : mimeType === "image/gif"
            ? ["GIF87a", "GIF89a"].includes(ascii(0, 6))
            : mimeType === "application/pdf"
              ? ascii(0, 5) === "%PDF-"
              : mimeType === "video/mp4"
                ? ascii(4, 4) === "ftyp"
                : mimeType === "video/webm"
                  ? bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
                  : true;
  if (!signatureMatches) throw new Error("File bytes do not match their declared type.");
  if (mimeType.startsWith("image/")) imageDimensions(bytes, mimeType);
  if (mimeType === "model/gltf+json") parseModelJson(bytes);
  if (mimeType === "model/gltf-binary") {
    if (bytes.length < 20) throw new Error("Invalid GLB header.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (
      view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 ||
      view.getUint32(8, true) !== bytes.length
    )
      throw new Error("Invalid GLB header.");
    let offset = 12;
    let metadata: Uint8Array | undefined;
    let binaryChunk: Uint8Array | undefined;
    while (offset < bytes.length) {
      if (offset + 8 > bytes.length) throw new Error("Invalid GLB chunk.");
      const length = view.getUint32(offset, true),
        type = view.getUint32(offset + 4, true);
      offset += 8;
      if (length % 4 || offset + length > bytes.length) throw new Error("Invalid GLB chunk.");
      const chunk = bytes.subarray(offset, offset + length);
      if (!metadata) {
        if (type !== 0x4e4f534a || !length) throw new Error("Invalid GLB JSON chunk.");
        metadata = chunk;
      } else {
        if (type !== 0x004e4942 || binaryChunk) throw new Error("Invalid GLB binary chunk.");
        binaryChunk = chunk;
      }
      offset += length;
    }
    if (!metadata) throw new Error("Invalid GLB JSON chunk.");
    parseModelJson(metadata, binaryChunk);
  }
}
