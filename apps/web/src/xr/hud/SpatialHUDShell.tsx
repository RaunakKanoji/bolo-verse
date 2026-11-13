"use client";

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Box,
  ChevronLeft,
  ChevronRight,
  Folder,
  Headset,
  House,
  Layers,
  Lightbulb,
  Maximize2,
  MessageCircle,
  Mic,
  MousePointer2,
  RotateCcw,
  Settings,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react";
import { StudioOverviewSchema } from "@/lib/contracts/workspace";
import { useWorkspaceData } from "@/features/platform/use-workspace-data";
import { useWorkspaceSession } from "@/features/platform/WorkspaceSession";
import { StudioAdapter, type RuntimeStats } from "../runtime/studio-adapter";
import { useXRCapabilities } from "../useXRCapabilities";
import {
  HUD_NAVIGATION,
  HUD_PANELS,
  HUD_STORAGE_KEY,
  HudEnvironmentSchema,
  HudPresetSchema,
  initialHudState,
  readHudPreferences,
  reduceHud,
  serializeHudPreferences,
  type HudPanelId,
} from "./hud-state";
import styles from "./spatial-hud.module.css";

const icons = [
  House,
  Sparkles,
  Lightbulb,
  Folder,
  MessageCircle,
  Layers,
  Users,
  Video,
  Box,
  Settings,
];
const runtimeProject = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Spatial HUD",
  objective: "Workspace navigation. No sample project is persisted.",
};
export default function SpatialHUDShell() {
  const session = useWorkspaceSession();
  return <HUDSession key={session.sessionKey} />;
}
function HUDSession() {
  const router = useRouter();
  const source = useWorkspaceData("overview", StudioOverviewSchema);
  const [state, dispatch] = useReducer(reduceHud, undefined, initialHudState);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState("Loading studio…");
  const [error, setError] = useState("");
  const [immersive, setImmersive] = useState(false);
  const [pending, setPending] = useState(false);
  const [details, setDetails] = useState(true);
  const [stats, setStats] = useState<RuntimeStats | null>(null);
  const [measure, setMeasure] = useState(false);
  const measurement = useRef(false);
  const host = useRef<HTMLDivElement>(null);
  const adapter = useRef<StudioAdapter | null>(null);
  const action = useRef<(value: string) => void>(() => undefined);
  const { capabilities, loading: capabilityLoading } = useXRCapabilities();
  const selected = source.data?.projects.find((p) => p.id === state.projectId);
  const destination = HUD_NAVIGATION.find((n) => n.id === state.workspace)!;
  const notice = source.loading
    ? "Loading workspace…"
    : source.denied
      ? "Workspace access changed. Refresh to check your access."
      : source.error
        ? "Workspace unavailable. Retry to reconnect."
        : !source.configured
          ? "Connect your workspace to load private projects."
          : "Select a project to continue your campaign.";

  useEffect(() => {
    // Storage is optional. Private data and selections never enter this preference document.
    try {
      dispatch({
        type: "restore",
        preferences: readHudPreferences(localStorage.getItem(HUD_STORAGE_KEY)),
      });
    } catch {
      /* Restricted storage still supports an ephemeral HUD. */
    }
    // Restoring optional browser preferences is an external-store hydration boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(HUD_STORAGE_KEY, serializeHudPreferences(state));
    } catch {
      /* Keep the current view usable. */
    }
  }, [hydrated, state.preferences, state]);

  function openWorkspace() {
    let target: string = destination.href;
    if (selected) {
      if (state.workspace === "projects") target = `/projects/${selected.id}`;
      if (state.workspace === "brainstorm") target = `/brainstorm?projectId=${selected.id}`;
      if (state.workspace === "create") target = `/create?projectId=${selected.id}`;
      if (state.workspace === "spatial") target = `/workspace/${selected.id}`;
    }
    router.push(target);
  }
  useLayoutEffect(() => {
    action.current = (value) => {
      if (value.startsWith("nav:")) dispatch({ type: "navigate", workspace: value.slice(4) });
      else if (value.startsWith("project:")) {
        const id = value.slice(8);
        if (source.data?.projects.some((p) => p.id === id))
          dispatch({ type: "select-project", id });
      } else if (value.startsWith("focus:")) dispatch({ type: "focus", panel: value.slice(6) });
      else if (value.startsWith("layout:")) dispatch({ type: "preset", preset: value.slice(7) });
      else if (value === "exit-vr")
        void adapter.current
          ?.exitVR()
          .catch(() => setError("Use the headset system menu to exit VR."));
      else if (value === "reset-view") adapter.current?.recenter();
      else if (value === "open-workspace") openWorkspace();
      else if (value === "open-assistant" && selected?.canEdit)
        router.push(`/studio/xr/${selected.id}`);
    };
  });
  useEffect(() => {
    if (!host.current) return;
    let active = true;
    const owned = new StudioAdapter(host.current, runtimeProject, {
      onHUDAction: (value) => {
        if (active) action.current(value);
      },
      onSelect: () => undefined,
      onSession: (value) => {
        if (active) setImmersive(value);
      },
      onStats: (value) => {
        if (active && measurement.current) setStats(value);
      },
      onError: (message, fatal) => {
        if (active) {
          setError(message);
          if (fatal) setStatus("3D view unavailable");
        }
      },
    });
    adapter.current = owned;
    void owned
      .initialize()
      .then(() => {
        if (active) setStatus("Desktop preview");
      })
      .catch((reason: unknown) => {
        owned.dispose();
        if (active) {
          setStatus("3D view unavailable");
          setError(
            reason instanceof Error
              ? reason.message
              : "Reload to retry the 3D view. Desktop controls remain available.",
          );
        }
      });
    return () => {
      active = false;
      owned.dispose();
      if (adapter.current === owned) adapter.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    adapter.current?.updateHUD({ state, data: source.data, notice, immersive });
  }, [state, source.data, notice, immersive, status]);

  async function toggleXR() {
    if (pending || !adapter.current) return;
    setPending(true);
    setError("");
    try {
      if (immersive) await adapter.current.exitVR();
      else if (capabilities?.immersiveVRSupported) await adapter.current.enterVR();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The headset session could not start.");
    } finally {
      setPending(false);
    }
  }
  function movement(panel: HudPanelId, axis: 0 | 1 | 2, amount: number) {
    const offset = [...state.preferences.offsets[panel]];
    offset[axis] = Math.round((offset[axis] + amount) * 100) / 100;
    return { type: "move-panel", panel, offset };
  }
  function move(panel: HudPanelId, axis: 0 | 1 | 2, amount: number) {
    dispatch(movement(panel, axis, amount));
  }
  function canMove(axis: 0 | 1 | 2, amount: number) {
    return reduceHud(state, movement(state.focusedPanel, axis, amount)) !== state;
  }
  const ready = status === "Desktop preview";
  const compact = state.preferences.preset === "COMPACT" || state.preferences.preset === "FOCUSED";
  return (
    <section
      className={styles.shell}
      data-testid="spatial-hud"
      aria-label="Shape Studio spatial HUD"
      data-compact={compact}
      data-preset={state.preferences.preset}
      onKeyDown={(event) => {
        if (
          event.altKey &&
          /^[1-5]$/.test(event.key) &&
          !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)
        ) {
          event.preventDefault();
          dispatch({ type: "navigate", workspace: HUD_NAVIGATION[Number(event.key) - 1].id });
        }
      }}
    >
      <header className={styles.header}>
        <Link href="/workspace" className={styles.brand}>
          <span className={styles.mark}>
            <i />
            <i />
            <i />
          </span>
          Shape Studio <small>SPATIAL</small>
        </Link>
        <span className={styles.runtime} data-testid="hud-runtime-status" role="status">
          <i />
          {immersive ? "Immersive VR" : status}
        </span>
        <button
          disabled={pending || (!immersive && (!ready || !capabilities?.immersiveVRSupported))}
          onClick={() => void toggleXR()}
          className={styles.accent}
        >
          {immersive ? <X size={16} /> : <Headset size={16} />}
          {pending ? "Please wait…" : immersive ? "Exit VR" : "Enter VR"}
        </button>
      </header>
      <div className={styles.body}>
        <nav className={styles.navigation} aria-label="Spatial navigation">
          <span className={styles.eyebrow}>YOUR STUDIO</span>
          {HUD_NAVIGATION.map((item, index) => {
            const Icon = icons[index];
            return (
              <button
                key={item.id}
                data-action-id={`nav:${item.id}`}
                aria-label={item.label}
                title={`${item.label}${index < 5 ? ` · Alt+${index + 1}` : ""}`}
                aria-current={state.workspace === item.id ? "page" : undefined}
                onClick={() => dispatch({ type: "navigate", workspace: item.id })}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <Link href="/spatial-studio" className={styles.back}>
            Studio overview <ArrowUpRight size={14} />
          </Link>
        </nav>
        <div className={styles.main}>
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>WORKSPACE / {destination.label.toUpperCase()}</p>
              <h1>
                {state.workspace === "workspace" ? "Your creative studio" : destination.label}
              </h1>
              <p>
                {state.workspace === "workspace"
                  ? "Ideas, projects and possibilities. A little more space for all of them."
                  : destination.description}
              </p>
            </div>
            <button
              onClick={() => setDetails((value) => !value)}
              aria-expanded={details}
              title="Toggle workspace details"
            >
              <Maximize2 size={16} />
              Workspace details
            </button>
          </div>
          <div className={styles.stage}>
            <div className={styles.scene} ref={host} data-testid="hud-scene-host" />
            {!ready && (
              <div className={styles.graphicsNotice} role="status">
                {status === "3D view unavailable"
                  ? "Use the workspace details and navigation below, or reload to retry graphics."
                  : "Preparing your spatial workspace…"}
              </div>
            )}
            <span className={styles.stageHint}>
              <MousePointer2 size={13} />
              Drag to look · WASD when canvas is focused
            </span>
            <button
              className={styles.recenter}
              onClick={() => adapter.current?.recenter()}
              title="Reset view"
              aria-label="Reset view"
            >
              <RotateCcw size={16} />
            </button>
            {measure && stats && (
              <output className={styles.measured} aria-label="Measured HUD renderer statistics">
                {stats.fps} FPS · {stats.frameTimeMs.toFixed(1)} ms · {stats.calls} calls ·{" "}
                {stats.triangles} triangles
              </output>
            )}
          </div>
          {details && (
            <section className={styles.details} aria-label="Workspace details">
              {source.loading ? (
                <p role="status">Loading workspace…</p>
              ) : source.error || source.denied ? (
                <div role="alert">
                  <p>{source.error || notice}</p>
                  <button onClick={source.refresh}>Retry workspace</button>
                </div>
              ) : !source.configured ? (
                <div className={styles.notice}>
                  <strong>Connect your workspace</strong>
                  <p>
                    Sign in to a configured workspace to load projects, tasks and reviews. View
                    controls work without a headset.
                  </p>
                  <div className={styles.noticeActions}>
                    <Link href="/projects">
                      Open projects <ArrowUpRight size={13} />
                    </Link>
                    <a href="/workspace/demo">
                      Try local 3D demo <ArrowUpRight size={13} />
                    </a>
                  </div>
                </div>
              ) : null}
              <div className={styles.metrics} aria-label="Workspace overview">
                {[
                  ["Active projects", source.data?.metrics.activeProjects],
                  ["Pending reviews", source.data?.metrics.pendingReviews],
                  ["Upcoming deadlines", source.data?.metrics.upcomingDeadlines],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value ?? "—"}</strong>
                  </div>
                ))}
              </div>
              {(state.workspace === "workspace" || state.workspace === "projects") && (
                <div className={styles.projectList} aria-label="Project carousel">
                  {source.data?.projects.length ? (
                    source.data.projects.slice(0, 6).map((project) => (
                      <button
                        key={project.id}
                        aria-pressed={selected?.id === project.id}
                        onClick={() => dispatch({ type: "select-project", id: project.id })}
                      >
                        <span className={styles.projectIcon}>
                          <Folder size={20} />
                        </span>
                        <strong>{project.name}</strong>
                        <small>
                          {project.clientName ?? "No client assigned"} ·{" "}
                          {project.status.replaceAll("_", " ")}
                        </small>
                        <span>
                          {project.progress === null
                            ? "Progress not set"
                            : `${project.progress}% complete`}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.empty}>
                      <Folder size={22} />
                      <strong>
                        {source.data ? "No projects yet" : "Your projects appear here"}
                      </strong>
                      <span>
                        {source.data
                          ? "Create a project to bring its campaign into this workspace."
                          : "Load your connected workspace to browse its projects."}
                      </span>
                      <Link href="/projects?new=true">
                        Create project <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {selected && (
                <article className={styles.selection} aria-label="Selected project">
                  <span className={styles.eyebrow}>SELECTED PROJECT</span>
                  <h2>{selected.name}</h2>
                  <p>{selected.objective}</p>
                  <p>
                    {selected.clientName ?? "No client assigned"}
                    {selected.dueDate ? ` · Due ${selected.dueDate}` : " · No deadline set"}
                  </p>
                  <div className={styles.actions}>
                    <Link href={`/projects/${selected.id}`}>Open project</Link>
                    <Link href={`/brainstorm?projectId=${selected.id}`}>Brainstorm</Link>
                    <a href={`/workspace/${selected.id}`}>Edit 3D scene</a>
                  </div>
                </article>
              )}
              {state.workspace !== "workspace" && (
                <div className={styles.workflow}>
                  <p>{destination.description}</p>
                  <button onClick={openWorkspace}>
                    Open {destination.label} <ArrowUpRight size={14} />
                  </button>
                  <small>
                    Full editing opens in its existing workspace. This HUD retains its view
                    preferences.
                  </small>
                </div>
              )}
              {state.workspace === "workspace" && (
                <div className={styles.feeds}>
                  <section>
                    <h2>Up next</h2>
                    {source.data?.tasks.length ? (
                      source.data.tasks
                        .filter((task) => task.status !== "done")
                        .slice(0, 4)
                        .map((task) => (
                          <Link key={task.id} href={`/projects/${task.projectId}?tab=tasks`}>
                            <span>{task.title}</span>
                            <small>{task.dueDate ?? "No deadline"}</small>
                          </Link>
                        ))
                    ) : (
                      <p>
                        {source.data ? "No upcoming tasks." : "Tasks load with your workspace."}
                      </p>
                    )}
                  </section>
                  <section>
                    <h2>Recent activity</h2>
                    {source.data?.activity.length ? (
                      source.data.activity.slice(0, 4).map((item) => (
                        <Link key={item.id} href={`/projects/${item.projectId}`}>
                          <span>{item.title}</span>
                          <small>{item.projectName}</small>
                        </Link>
                      ))
                    ) : (
                      <p>
                        {source.data
                          ? "No recent activity."
                          : "Activity loads with your workspace."}
                      </p>
                    )}
                  </section>
                </div>
              )}
              <div className={styles.actions}>
                <Link href="/projects?new=true">Create project</Link>
                <Link href="/brainstorm">Start brainstorm</Link>
                <Link href="/assets?upload=true">Upload asset</Link>
                <Link href="/create">Open Creation Studio</Link>
                <Link href="/review">Review deliverables</Link>
              </div>
            </section>
          )}
        </div>
        <aside className={styles.companion} aria-label="Spatial companion">
          <section className={styles.assistant}>
            <div className={styles.assistantTop}>
              <span>Shape AI</span>
              <small>Idle</small>
            </div>
            <div className={styles.orb}>
              <Mic size={25} />
            </div>
            <h2>Make room for your next idea.</h2>
            <p>
              {selected
                ? `Continue with ${selected.name} in its project assistant.`
                : "Choose a project to work with its brief, assets and existing voice assistant."}
            </p>
            {selected?.canEdit ? (
              <Link href={`/studio/xr/${selected.id}`} className={styles.accent}>
                Open project assistant <ArrowUpRight size={14} />
              </Link>
            ) : (
              <button onClick={() => dispatch({ type: "navigate", workspace: "projects" })}>
                Choose a project <ChevronRight size={14} />
              </button>
            )}
            <small>
              Voice capture is available in the project assistant. No microphone is active here.
            </small>
          </section>
          <section className={styles.viewControls}>
            <h2>Your space</h2>
            <label>
              Layout preset
              <select
                aria-label="Layout preset"
                value={state.preferences.preset}
                onChange={(event) => dispatch({ type: "preset", preset: event.target.value })}
              >
                {HudPresetSchema.options.map((preset) => (
                  <option key={preset}>{preset}</option>
                ))}
              </select>
            </label>
            <label>
              Environment
              <select
                aria-label="Environment"
                value={state.preferences.environment}
                onChange={(event) =>
                  dispatch({ type: "environment", environment: event.target.value })
                }
              >
                {HudEnvironmentSchema.options.map((env) => (
                  <option key={env}>{env}</option>
                ))}
              </select>
            </label>
            <label>
              Adjust panel
              <select
                aria-label="Adjust panel"
                value={state.focusedPanel}
                onChange={(event) => dispatch({ type: "focus", panel: event.target.value })}
              >
                {HUD_PANELS.map((panel) => (
                  <option key={panel}>{panel}</option>
                ))}
              </select>
            </label>
            <div className={styles.adjust} role="group" aria-label="Panel position">
              <button
                aria-label="Move panel left"
                disabled={!canMove(0, -0.1)}
                onClick={() => move(state.focusedPanel, 0, -0.1)}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                aria-label="Move panel right"
                disabled={!canMove(0, 0.1)}
                onClick={() => move(state.focusedPanel, 0, 0.1)}
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => move(state.focusedPanel, 2, -0.1)}
                disabled={!canMove(2, -0.1)}
              >
                Farther
              </button>
              <button onClick={() => move(state.focusedPanel, 2, 0.1)} disabled={!canMove(2, 0.1)}>
                Nearer
              </button>
            </div>
            <output aria-label="Panel offset">
              {state.preferences.offsets[state.focusedPanel].join(", ")} m
            </output>
            <button
              onClick={() => {
                dispatch({ type: "reset-layout" });
                adapter.current?.recenter();
              }}
            >
              Reset layout
            </button>
            <button
              aria-pressed={measure}
              onClick={() => {
                measurement.current = !measure;
                setMeasure(!measure);
              }}
            >
              {" "}
              {measure ? "Hide" : "Measure"} renderer stats
            </button>
          </section>
          <p className={styles.capability}>
            {capabilityLoading
              ? "Checking headset support…"
              : capabilities?.immersiveVRSupported
                ? "Immersive VR available. Use controller rays to select spatial controls."
                : "No immersive VR headset available. Desktop controls remain ready."}{" "}
            AR and hand tracking are not enabled.
          </p>
        </aside>
      </div>
      <footer className={styles.dock} role="toolbar" aria-label="Spatial quick actions">
        {HUD_NAVIGATION.slice(0, 6).map((nav, i) => {
          const Icon = icons[i];
          return (
            <button
              key={nav.id}
              title={nav.label}
              aria-label={nav.label}
              aria-pressed={state.workspace === nav.id}
              onClick={() => dispatch({ type: "navigate", workspace: nav.id })}
            >
              <Icon size={18} />
              <span>{nav.label}</span>
            </button>
          );
        })}
        <button
          title="Voice assistant"
          aria-label="Voice assistant"
          onClick={() => action.current(selected?.canEdit ? "open-assistant" : "nav:projects")}
        >
          <Mic size={18} />
          <span>Voice</span>
        </button>
      </footer>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
