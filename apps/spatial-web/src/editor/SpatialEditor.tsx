"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  eulerXYZDegreesToQuaternion,
  quaternionToEulerXYZDegrees,
  type SpatialSceneSnapshot,
} from "@shape/scene-schema";
import type {
  AssetSummary,
  ProjectSummary,
} from "../../../../packages/api-contract/generated/models";
import { assetPreviewKind, createSpatialApi, ShapeApiError } from "../lib/api";
import {
  beginSave,
  createEditorState,
  editObject,
  isDirty,
  placeAsset,
  redo,
  reloadScene,
  removeObject,
  resolveSave,
  undo,
  type EditorState,
} from "./state";

const SpatialCanvas = dynamic(() => import("./SpatialCanvas"), {
  ssr: false,
  loading: () => <div className="canvas-message">Preparing your scene…</div>,
});
export type TransformMode = "move" | "rotate" | "scale";
export type SpatialEditorProps = {
  project: ProjectSummary;
  assets: AssetSummary[];
  snapshot: SpatialSceneSnapshot;
  hasMoreAssets?: boolean;
  fetcher?: typeof fetch;
};

/** All private scene, history and requests are owned by this mounted workspace. */
export function SpatialEditor(props: SpatialEditorProps) {
  return <EditorSession key={props.project.id} {...props} />;
}
function EditorSession({
  project,
  assets,
  snapshot,
  hasMoreAssets = false,
  fetcher = fetch,
}: SpatialEditorProps) {
  const [state, setState] = useState(() => createEditorState(snapshot));
  const stateRef = useRef(state);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<TransformMode>("move");
  const [notice, setNotice] = useState("");
  const [reloadPrompt, setReloadPrompt] = useState(false);
  const [reloading, setReloading] = useState(false);
  const requestRef = useRef<{ id: string; controller: AbortController } | null>(null);
  const selected = state.document.objects.find((object) => object.id === selectedId);
  const dirty = isDirty(state);
  const canEdit = state.snapshot.canEdit;

  function update(next: EditorState) {
    stateRef.current = next;
    setState(next);
  }
  function mutate(operation: (current: EditorState) => EditorState) {
    try {
      update(operation(stateRef.current));
      setNotice("");
    } catch {
      setNotice(
        "That change is outside the scene limits. Position: −30 to 30 m. Scale: 0.1 to 10.",
      );
    }
  }
  useEffect(
    () => () => {
      requestRef.current?.controller.abort();
      requestRef.current = null;
    },
    [],
  );
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const onLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest("a[href]");
      if (link && !window.confirm("Leave this scene and discard unsaved changes?"))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onLink);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onLink);
    };
  }, [dirty]);

  async function save() {
    if (requestRef.current) return;
    const id = crypto.randomUUID();
    const controller = new AbortController();
    try {
      const pending = beginSave(stateRef.current, id);
      update(pending.state);
      requestRef.current = { id, controller };
      const result = await createSpatialApi(fetcher).save(
        project.id,
        pending.request,
        controller.signal,
      );
      if (requestRef.current?.id !== id || controller.signal.aborted) return;
      update(resolveSave(stateRef.current, id, result));
      setNotice("");
    } catch (error) {
      if (controller.signal.aborted || requestRef.current?.id !== id) return;
      update(
        resolveSave(
          stateRef.current,
          id,
          error instanceof ShapeApiError && error.status === 409 ? "conflict" : "error",
        ),
      );
      if (error instanceof ShapeApiError && [401, 403, 404].includes(error.status))
        setNotice("Access is no longer available. Your local changes are retained in this tab.");
    } finally {
      if (requestRef.current?.id === id) requestRef.current = null;
    }
  }
  async function reload(discard: boolean) {
    if (dirty && !discard) {
      setReloadPrompt(true);
      return;
    }
    requestRef.current?.controller.abort();
    const id = crypto.randomUUID();
    const controller = new AbortController();
    requestRef.current = { id, controller };
    // Capture the local document so a reload never silently replaces edits made while awaiting it.
    const documentAtRequest = JSON.stringify(stateRef.current.document);
    setReloading(true);
    setReloadPrompt(false);
    try {
      const result = await createSpatialApi(fetcher).load(project.id, controller.signal);
      if (requestRef.current?.id !== id || controller.signal.aborted) return;
      if (documentAtRequest !== JSON.stringify(stateRef.current.document)) {
        setNotice(
          "The scene changed while reloading. Local changes were retained; reload again to discard them.",
        );
        return;
      }
      update(reloadScene(stateRef.current, result, discard));
      setSelectedId(null);
      setNotice("Latest saved scene loaded.");
    } catch {
      if (!controller.signal.aborted && requestRef.current?.id === id)
        setNotice("The latest scene could not be loaded. Your local changes are retained.");
    } finally {
      if (requestRef.current?.id === id) {
        requestRef.current = null;
        setReloading(false);
      }
    }
  }

  const status = !canEdit
    ? "Read-only scene"
    : state.status === "saving"
      ? "Saving…"
      : state.status === "conflict"
        ? "A newer scene exists. Your changes are retained."
        : state.status === "error"
          ? "Save failed. Your changes are retained. Retry or reload."
          : dirty
            ? "Unsaved changes"
            : state.status === "saved"
              ? "All changes saved"
              : "Scene is up to date";
  return (
    <main className="spatial-editor" data-testid="spatial-editor">
      <header className="studio-bar">
        <a className="shape-wordmark" href="/app/projects">
          shape
          <span className="brand-dot" />
        </a>
        <div className="studio-title">
          <span>Spatial workspace</span>
          <h1>{project.name}</h1>
        </div>
        <div className="save-bar">
          <span role="status" data-testid="scene-status">
            {status}
          </span>
          <button
            type="button"
            onClick={() => void reload(false)}
            disabled={reloading || state.status === "saving"}
          >
            {reloading ? "Reloading…" : "Reload scene"}
          </button>
          <button
            className="primary"
            type="button"
            onClick={() => void save()}
            disabled={
              !canEdit ||
              !dirty ||
              state.status === "saving" ||
              state.status === "conflict" ||
              reloading
            }
          >
            Save scene
          </button>
        </div>
      </header>
      {notice && (
        <p className="studio-notice" role="status">
          {notice}
        </p>
      )}
      {reloadPrompt && (
        <div className="reload-prompt" role="alertdialog" aria-label="Discard local changes">
          <p>Reloading discards your unsaved scene changes and local undo history.</p>
          <button type="button" onClick={() => setReloadPrompt(false)}>
            Keep editing
          </button>
          <button type="button" onClick={() => void reload(true)}>
            Discard changes and reload
          </button>
        </div>
      )}
      <div className="studio-columns">
        <aside className="asset-panel" aria-label="Project assets">
          <div className="panel-heading">
            <h2>Assets</h2>
            <span>{assets.length}</span>
          </div>
          <p className="panel-description">Place ready assets in your scene.</p>
          {assets.length === 0 && (
            <p className="empty-note">
              This project has no ready assets yet. Add assets from your project to begin.
            </p>
          )}
          <ul className="asset-list">
            {assets.map((asset, index) => {
              const kind = assetPreviewKind(asset);
              return (
                <li key={asset.id}>
                  <div className={`asset-symbol ${kind ?? "unsupported"}`} aria-hidden="true">
                    {kind === "model" ? "◇" : kind === "image" ? "▧" : "—"}
                  </div>
                  <div className="asset-meta">
                    <strong>
                      {kind === "model"
                        ? "3D model"
                        : kind === "image"
                          ? "Image"
                          : "Unsupported asset"}{" "}
                      {index + 1}
                    </strong>
                    <small>{asset.mimeType}</small>
                    {!kind && (
                      <small>Preview unavailable; stored scene objects are preserved.</small>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Place asset ${index + 1}`}
                    disabled={!canEdit || !kind || state.document.objects.length >= 50 || reloading}
                    onClick={() => {
                      const id = crypto.randomUUID();
                      mutate((current) => placeAsset(current, asset.id, id));
                      setSelectedId(id);
                    }}
                  >
                    Place
                  </button>
                </li>
              );
            })}
          </ul>
          {hasMoreAssets && (
            <p className="empty-note">
              Showing the first 100 ready assets. Other scene objects are preserved.
            </p>
          )}
          <div className="scene-list-heading">
            <h2>Scene objects</h2>
            <span>{state.document.objects.length}/50</span>
          </div>
          <ul className="object-list">
            {state.document.objects.map((object, index) => {
              const asset = assets.find((item) => item.id === object.assetId);
              return (
                <li key={object.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === object.id}
                    onClick={() => setSelectedId(object.id)}
                  >
                    <span>Object {index + 1}</span>
                    <small>
                      {!asset || !assetPreviewKind(asset)
                        ? "Preview unavailable · preserved"
                        : !object.visible
                          ? "Hidden"
                          : asset.mimeType === "model/gltf-binary"
                            ? "3D model"
                            : "Image"}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <section className="scene-stage" aria-label="3D scene">
          <div className="viewport-tools">
            <fieldset aria-label="Transform mode">
              {(["move", "rotate", "scale"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="transform-mode"
                    value={value}
                    checked={mode === value}
                    onChange={() => setMode(value)}
                  />
                  <span>{value[0].toUpperCase() + value.slice(1)}</span>
                </label>
              ))}
            </fieldset>
            <div className="history-buttons">
              <button
                type="button"
                disabled={!canEdit || !state.past.length || reloading}
                onClick={() => mutate(undo)}
              >
                Undo
              </button>
              <button
                type="button"
                disabled={!canEdit || !state.future.length || reloading}
                onClick={() => mutate(redo)}
              >
                Redo
              </button>
            </div>
          </div>
          <div className="canvas-wrap">
            <SpatialCanvas
              document={state.document}
              assets={assets}
              selectedId={selectedId}
              mode={mode}
              canEdit={canEdit && !reloading}
              fetcher={fetcher}
              onSelect={setSelectedId}
              onTransform={(id, patch) => mutate((current) => editObject(current, id, patch))}
            />
          </div>
          {state.document.objects.length === 0 && (
            <div className="scene-empty">
              <span aria-hidden="true">◇</span>
              <h2>A little space for your next idea</h2>
              <p>Choose an asset and place it to start composing.</p>
            </div>
          )}
          <div className="viewport-caption">
            <span>Metres · Y up · −Z forward</span>
            <span>Drag an object to {mode}. Right-drag to orbit. Scroll to zoom.</span>
          </div>
        </section>
        <aside className="inspector-panel" aria-label="Object inspector">
          <h2>Inspector</h2>
          {selected ? (
            <>
              <p className="selection-name">
                Object {state.document.objects.indexOf(selected) + 1}
              </p>
              <p className="object-id">{selected.id}</p>
              <fieldset className="transform-fields" disabled={!canEdit || reloading}>
                <VectorFields
                  key={`${selected.id}-position-${selected.position.join(",")}`}
                  label="Position"
                  values={selected.position}
                  min={-30}
                  max={30}
                  step={0.1}
                  unit="m"
                  onCommit={(value) =>
                    mutate((current) => editObject(current, selected.id, { position: value }))
                  }
                />
                <VectorFields
                  key={`${selected.id}-rotation-${selected.rotation.join(",")}`}
                  label="Rotation"
                  values={quaternionToEulerXYZDegrees(selected.rotation)}
                  min={-360}
                  max={360}
                  step={1}
                  unit="°"
                  onCommit={(value) =>
                    mutate((current) =>
                      editObject(current, selected.id, {
                        rotation: eulerXYZDegreesToQuaternion(value),
                      }),
                    )
                  }
                />
                <VectorFields
                  key={`${selected.id}-scale-${selected.scale.join(",")}`}
                  label="Scale"
                  values={selected.scale}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onCommit={(value) =>
                    mutate((current) => editObject(current, selected.id, { scale: value }))
                  }
                />
                <label className="visibility-control">
                  <input
                    type="checkbox"
                    checked={selected.visible}
                    onChange={(event) =>
                      mutate((current) =>
                        editObject(current, selected.id, { visible: event.target.checked }),
                      )
                    }
                  />
                  Visible
                </label>
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => {
                    mutate((current) => removeObject(current, selected.id));
                    setSelectedId(null);
                  }}
                >
                  Remove object
                </button>
              </fieldset>
            </>
          ) : (
            <div className="inspector-empty">
              <span aria-hidden="true">⌖</span>
              <p>Select an object in the scene or object list to adjust its transform.</p>
            </div>
          )}
          <div className="inspector-note">
            <h3>Shared scene</h3>
            <p>
              Changes stay in this tab until you save. Reload to retrieve the latest project
              revision.
            </p>
            <span>Revision {state.snapshot.revision}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

function VectorFields({
  label,
  values,
  min,
  max,
  step,
  unit = "",
  onCommit,
}: {
  label: string;
  values: [number, number, number];
  min: number;
  max: number;
  step: number;
  unit?: string;
  onCommit: (value: [number, number, number]) => void;
}) {
  const [draft, setDraft] = useState(() => values.map((value) => String(Number(value.toFixed(4)))));
  const [invalid, setInvalid] = useState(false);
  function commit(index: number) {
    const number = Number(draft[index]);
    if (!draft[index].trim() || !Number.isFinite(number) || number < min || number > max) {
      setInvalid(true);
      return;
    }
    const next: [number, number, number] = [...values];
    next[index] = number;
    setInvalid(false);
    onCommit(next);
  }
  return (
    <div className="vector-fields">
      <div className="vector-title">
        <span>{label}</span>
        <small>{unit}</small>
      </div>
      <div className="vector-inputs">
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <label key={axis}>
            <span>{axis}</span>
            <input
              type="number"
              aria-label={`${label} ${axis}`}
              aria-invalid={invalid}
              min={min}
              max={max}
              step={step}
              value={draft[index]}
              onChange={(event) =>
                setDraft((current) =>
                  current.map((value, i) => (i === index ? event.target.value : value)),
                )
              }
              onBlur={() => commit(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
          </label>
        ))}
      </div>
      {invalid && (
        <small className="field-error" role="alert">
          Use a number between {min} and {max}.
        </small>
      )}
    </div>
  );
}
