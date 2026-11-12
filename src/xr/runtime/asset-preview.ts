import type { Material, Mesh, Object3D, Texture } from "three";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";
import type { AFrameEntity } from "./aframe-types";
import type { XRRealm } from "./load-aframe";
import { RuntimeScope } from "./scope";

export type SpatialAssetPreview = { ready: Promise<void>; dispose(): void };

export function assertProtectedPreviewUrl(url: string, assetId: string, base: string): string {
  const origin = new URL(base).origin;
  const parsed = new URL(url, base);
  if (
    parsed.origin !== origin ||
    parsed.pathname !== `/api/xr/assets/${assetId}` ||
    parsed.search ||
    parsed.hash ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("A spatial preview must use this asset's protected project route.");
  }
  return parsed.href;
}

export function assertTextureSize(width: number, height: number): void {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    width > 8192 ||
    height > 8192 ||
    width * height > 4096 * 4096
  ) {
    throw new Error(
      "This media is too large for a spatial texture. Open it in the standard viewer.",
    );
  }
}

export function disposeModelResources(model: Object3D): void {
  const geometries = new Set<NonNullable<Mesh["geometry"]>>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  model.traverse((node) => {
    const mesh = node as Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
        materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    for (const value of Object.values(material) as unknown[]) {
      if (value && typeof value === "object" && "isTexture" in value && value.isTexture)
        textures.add(value as Texture);
    }
  }
  for (const texture of textures) {
    texture.dispose();
    const image: unknown = texture.image;
    if (image && typeof image === "object" && "close" in image && typeof image.close === "function")
      image.close();
  }
  for (const material of materials) material.dispose();
}

async function fetchBytes(
  realm: XRRealm,
  url: string,
  mimeType: string,
  scope: RuntimeScope,
): Promise<Uint8Array> {
  const response = await realm.window.fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    signal: scope.signal,
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Your session cannot access this asset. Sign in and reload the project."
        : "The protected asset could not load. Try again or open it in the standard viewer.",
    );
  if (response.headers.get("content-type")?.split(";", 1)[0] !== mimeType || !response.body)
    throw new Error("The asset response did not match its declared media type.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PREVIEW_BYTES)
        throw new Error("This asset exceeds the spatial preview size limit.");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  validatePreviewAsset(bytes, mimeType);
  return bytes;
}

function waitFor(target: EventTarget, event: string, scope: RuntimeScope): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scope.signal.aborted) {
      reject(new DOMException("Preview cancelled", "AbortError"));
      return;
    }
    const finish = () => {
      target.removeEventListener(event, loaded);
      target.removeEventListener("error", failed);
      scope.signal.removeEventListener("abort", cancelled);
    };
    const loaded = () => {
      finish();
      resolve();
    };
    const failed = () => {
      finish();
      reject(new Error("This media could not be decoded by your browser."));
    };
    const cancelled = () => {
      finish();
      reject(new DOMException("Preview cancelled", "AbortError"));
    };
    target.addEventListener(event, loaded, { once: true });
    target.addEventListener("error", failed, { once: true });
    scope.signal.addEventListener("abort", cancelled, { once: true });
  });
}

// Minimal structural boundary for the loader bundled inside A-Frame's engine.
// No constructor from the separate recorder's Three package enters the scene.
interface RuntimeGLTFLoader {
  manager: { setURLModifier(modifier: (url: string) => string): unknown };
  setDRACOLoader(value: null): unknown;
  parse(
    data: ArrayBuffer,
    path: string,
    onLoad: (value: { scene: Object3D }) => void,
    onError: (error: unknown) => void,
  ): void;
}

async function loadModel(
  realm: XRRealm,
  parent: AFrameEntity,
  bytes: Uint8Array,
  scope: RuntimeScope,
): Promise<void> {
  const entity = realm.document.createElement("a-entity") as AFrameEntity;
  scope.own(() => entity.remove());
  const connected = waitFor(entity, "loaded", scope);
  parent.append(entity);
  await connected;
  if (scope.signal.aborted) return;
  entity.setAttribute("gltf-model", "");
  // Empty source initializes the native loader without starting a network load.
  const component = entity.components["gltf-model"] as (typeof entity.components)[string] & {
    loader?: RuntimeGLTFLoader;
  };
  if (!component?.loader)
    throw new Error("The model preview loader is not ready. Try opening the asset again.");
  const loader = component.loader;
  loader.setDRACOLoader(null);
  loader.manager.setURLModifier((url) => {
    if (!url.startsWith("data:") && !url.startsWith("blob:"))
      throw new Error("External model resources are not permitted.");
    return url;
  });
  const model = await new Promise<Object3D>((resolve, reject) => {
    // GLTFLoader uses instanceof ArrayBuffer, so its input must belong to the
    // iframe realm too. A parent buffer is otherwise mistaken for a JSON object.
    const data = new realm.window.ArrayBuffer(bytes.byteLength);
    new realm.window.Uint8Array(data).set(bytes);
    loader.parse(data, "", (gltf) => resolve(gltf.scene), reject);
  });
  if (scope.signal.aborted) {
    disposeModelResources(model);
    return;
  }
  scope.own(() => {
    entity.removeObject3D("mesh");
    disposeModelResources(model);
  });
  const THREE = realm.window.AFRAME.THREE;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const maximum = Math.max(size.x, size.y, size.z);
  if (!Number.isFinite(maximum) || maximum <= 0)
    throw new Error("This model does not contain visible geometry.");
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  const wrapper = new THREE.Group();
  wrapper.add(model);
  wrapper.scale.setScalar(Math.min(1.5 / maximum, 100));
  wrapper.position.set(0, -0.1, 0.65);
  entity.setObject3D("mesh", wrapper);
}

export function startSpatialAssetPreview(
  realm: XRRealm,
  panel: AFrameEntity,
  input: { assetId: string; url: string; mimeType: string },
  parentSignal: AbortSignal,
): SpatialAssetPreview {
  const scope = new RuntimeScope();
  const abort = () => scope.dispose();
  parentSignal.addEventListener("abort", abort, { once: true });
  scope.own(() => parentSignal.removeEventListener("abort", abort));
  if (parentSignal.aborted) scope.dispose();
  const ready = (async () => {
    if (scope.signal.aborted) return;
    const url = assertProtectedPreviewUrl(input.url, input.assetId, realm.document.baseURI);
    const timeout = realm.window.setTimeout(abort, 30_000);
    scope.own(() => realm.window.clearTimeout(timeout));
    try {
      const bytes = await fetchBytes(realm, url, input.mimeType, scope);
      if (scope.signal.aborted) return;
      if (input.mimeType.startsWith("model/")) {
        await loadModel(realm, panel, bytes, scope);
        return;
      }
      if (!input.mimeType.startsWith("image/") && !input.mimeType.startsWith("video/"))
        throw new Error(
          "This document remains a spatial card. Use Open asset for its standard viewer.",
        );
      const objectUrl = realm.window.URL.createObjectURL(
        new Blob([bytes.slice().buffer as ArrayBuffer], { type: input.mimeType }),
      );
      scope.own(() => realm.window.URL.revokeObjectURL(objectUrl));
      const THREE = realm.window.AFRAME.THREE;
      let texture: Texture;
      let width: number;
      let height: number;
      if (input.mimeType.startsWith("image/")) {
        const image = realm.document.createElement("img");
        const loaded = waitFor(image, "load", scope);
        image.src = objectUrl;
        await loaded;
        if (scope.signal.aborted) return;
        width = image.naturalWidth;
        height = image.naturalHeight;
        assertTextureSize(width, height);
        texture = new THREE.Texture(image);
        texture.needsUpdate = true;
      } else {
        const video = realm.document.createElement("video");
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";
        scope.own(() => {
          video.pause();
          video.removeAttribute("src");
          video.load();
        });
        const loaded = waitFor(video, "loadeddata", scope);
        video.src = objectUrl;
        video.load();
        await loaded;
        if (scope.signal.aborted) return;
        width = video.videoWidth;
        height = video.videoHeight;
        assertTextureSize(width, height);
        texture = new THREE.VideoTexture(video);
        await video.play().catch(() => undefined);
      }
      if (scope.signal.aborted) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = width / height;
      const displayedWidth = Math.min(1.8, 0.8 * aspect);
      const geometry = new THREE.PlaneGeometry(displayedWidth, displayedWidth / aspect);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, -0.08, 0.025);
      panel.setObject3D("asset-preview", mesh);
      scope.own(() => {
        panel.removeObject3D("asset-preview");
        geometry.dispose();
        material.dispose();
        texture.dispose();
      });
    } finally {
      realm.window.clearTimeout(timeout);
    }
  })().catch((error: unknown) => {
    scope.dispose();
    if (!parentSignal.aborted) throw error;
  });
  return { ready, dispose: () => scope.dispose() };
}
