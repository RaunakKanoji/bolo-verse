"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Focus,
  Headset,
  House,
  Maximize2,
  Minimize2,
  MousePointer2,
  RotateCcw,
  RotateCw,
  Save,
  X,
} from "lucide-react";
import { StudioAdapter, type RuntimeStats, type ViewingPosition } from "./runtime/studio-adapter";
import { useXRCapabilities } from "./useXRCapabilities";
import { XR_FALLBACK_MESSAGE } from "./capabilities";
import { useWorkspaceState } from "./useWorkspaceState";
import { applyTransformAction, type TransformAction } from "./interactions/transform-controls";
import { createProjectDocument, createStudioDocument } from "./serializers/scene-document";
import { XRCommandSchema, type XRCommand } from "@/lib/contracts/xr-assistant";
import AssistantPanel from "./assistant/AssistantPanel";
import TransformPanel from "./TransformPanel";
import AssetViewer from "./AssetViewer";
import type { XRWorkspaceProps } from "./XRWorkspace";
import styles from "./workspace.module.css";

export default function XRWorkspaceClient(props: XRWorkspaceProps) {
  const { project, preview = false } = props;
  const workspace = useWorkspaceState(props);
  const initial = useRef(workspace.document);
  const host = useRef<HTMLDivElement>(null);
  const adapter = useRef<StudioAdapter | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [sceneError, setSceneError] = useState("");
  const [selectedId, setSelectedId] = useState(workspace.document.entities[0].id);
  const selected =
    workspace.document.entities.find((entity) => entity.id === selectedId) ??
    workspace.document.entities[0];
  const [immersive, setImmersive] = useState(false);
  const [sessionPending, setSessionPending] = useState(false);
  const [position, setPosition] = useState<ViewingPosition>("standing");
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const diagnostics = useRef(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const assetRequest = useRef({ generation: 0 });
  const { capabilities, loading: capabilityLoading, refresh } = useXRCapabilities();
  const { setDocument } = workspace;

  useEffect(() => {
    if (!host.current) return;
    let active = true;
    const requests = assetRequest.current;
    const owned = new StudioAdapter(
      host.current,
      { id: project.id, name: project.name, objective: project.objective },
      {
        onSelect: (entity) => {
          if (active) {
            assetRequest.current.generation++;
            setAssetLoading(false);
            setSelectedId(entity.id);
            setAssetOpen(false);
          }
        },
        onDocumentChange: (next) => {
          if (active) setDocument(next);
        },
        onSession: (value) => {
          if (active) setImmersive(value);
        },
        onStats: (value) => {
          if (active && process.env.NODE_ENV === "development" && diagnostics.current)
            setStats(value);
        },
        onError: (message, fatal) => {
          if (active) {
            setSceneError(message);
            if (fatal) setStatus("error");
          }
        },
      },
      initial.current,
    );
    adapter.current = owned;
    void owned
      .initialize()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((reason: unknown) => {
        owned.dispose();
        if (active) {
          setStatus("error");
          setSceneError(
            reason instanceof Error
              ? reason.message
              : "The 3D view could not open. Project tools remain available.",
          );
        }
      });
    return () => {
      active = false;
      requests.generation++;
      owned.dispose();
      if (adapter.current === owned) adapter.current = null;
    };
  }, [project.id, project.name, project.objective, setDocument]);
  useEffect(() => {
    adapter.current?.setEditable(workspace.canEdit && !workspace.busy);
  }, [workspace.canEdit, workspace.busy, status]);
  useEffect(() => {
    if (status === "ready") adapter.current?.updateDocument(workspace.document);
  }, [workspace.document, status]);

  function select(id: string) {
    assetRequest.current.generation++;
    setAssetLoading(false);
    setSelectedId(id);
    setAssetOpen(false);
    adapter.current?.select(id);
  }
  function transform(action: TransformAction) {
    if (!workspace.canEdit || workspace.busy) return;
    const next = applyTransformAction(selected.transform, action);
    setDocument((current) => ({
      ...current,
      entities: current.entities.map((entity) =>
        entity.id === selected.id ? { ...entity, transform: next } : entity,
      ),
    }));
  }
  function resetObject() {
    const defaults = preview
      ? createStudioDocument(project)
      : createProjectDocument(project, workspace.data!.content);
    const value = defaults.entities.find((entity) => entity.id === selected.id)?.transform;
    if (value) transform({ type: "reset", transform: value });
  }
  async function toggleVR() {
    if (!adapter.current || sessionPending) return;
    setSessionPending(true);
    setSceneError("");
    try {
      if (immersive) await adapter.current.exitVR();
      else if (capabilities?.immersiveVRSupported) await adapter.current.enterVR();
    } catch (reason) {
      setSceneError(
        reason instanceof Error
          ? reason.message
          : "The headset session could not change. Your layout is unchanged.",
      );
    } finally {
      setSessionPending(false);
    }
  }
  async function openSpatialAsset(id = selected.id) {
    const entity = workspace.document.entities.find((entity) => entity.id === id);
    if (!entity?.assetId || !entity.properties.mimeType || !adapter.current) return;
    select(id);
    const request = ++assetRequest.current.generation;
    setAssetLoading(true);
    setSceneError("");
    try {
      await adapter.current.previewAsset(
        id,
        `/api/xr/assets/${entity.assetId}`,
        entity.properties.mimeType,
      );
    } catch (reason) {
      if (
        request === assetRequest.current.generation &&
        !(reason instanceof Error && reason.name === "AbortError")
      )
        setSceneError(
          reason instanceof Error ? reason.message : "The asset preview could not load.",
        );
    } finally {
      if (request === assetRequest.current.generation) setAssetLoading(false);
    }
  }
  function command(input: XRCommand) {
    const parsed = XRCommandSchema.safeParse(input);
    if (!parsed.success) return;
    const action = parsed.data;
    if (
      action.type === "FOCUS_PANEL" &&
      workspace.document.entities.some((entity) => entity.id === action.panelId)
    ) {
      select(action.panelId);
      adapter.current?.focus(action.panelId);
    }
    if (action.type === "OPEN_ASSET") {
      const entity = workspace.document.entities.find(
        (entity) => entity.assetId === action.assetId,
      );
      if (entity) void openSpatialAsset(entity.id);
    }
    if (action.type === "RESET_WORKSPACE") void workspace.reset(true); // The assistant confirms before dispatch.
  }
  const vrUnavailable = !capabilities?.immersiveVRSupported;
  const statusText =
    status === "loading"
      ? "Loading studio"
      : status === "error"
        ? "3D view unavailable"
        : immersive
          ? "Immersive VR"
          : "Desktop preview";

  return (
    <section className={styles.workspace} data-testid="xr-workspace" aria-label="XR workspace">
      <header className={styles.topbar}>
        <div className={styles.sceneTitle}>
          <Box size={21} />
          <div>
            <strong>
              Spatial Studio <span className={styles.studioTag}>WORKSPACE</span>
            </strong>
            <span>
              {preview
                ? "Public sample · nothing is saved"
                : workspace.canEdit
                  ? `Project workspace · version ${workspace.version}`
                  : "Read-only project workspace"}
            </span>
          </div>
        </div>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={status !== "ready"}
            onClick={() => adapter.current?.recenter(position)}
          >
            <RotateCcw size={15} />
            Reset view
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={sessionPending || (!immersive && (status !== "ready" || vrUnavailable))}
            onClick={() => void toggleVR()}
          >
            {immersive ? <X size={16} /> : <Headset size={17} />}
            {sessionPending ? "Please wait…" : immersive ? "Exit VR" : "Enter VR"}
          </button>
        </div>
      </header>
      <div className={styles.body}>
        <nav
          className={styles.navigator}
          aria-label={preview ? "Spatial samples" : "Project navigator"}
        >
          <Link href="/" className={styles.homeLink} aria-label="Home">
            <House size={16} /> BoloVerse
          </Link>
          <div className={styles.projectIdentity}>
            <span>YOUR STUDIO</span>
            <h2>{project.name}</h2>
          </div>
          <h2>{preview ? "Spatial samples" : "Project content"}</h2>
          <p className={styles.muted}>
            {preview
              ? "Try arranging these sample panels."
              : "Your authorized brief, assets and creative work."}
          </p>
          {workspace.document.entities.map((entity) => (
            <button
              type="button"
              key={entity.id}
              aria-label={`Inspect ${entity.properties.kind === "project" ? "project overview" : entity.properties.title}`}
              aria-pressed={selected.id === entity.id}
              className={`${styles.item} ${selected.id === entity.id ? styles.itemSelected : ""}`}
              onClick={() => select(entity.id)}
            >
              <span>
                {entity.properties.kind === "project"
                  ? "Project overview"
                  : entity.properties.title}
              </span>
              <small>{entity.properties.kind}</small>
            </button>
          ))}
          {!preview && !workspace.data?.content.assets.length && (
            <p className={styles.muted}>No ready assets in this project.</p>
          )}
          {!preview && !workspace.data?.content.reviews.length && (
            <p className={styles.muted}>No client feedback has been recorded.</p>
          )}
          {!preview && (
            <a className={styles.textButton} href={`/app/projects/${project.id}`}>
              Open standard workspace
            </a>
          )}
        </nav>
        <div className={styles.stage}>
          <div className={styles.stageLabel}>
            <span className={styles.statusDot} />
            <span data-testid="xr-runtime-status" role="status">
              {statusText}
            </span>
          </div>
          <div className={styles.sceneHost} ref={host} data-testid="xr-scene-host" />
          {status !== "ready" && (
            <div className={styles.loading}>
              <strong>
                {status === "loading" ? "Opening your studio" : "3D view unavailable"}
              </strong>
              <span>
                {status === "loading"
                  ? "Preparing the spatial workspace…"
                  : "Use the project navigator and inspector. Reload to retry graphics."}
              </span>
            </div>
          )}
          <div className={styles.canvasDock} role="toolbar" aria-label="Selected object tools">
            <button
              type="button"
              aria-label="Focus selected card"
              disabled={status !== "ready"}
              onClick={() => adapter.current?.focus(selected.id)}
            >
              <Focus size={17} />
              <span>Focus</span>
            </button>
            <span className={styles.dockDivider} />
            <button
              type="button"
              aria-label="Move selected card left"
              disabled={!workspace.canEdit || workspace.busy}
              onClick={() => transform({ type: "move", axis: "x", amount: -0.25 })}
            >
              <ArrowLeft size={17} />
              <span>Left</span>
            </button>
            <button
              type="button"
              aria-label="Move selected card right"
              disabled={!workspace.canEdit || workspace.busy}
              onClick={() => transform({ type: "move", axis: "x", amount: 0.25 })}
            >
              <ArrowRight size={17} />
              <span>Right</span>
            </button>
            <button
              type="button"
              aria-label="Rotate selected card"
              disabled={!workspace.canEdit || workspace.busy}
              onClick={() => transform({ type: "rotate", axis: "y", amount: 15 })}
            >
              <RotateCw size={17} />
              <span>Rotate</span>
            </button>
            <button
              type="button"
              aria-label="Enlarge selected card"
              disabled={!workspace.canEdit || workspace.busy}
              onClick={() => transform({ type: "scale", factor: 1.1 })}
            >
              <Maximize2 size={17} />
              <span>Larger</span>
            </button>
            <button
              type="button"
              aria-label="Shrink selected card"
              disabled={!workspace.canEdit || workspace.busy}
              onClick={() => transform({ type: "scale", factor: 1 / 1.1 })}
            >
              <Minimize2 size={17} />
              <span>Smaller</span>
            </button>
          </div>
          <div className={styles.stageInstructions}>
            <MousePointer2 size={14} />
            <span>Drag to look · W A S D to move when the canvas is focused</span>
          </div>
          {process.env.NODE_ENV === "development" && showStats && stats && (
            <output className={styles.stats} aria-label="Measured renderer statistics">
              {stats.fps} FPS · {stats.frameTimeMs.toFixed(1)} ms · {stats.calls} calls ·{" "}
              {stats.objects} objects
            </output>
          )}
        </div>
        <aside className={styles.companion} aria-label="Workspace companion">
          <h2>Inspector</h2>
          <div className={styles.inspector} aria-live="polite">
            <h3>{selected.properties.title}</h3>
            <p>{selected.properties.body}</p>
          </div>
          <button
            type="button"
            className={styles.textButton}
            disabled={status !== "ready"}
            onClick={() => adapter.current?.focus(selected.id)}
          >
            Focus selected object
          </button>
          <TransformPanel
            entity={selected}
            disabled={!workspace.canEdit || workspace.busy}
            onAction={transform}
            onReset={resetObject}
          />
          {selected.assetId && (
            <div className={styles.assetActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={
                  status !== "ready" ||
                  assetLoading ||
                  selected.properties.mimeType === "application/pdf"
                }
                onClick={() => void openSpatialAsset()}
              >
                {assetLoading ? "Loading asset…" : "Preview in studio"}
              </button>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setAssetOpen((value) => !value)}
              >
                {assetOpen ? "Close preview" : "Open asset"}
              </button>
              <a
                href={`/app/projects/${project.id}/assets/${selected.assetId}`}
                className={styles.textButton}
              >
                Open in Editor
              </a>
              {assetOpen && (
                <AssetViewer
                  key={selected.assetId}
                  assetId={selected.assetId}
                  mimeType={selected.properties.mimeType ?? ""}
                />
              )}
            </div>
          )}
          <fieldset className={styles.position}>
            <legend>Viewing position</legend>
            <div>
              {(["standing", "seated"] as const).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={position === value}
                  disabled={status !== "ready"}
                  onClick={() => {
                    setPosition(value);
                    adapter.current?.recenter(value);
                  }}
                >
                  {value === "standing" ? "Standing" : "Seated"}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.capability} data-testid="xr-capability-status">
            {capabilityLoading
              ? "Checking headset support…"
              : capabilities?.immersiveVRSupported
                ? "Immersive VR is available."
                : XR_FALLBACK_MESSAGE}
            <button
              type="button"
              className={styles.textButton}
              disabled={capabilityLoading}
              onClick={() => void refresh()}
            >
              Refresh capabilities
            </button>
          </div>
          {capabilities?.immersiveARSupported && (
            <p className={styles.muted}>
              AR is supported by this browser; this studio’s AR entry is not enabled.
            </p>
          )}
          <p className={styles.deviceNote}>
            Headset and controller behavior requires physical-device verification.
          </p>
          <div className={styles.assistantSection}>
            {!preview ? (
              <AssistantPanel
                key={project.id}
                projectId={project.id}
                disabled={!workspace.canEdit || workspace.busy}
                onCommand={command}
              />
            ) : (
              <div className={styles.previewNote}>
                Open an authorized project to save layouts, preview private assets and use the
                assistant.
              </div>
            )}
          </div>
        </aside>
      </div>
      <footer className={styles.footer}>
        <span role="status" data-testid="xr-save-status">
          {workspace.busy
            ? "Saving or loading workspace…"
            : workspace.dirty
              ? preview
                ? "Sample layout changed · nothing is saved"
                : "Unsaved layout changes"
              : preview
                ? "Unsaved public sample"
                : workspace.notice || "Layout up to date"}
        </span>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!workspace.canEdit || workspace.busy}
            onClick={() => void workspace.reset()}
          >
            Reset layout
          </button>
          {!preview && (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={workspace.busy}
              onClick={() => void workspace.reload()}
            >
              Reload saved layout
            </button>
          )}
          <button
            type="button"
            className={styles.primaryButton}
            disabled={preview || !workspace.canEdit || workspace.busy || !workspace.dirty}
            onClick={() => void workspace.save()}
          >
            <Save size={16} />
            Save workspace
          </button>
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                diagnostics.current = !showStats;
                setShowStats(!showStats);
              }}
            >
              {showStats ? "Hide" : "Show"} runtime stats
            </button>
          )}
        </div>
      </footer>
      {(sceneError || workspace.error) && (
        <div className={styles.error} role="alert">
          {workspace.error || sceneError}
          {workspace.conflict && (
            <p>
              A newer saved layout exists. Your local changes are retained. Reload the saved layout
              when you are ready to discard them.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
