"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import {
  CanonicalSpatialObjectSchema,
  eulerXYZDegreesToQuaternion,
  quaternionToEulerXYZDegrees,
} from "@shape/scene-schema";
import { VectorFields, type TransformMode } from "./SpatialEditor";
import type { SceneObject } from "./state";

const SpatialCanvas = dynamic(() => import("./SpatialCanvas"), { ssr: false });
const DemoObjectSchema = CanonicalSpatialObjectSchema.omit({ assetId: true });

/** Public local-only procedural geometry. No project, asset IDs, API or persistence. */
export function LocalSpatialDemo() {
  const [object, setObject] = useState<Omit<SceneObject, "assetId">>({
    id: "procedural-cube",
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    scale: [1, 1, 1],
    visible: true,
  });
  const [mode, setMode] = useState<TransformMode>("move");
  const [selected, setSelected] = useState<string | null>(object.id);
  function transform(patch: Partial<SceneObject>) {
    setObject((current) => DemoObjectSchema.parse({ ...current, ...patch }));
  }
  return (
    <main className="spatial-editor">
      <header className="studio-bar">
        <a className="shape-wordmark" href="/app/projects">
          shape
          <span className="brand-dot" />
        </a>
        <div className="studio-title">
          <span>Practice workspace</span>
          <h1>Local procedural demo</h1>
        </div>
        <Link href="/workspace">Open a project workspace</Link>
      </header>
      <p className="studio-notice" role="status">
        Built-in procedural cube. Nothing here is saved or uploaded. Refresh resets this local demo.
      </p>
      <div className="studio-columns">
        <aside className="asset-panel">
          <h2>Procedural object</h2>
          <p>
            This cube is built in, with no project asset. To save a composition, open a project and
            place its ready assets.
          </p>
          <button type="button" onClick={() => setSelected(object.id)}>
            Select cube
          </button>
          <p>
            <a href="/app/projects">Go to your projects</a>
          </p>
        </aside>
        <section className="scene-stage" aria-label="3D scene">
          <div className="viewport-tools">
            <fieldset aria-label="Transform mode">
              {(["move", "rotate", "scale"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="transform-mode"
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span>{value[0].toUpperCase() + value.slice(1)}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <div className="canvas-wrap">
            <SpatialCanvas
              document={null}
              assets={[]}
              proceduralObject={object}
              selectedId={selected}
              mode={mode}
              canEdit
              onSelect={setSelected}
              onTransform={(_, patch) => transform(patch)}
            />
          </div>
          <div className="viewport-caption">
            <span>Metres · Y up · −Z forward</span>
            <span>Drag the cube to {mode}. Right-drag to orbit. Scroll to zoom.</span>
          </div>
        </section>
        <aside className="inspector-panel" aria-label="Object inspector">
          <h2>Procedural cube</h2>
          <p>Enter a number, then press Enter or move focus to apply.</p>
          <fieldset className="transform-fields">
            <VectorFields
              key={`p-${object.position}`}
              label="Position"
              values={object.position}
              min={-30}
              max={30}
              step={0.1}
              unit="m"
              onCommit={(position) => transform({ position })}
            />
            <VectorFields
              key={`r-${object.rotation}`}
              label="Rotation"
              values={quaternionToEulerXYZDegrees(object.rotation)}
              min={-360}
              max={360}
              step={1}
              unit="°"
              onCommit={(value) => transform({ rotation: eulerXYZDegreesToQuaternion(value) })}
            />
            <VectorFields
              key={`s-${object.scale}`}
              label="Scale"
              values={object.scale}
              min={0.1}
              max={10}
              step={0.1}
              onCommit={(scale) => transform({ scale })}
            />
          </fieldset>
        </aside>
      </div>
    </main>
  );
}
