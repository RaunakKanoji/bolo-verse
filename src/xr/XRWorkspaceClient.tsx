"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Box,
  Check,
  CircleHelp,
  Focus,
  Headset,
  MousePointer2,
  RotateCcw,
  Scan,
  X,
} from "lucide-react";
import { StudioAdapter, type RuntimeStats, type ViewingPosition } from "./runtime/studio-adapter";
import { detectXRCapability, type XRCapability } from "./runtime/capability";
import { createStudioDocument, type SceneEntity } from "./serializers/scene-document";
import type { XRWorkspaceProps } from "./XRWorkspace";
import styles from "./workspace.module.css";

export default function XRWorkspaceClient({ project, preview = false }: XRWorkspaceProps) {
  const host = useRef<HTMLDivElement>(null);
  const adapter = useRef<StudioAdapter | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SceneEntity>(
    () => createStudioDocument(project).entities[0],
  );
  const [capability, setCapability] = useState<XRCapability>({
    state: "checking",
    message: "Checking headset support…",
  });
  const [immersive, setImmersive] = useState(false);
  const [sessionPending, setSessionPending] = useState(false);
  const [position, setPosition] = useState<ViewingPosition>("standing");
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [showStats, setShowStats] = useState(false);
  const samples = createStudioDocument(project).entities;

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let active = true;
    const owned = new StudioAdapter(
      element,
      { id: project.id, name: project.name, objective: project.objective },
      {
        onSelect: (entity) => {
          if (active) setSelected(entity);
        },
        onSession: (value) => {
          if (active) setImmersive(value);
        },
        onStats: (value) => {
          if (active) setStats(value);
        },
        onError: (message, fatal) => {
          if (active) {
            setError(message);
            if (fatal) setStatus("error");
          }
        },
      },
    );
    adapter.current = owned;
    void owned
      .initialize()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        owned.dispose();
        setStatus("error");
        setError(
          reason instanceof Error
            ? reason.message
            : "The 3D workspace could not load. Reload to retry.",
        );
      });
    void detectXRCapability(navigator.xr, window.isSecureContext).then((value) => {
      if (active) setCapability(value);
    });
    const onDeviceChange = () => {
      void detectXRCapability(navigator.xr, window.isSecureContext).then((value) => {
        if (active) setCapability(value);
      });
    };
    navigator.xr?.addEventListener("devicechange", onDeviceChange);
    return () => {
      active = false;
      navigator.xr?.removeEventListener("devicechange", onDeviceChange);
      owned.dispose();
      if (adapter.current === owned) adapter.current = null;
    };
  }, [project.id, project.name, project.objective]);

  const toggleVR = async () => {
    if (!adapter.current || sessionPending) return;
    setSessionPending(true);
    setError("");
    try {
      if (immersive) await adapter.current.exitVR();
      else if (capability.state === "supported") await adapter.current.enterVR();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The headset session could not change. Try again.",
      );
    } finally {
      setSessionPending(false);
    }
  };

  const changePosition = (value: ViewingPosition) => {
    setPosition(value);
    adapter.current?.recenter(value);
  };

  return (
    <section className={styles.workspace} data-testid="xr-workspace" aria-label="XR workspace">
      <div className={styles.topbar}>
        <div className={styles.sceneTitle}>
          <span className={styles.titleIcon}>
            <Box size={19} />
          </span>
          <div>
            <strong>Creative studio</strong>
            <span>
              {preview
                ? "Public sample · nothing is saved"
                : "Project workspace · scene changes are not saved"}
            </span>
          </div>
        </div>
        <div className={styles.toolbar}>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={status !== "ready"}
            onClick={() => adapter.current?.recenter(position)}
          >
            <RotateCcw size={15} />
            Reset view
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            disabled={
              (!immersive && status !== "ready") ||
              sessionPending ||
              (!immersive && capability.state !== "supported")
            }
            onClick={() => void toggleVR()}
            title={!immersive ? capability.message : "End the immersive headset session"}
          >
            {immersive ? <X size={16} /> : <Headset size={17} />}
            {sessionPending ? "Please wait…" : immersive ? "Exit VR" : "Enter VR"}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.stage}>
          <div className={styles.stageLabel}>
            <span className={styles.statusDot} />
            <span data-testid="xr-runtime-status" role="status">
              {status === "loading"
                ? "Loading studio"
                : status === "error"
                  ? "Scene unavailable"
                  : immersive
                    ? "Immersive VR"
                    : "Desktop preview"}
            </span>
          </div>
          <div className={styles.sceneHost} ref={host} data-testid="xr-scene-host" />
          {status === "loading" && (
            <div className={styles.loading}>
              <Scan size={28} />
              <strong>Opening your studio</strong>
              <span>Preparing the spatial workspace…</span>
            </div>
          )}
          {status === "error" && (
            <div className={styles.loading}>
              <CircleHelp size={28} />
              <strong>3D preview unavailable</strong>
              <span>Project details remain available in the companion panel.</span>
            </div>
          )}
          <div className={styles.stageInstructions}>
            <MousePointer2 size={14} />
            <span>Drag to look</span>
            <span className={styles.separator}>·</span>
            <kbd>W A S D</kbd>
            <span>to move when canvas is focused</span>
          </div>
          {showStats && stats && (
            <output className={styles.stats} aria-label="Measured renderer statistics">
              {stats.fps} observed FPS · {stats.calls} draw calls ·{" "}
              {stats.triangles.toLocaleString()} triangles
            </output>
          )}
        </div>

        <aside className={styles.companion} aria-label="Workspace companion">
          <div className={styles.companionHeading}>
            <Focus size={16} />
            <h2>Inspector</h2>
            <span>2D companion</span>
          </div>
          <div className={styles.inspector} aria-live="polite" aria-atomic="true">
            <span className={styles.eyebrow}>
              {selected.properties.kind === "sample" ? "SPATIAL SAMPLE" : "PROJECT OVERVIEW"}
            </span>
            <h3>{selected.properties.title}</h3>
            <p>{selected.properties.body}</p>
            {selected.properties.kind === "sample" && (
              <div className={styles.sampleNote}>Sample content · no saved project artifact</div>
            )}
          </div>
          <div className={styles.items}>
            <h3>Spatial samples</h3>
            {samples.map((entity, index) => (
              <button
                key={entity.id}
                type="button"
                aria-label={`Inspect ${entity.properties.kind === "project" ? "project overview" : entity.properties.title}`}
                aria-pressed={selected.id === entity.id}
                className={`${styles.item} ${selected.id === entity.id ? styles.itemSelected : ""}`}
                onClick={() => {
                  setSelected(entity);
                  adapter.current?.select(entity.id);
                }}
              >
                <span className={styles.itemNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  {entity.properties.kind === "project"
                    ? "Project overview"
                    : entity.properties.title}
                </span>
                {selected.id === entity.id ? <Check size={15} /> : <ArrowUpRight size={15} />}
              </button>
            ))}
          </div>
          <fieldset className={styles.position}>
            <legend>Viewing position</legend>
            <div>
              {(["standing", "seated"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={position === value}
                  disabled={status !== "ready"}
                  onClick={() => changePosition(value)}
                >
                  {value === "standing" ? "Standing" : "Seated"}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.capability} data-testid="xr-capability-status">
            <Headset size={16} />
            <p>{capability.message}</p>
          </div>
          <p className={styles.deviceNote}>
            Headset and controller behavior still needs physical-device verification. No microphone
            is used.
          </p>
        </aside>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <footer className={styles.footer}>
        <span>Phase 1 foundation · select and inspect</span>
        <button
          type="button"
          aria-pressed={showStats}
          onClick={() => setShowStats((value) => !value)}
        >
          {showStats ? "Hide" : "Show"} runtime stats
        </button>
      </footer>
    </section>
  );
}
