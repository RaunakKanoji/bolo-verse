"use client";

import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Box3,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MOUSE,
  Plane,
  Quaternion,
  SRGBColorSpace,
  Texture,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LoadingManager } from "three";
import type { CanonicalSpatialScene } from "@shape/scene-schema";
import type { AssetSummary } from "../../../../packages/api-contract/generated/models";
import { assetPreviewKind } from "../lib/api";
import { readPreviewBytes } from "../lib/preview";
import type { SceneObject } from "./state";
import type { TransformMode } from "./SpatialEditor";

type Props = {
  document: CanonicalSpatialScene;
  assets: AssetSummary[];
  selectedId: string | null;
  mode: TransformMode;
  canEdit: boolean;
  fetcher?: typeof fetch;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, patch: Partial<SceneObject>) => void;
};
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function SpatialCanvas(props: Props) {
  const [dragging, setDragging] = useState(false);
  const [failures, setFailures] = useState<Record<string, string>>({});
  const status = useCallback(
    (id: string, message: string) =>
      setFailures((current) => (current[id] === message ? current : { ...current, [id]: message })),
    [],
  );
  let count = 0,
    bytes = 0;
  const visible = props.document.objects.filter((object) => object.visible);
  const entries: { object: SceneObject; asset: AssetSummary | undefined; reason: string | null }[] =
    [];
  for (const object of visible) {
    const asset = props.assets.find((item) => item.id === object.assetId);
    const supported = asset && assetPreviewKind(asset);
    const allowed = supported && count < 4 && bytes + asset.byteSize <= 40 * 1024 * 1024;
    if (allowed) {
      count++;
      bytes += asset.byteSize;
    }
    entries.push({
      object,
      asset: allowed ? asset : undefined,
      reason: !supported
        ? "Preview unavailable. Object retained."
        : !allowed
          ? "Preview budget reached. Object retained."
          : null,
    });
  }
  const limitations = entries.flatMap(({ object, reason }) => {
    const message = reason ?? failures[object.id];
    return message ? [{ id: object.id, message }] : [];
  });
  return (
    <>
      <CanvasBoundary>
        <Canvas
          frameloop="demand"
          dpr={[1, 1.5]}
          camera={{ position: [5, 4, 6], fov: 45, near: 0.01, far: 250 }}
          fallback={
            <div className="canvas-message">
              3D preview requires WebGL. Use the object list and numeric controls to edit this
              scene.
            </div>
          }
          onPointerMissed={() => props.onSelect(null)}
        >
          <color attach="background" args={["#eeeef8"]} />
          <ambientLight intensity={1.6} />
          <directionalLight position={[5, 8, 4]} intensity={2.5} />
          <gridHelper args={[60, 60, "#c5bce5", "#dedbe9"]} position={[0, -0.005, 0]} />
          <axesHelper args={[1]} />
          <CameraControls enabled={!dragging} />
          {entries.map(({ object, asset }) => (
            <SceneEntry
              key={object.id}
              object={object}
              asset={asset}
              selected={props.selectedId === object.id}
              mode={props.mode}
              canEdit={props.canEdit}
              fetcher={props.fetcher ?? fetch}
              onSelect={props.onSelect}
              onTransform={props.onTransform}
              onDragging={setDragging}
              onStatus={status}
            />
          ))}
        </Canvas>
      </CanvasBoundary>
      {limitations.length > 0 && (
        <ul className="preview-limitations" aria-label="Preview limitations">
          {limitations.map(({ id, message }) => (
            <li key={id}>
              Object {props.document.objects.findIndex((object) => object.id === id) + 1}: {message}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CameraControls({ enabled }: { enabled: boolean }) {
  const { camera, gl, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.mouseButtons = { LEFT: undefined, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };
    orbit.minDistance = 0.2;
    orbit.maxDistance = 120;
    const onChange = () => invalidate();
    orbit.addEventListener("change", onChange);
    controls.current = orbit;
    return () => {
      orbit.removeEventListener("change", onChange);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate]);
  useEffect(() => {
    if (controls.current) controls.current.enabled = enabled;
  }, [enabled]);
  return null;
}

type CaptureTarget = {
  setPointerCapture: (id: number) => void;
  releasePointerCapture: (id: number) => void;
};
type Drag = {
  id: number;
  x: number;
  y: number;
  original: SceneObject;
  point: Vector3;
  latest: SceneObject;
  target: CaptureTarget;
};
function SceneEntry({
  object,
  asset,
  selected,
  mode,
  canEdit,
  fetcher,
  onSelect,
  onTransform,
  onDragging,
  onStatus,
}: {
  object: SceneObject;
  asset?: AssetSummary;
  selected: boolean;
  mode: TransformMode;
  canEdit: boolean;
  fetcher: typeof fetch;
  onSelect: Props["onSelect"];
  onTransform: Props["onTransform"];
  onDragging: (value: boolean) => void;
  onStatus: (id: string, message: string) => void;
}) {
  const group = useRef<Group>(null);
  const drag = useRef<Drag | null>(null);
  const { invalidate } = useThree();
  const apply = (next: SceneObject) => {
    if (!group.current) return;
    group.current.position.fromArray(next.position);
    group.current.quaternion.fromArray(next.rotation);
    group.current.scale.fromArray(next.scale);
    invalidate();
  };
  function finish(commit: boolean) {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    current.target.releasePointerCapture(current.id);
    onDragging(false);
    if (commit)
      onTransform(object.id, {
        position: current.latest.position,
        rotation: current.latest.rotation,
        scale: current.latest.scale,
      });
    else apply(current.original);
  }
  useEffect(
    () => () => {
      if (drag.current) {
        drag.current.target.releasePointerCapture(drag.current.id);
        onDragging(false);
        drag.current = null;
      }
    },
    [onDragging],
  );
  function down(event: ThreeEvent<PointerEvent>) {
    if (event.button !== 0) return;
    event.stopPropagation();
    onSelect(object.id);
    if (!canEdit) return;
    const point = new Vector3();
    event.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -object.position[1]), point);
    const target = event.target as unknown as CaptureTarget;
    target.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      original: structuredClone(object),
      latest: structuredClone(object),
      point,
      target,
    };
    onDragging(true);
  }
  function move(event: ThreeEvent<PointerEvent>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId || !canEdit) return;
    event.stopPropagation();
    const next = structuredClone(current.original);
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y;
    if (mode === "move") {
      const point = event.ray.intersectPlane(
        new Plane(new Vector3(0, 1, 0), -next.position[1]),
        new Vector3(),
      );
      if (!point) return;
      next.position = [
        clamp(next.position[0] + point.x - current.point.x, -30, 30),
        next.position[1],
        clamp(next.position[2] + point.z - current.point.z, -30, 30),
      ];
    } else if (mode === "rotate") {
      const q = new Quaternion()
        .fromArray(next.rotation)
        .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), dx * 0.01))
        .normalize();
      next.rotation = q.toArray() as SceneObject["rotation"];
    } else {
      const factor = Math.exp(clamp((dx - dy) * 0.01, -5, 5));
      next.scale = next.scale.map((value) =>
        clamp(value * factor, 0.1, 10),
      ) as SceneObject["scale"];
    }
    current.latest = next;
    apply(next);
  }
  return (
    <group
      ref={group}
      name={object.id}
      position={object.position}
      quaternion={object.rotation}
      scale={object.scale}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(event) => {
        event.stopPropagation();
        finish(true);
      }}
      onPointerCancel={() => finish(false)}
      onLostPointerCapture={() => finish(false)}
    >
      {asset ? (
        <AssetContent asset={asset} objectId={object.id} onStatus={onStatus} fetcher={fetcher} />
      ) : (
        <mesh>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshBasicMaterial color="#a59bbd" wireframe />
        </mesh>
      )}
      {selected && (
        <mesh name="selection-outline">
          <boxGeometry args={[1.12, 1.12, 1.12]} />
          <meshBasicMaterial
            color="#6541ce"
            wireframe
            transparent
            opacity={0.7}
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  );
}

function AssetContent({
  asset,
  objectId,
  onStatus,
  fetcher,
}: {
  asset: AssetSummary;
  objectId: string;
  onStatus: (id: string, message: string) => void;
  fetcher: typeof fetch;
}) {
  const [content, setContent] = useState<Group | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let owned: Group | null = null;
    void (async () => {
      try {
        const response = await fetcher(asset.contentUrl!, {
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        });
        const bytes = await readPreviewBytes(
          response,
          asset.mimeType,
          Math.min(asset.byteSize, 20 * 1024 * 1024),
        );
        let loaded: Group;
        if (assetPreviewKind(asset) === "model") {
          const view = new DataView(bytes.buffer);
          if (
            bytes.length < 20 ||
            view.getUint32(0, true) !== 0x46546c67 ||
            view.getUint32(4, true) !== 2 ||
            view.getUint32(8, true) !== bytes.length
          )
            throw new Error("Invalid GLB.");
          const manager = new LoadingManager();
          manager.setURLModifier((url) => {
            if (!url.startsWith("blob:") && !url.startsWith("data:"))
              throw new Error("External model resources are unavailable.");
            return url;
          });
          loaded = (await new GLTFLoader(manager).parseAsync(bytes.buffer, "")).scene;
          const bounds = new Box3().setFromObject(loaded);
          if (
            bounds.isEmpty() ||
            ![...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite)
          ) {
            disposeObject(loaded);
            throw new Error("Invalid model bounds.");
          }
        } else {
          const bitmap = await createImageBitmap(new Blob([bytes], { type: asset.mimeType }));
          if (
            bitmap.width * bitmap.height > 16_777_216 ||
            bitmap.width !== asset.width ||
            bitmap.height !== asset.height
          ) {
            bitmap.close();
            throw new Error("Image bounds exceeded.");
          }
          const texture = new Texture(bitmap);
          texture.colorSpace = SRGBColorSpace;
          texture.needsUpdate = true;
          const ratio = bitmap.width / bitmap.height;
          const { PlaneGeometry } = await import("three");
          loaded = new Group();
          loaded.add(
            new Mesh(
              new PlaneGeometry(ratio > 1 ? 1 : ratio, ratio > 1 ? 1 / ratio : 1),
              new MeshBasicMaterial({ map: texture, side: 2, transparent: true }),
            ),
          );
        }
        if (disposed || controller.signal.aborted) {
          disposeObject(loaded);
          return;
        }
        owned = loaded;
        loaded.name = `asset-content-${objectId}`;
        setContent(loaded);
        onStatus(objectId, "");
      } catch {
        if (!disposed && !controller.signal.aborted)
          onStatus(objectId, "Preview could not be loaded. Object retained.");
      }
    })();
    return () => {
      disposed = true;
      controller.abort();
      if (owned) disposeObject(owned);
    };
  }, [asset, objectId, onStatus, fetcher]);
  return content ? (
    <primitive object={content} dispose={null} />
  ) : (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshBasicMaterial color="#b9b0d7" wireframe />
    </mesh>
  );
}

function disposeObject(root: Group) {
  const textures = new Set<Texture>(),
    materials = new Set<Material>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof Texture) textures.add(value);
    }
  });
  for (const texture of textures) {
    const image = texture.image as { close?: () => void } | undefined;
    image?.close?.();
    texture.dispose();
  }
  for (const material of materials) material.dispose();
  root.clear();
}

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="canvas-message">
        3D preview is unavailable. Your scene is retained; use the object list and numeric controls.
      </div>
    ) : (
      this.props.children
    );
  }
}
