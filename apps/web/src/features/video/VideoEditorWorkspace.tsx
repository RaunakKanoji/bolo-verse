"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Clapperboard, Plus, Save, Film } from "lucide-react";
import { z } from "zod";
import type { AssetSummary } from "@/lib/contracts/assets";
import { AssetListSchema } from "@/lib/contracts/shape";
import { StudioProjectListSchema } from "@/lib/contracts/workspace";
import {
  VideoEditorResultSchema,
  VideoEditorDocumentSchema,
  VideoRenderListSchema,
  VideoRenderResultSchema,
  type VideoEditorDocument,
  type VideoEditorDraft,
  type VideoEditorCapabilities,
  type VideoRenderJob,
} from "@/lib/contracts/video-editor";
import { CreationAccessError, creationRequest } from "@/features/creation/creation-http";
import { useWorkspaceData } from "@/features/platform/use-workspace-data";
import { useWorkspaceSession } from "@/features/platform/WorkspaceSession";
import { Dialog } from "@/features/platform/WorkspaceUI";
import { useVideoDirty } from "./use-video-dirty";
import { loadVideoPreview, videoSourceTypes } from "./private-preview";
import ShotstackEditor from "./ShotstackEditor";
import styles from "./video-editor.module.css";
const empty: VideoEditorDocument = {
  schemaVersion: 1,
  aspectRatio: "16:9",
  clips: [],
  overlays: [],
};
const fingerprint = (document: VideoEditorDocument) => JSON.stringify(document);
const errorText = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : "This video request could not be completed. Your local edit is retained.";
type Loaded = {
  draft: VideoEditorDraft;
  capabilities: VideoEditorCapabilities;
  assets: AssetSummary[];
  jobs: VideoRenderJob[];
};
export default function VideoEditorWorkspace({
  initialProjectId = "",
  invalidProject = false,
}: {
  initialProjectId?: string;
  invalidProject?: boolean;
}) {
  const { sessionKey } = useWorkspaceSession();
  return (
    <VideoWorkspaceSession
      key={sessionKey}
      initialProjectId={initialProjectId}
      invalidProject={invalidProject}
    />
  );
}
function VideoWorkspaceSession({
  initialProjectId,
  invalidProject,
}: {
  initialProjectId: string;
  invalidProject: boolean;
}) {
  const projects = useWorkspaceData("projects?limit=100", StudioProjectListSchema);
  const [projectId, setProjectId] = useState(initialProjectId);
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Creation / Video</span>
          <h1>A story, frame by frame.</h1>
          <p className={styles.subtle}>
            Arrange private project media, refine your timing and preview with Shotstack Studio.
          </p>
        </div>
        <label className={styles.project}>
          Project
          <select
            aria-label="Video project"
            value={projectId}
            onChange={(event) => {
              if (window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true })))
                setProjectId(event.target.value);
            }}
          >
            <option value="">Choose a project</option>
            {projects.data?.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.canEdit ? "" : " · view only"}
              </option>
            ))}
          </select>
        </label>
      </header>
      {invalidProject && !projectId && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          The project link is invalid. Choose an authorized project to continue.
        </p>
      )}
      {projects.error && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          {projects.error} <button onClick={projects.refresh}>Retry projects</button>
        </p>
      )}
      {!projects.configured && (
        <p className={styles.notice}>
          Connect your workspace and sign in to select private project media. The editor supports
          images, video clips, titles and captions; saving and rendering require an authorized
          project.
        </p>
      )}
      {projects.loading && <p role="status">Loading projects…</p>}
      <VideoProject key={projectId || "local"} projectId={projectId} />
    </main>
  );
}
function VideoProject({ projectId }: { projectId: string }) {
  const session = useWorkspaceSession();
  const [loaded, setLoaded] = useState<Loaded | null>(null),
    [document, setDocument] = useState<VideoEditorDocument>(empty);
  const [saved, setSaved] = useState(fingerprint(empty)),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [denied, setDenied] = useState(false),
    [confirm, setConfirm] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [sdkError, setSdkError] = useState("");
  const requests = useRef(new Set<AbortController>()),
    alive = useRef(true),
    renderAttempt = useRef<{ revision: number; key: string } | null>(null);
  const dirty = fingerprint(document) !== saved;
  useVideoDirty(dirty);
  const validation = VideoEditorDocumentSchema.safeParse(document);
  const subsetError = document.clips.some(
    (clip) =>
      clip.audioLevel > 1 ||
      (clip.trimStartSeconds !== 0 &&
        loaded?.assets.find((asset) => asset.id === clip.assetId)?.mimeType.startsWith("image/")),
  )
    ? "This editor supports volume up to 1 and trimming video sources only."
    : "";
  const valid = validation.success && !subsetError;
  const editable = Boolean(loaded?.draft.canEdit && !denied);
  const endpoint = `/api/v1/projects/${projectId}/video-editor`;
  useLayoutEffect(() => {
    alive.current = true;
    const pending = requests.current;
    return () => {
      alive.current = false;
      pending.forEach((controller) => controller.abort());
      pending.clear();
    };
  }, []);
  const revoke = useCallback(() => {
    requests.current.forEach((controller) => controller.abort());
    setLoaded(null);
    setDocument(empty);
    setSaved(fingerprint(empty));
    setDenied(true);
    setConfirm(false);
    setSdkError("");
    setError("Your project access changed. Reopen an authorized project to continue.");
  }, []);
  function report(cause: unknown) {
    if (!alive.current) return;
    if (cause instanceof CreationAccessError) revoke();
    else setError(errorText(cause));
  }
  async function request<T>(path: string, schema: z.ZodType<T>, options: RequestInit = {}) {
    const controller = new AbortController();
    requests.current.add(controller);
    try {
      const result = await creationRequest(path, schema, options, controller.signal);
      if (!alive.current || controller.signal.aborted)
        throw new DOMException("Aborted", "AbortError");
      return result;
    } finally {
      requests.current.delete(controller);
    }
  }
  useEffect(() => {
    if (
      !projectId ||
      !session.configured ||
      !session.isLoaded ||
      session.sessionKey === "signed-out"
    )
      return;
    const controller = new AbortController();
    requests.current.add(controller);
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setError("");
      }
    });
    void Promise.all([
      creationRequest(endpoint, VideoEditorResultSchema, {}, controller.signal),
      creationRequest(
        `/api/v1/projects/${projectId}/assets`,
        AssetListSchema,
        {},
        controller.signal,
      ),
      creationRequest(`${endpoint}/renders`, VideoRenderListSchema, {}, controller.signal),
    ])
      .then(([result, catalog, renders]) => {
        if (controller.signal.aborted || !alive.current) return;
        if (
          result.draft.projectId !== projectId ||
          catalog.assets.some((asset) => asset.projectId !== projectId) ||
          renders.jobs.some((job) => job.projectId !== projectId) ||
          !result.draft.canEdit
        ) {
          revoke();
          return;
        }
        setLoaded({ ...result, assets: catalog.assets, jobs: renders.jobs });
        const next = result.draft.document ?? empty;
        setDocument(next);
        setSaved(fingerprint(next));
        setNotice(
          result.draft.revision
            ? `Loaded private video draft · revision ${result.draft.revision}`
            : "New private video edit",
        );
      })
      .catch((cause) => {
        if (!controller.signal.aborted) report(cause);
      })
      .finally(() => {
        requests.current.delete(controller);
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // This request initializes a keyed project scope; explicit reload is the only replacement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, session.configured, session.isLoaded, session.sessionKey, attempt]);
  const pendingJobs =
    loaded?.jobs
      .filter((job) => job.status === "queued" || job.status === "processing")
      .map((job) => job.id)
      .join(":") ?? "";
  useEffect(() => {
    if (
      !loaded ||
      loaded.capabilities.availability !== "configured" ||
      denied ||
      !loaded.jobs.some((job) => job.status === "queued" || job.status === "processing")
    )
      return;
    const controller = new AbortController();
    let running = false;
    const poll = async () => {
      if (running) return;
      running = true;
      try {
        for (const job of loaded.jobs.filter(
          (job) => job.status === "queued" || job.status === "processing",
        )) {
          await creationRequest(
            `${endpoint}/renders/${job.id}/refresh`,
            VideoRenderResultSchema,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
            controller.signal,
          );
          controller.signal.throwIfAborted();
        }
        const result = await creationRequest(
          `${endpoint}/renders`,
          VideoRenderListSchema,
          {},
          controller.signal,
        );
        if (!controller.signal.aborted && alive.current) {
          if (result.jobs.some((job) => job.projectId !== projectId)) revoke();
          else setLoaded((previous) => (previous ? { ...previous, jobs: result.jobs } : null));
        }
      } catch (cause) {
        if (!controller.signal.aborted) report(cause);
      } finally {
        running = false;
      }
    };
    const timer = setInterval(() => void poll(), 3000);
    const pending = requests.current;
    pending.add(controller);
    return () => {
      clearInterval(timer);
      controller.abort();
      pending.delete(controller);
    };
    // Active job IDs scope safe provider refreshes; teardown aborts every pending read/import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingJobs, denied, endpoint, projectId]);
  function update(next: VideoEditorDocument) {
    setDocument(next);
    setError("");
    setNotice("");
    setConfirm(false);
  }
  function changeClip(id: string, values: Partial<VideoEditorDocument["clips"][number]>) {
    update({
      ...document,
      clips: document.clips.map((clip) => (clip.id === id ? { ...clip, ...values } : clip)),
    });
  }
  function changeOverlay(id: string, values: Partial<VideoEditorDocument["overlays"][number]>) {
    update({
      ...document,
      overlays: document.overlays.map((overlay) =>
        overlay.id === id ? { ...overlay, ...values } : overlay,
      ),
    });
  }
  const catalog =
    loaded?.assets.filter(
      (asset) =>
        videoSourceTypes.includes(asset.mimeType) &&
        asset.byteSize > 0 &&
        asset.byteSize <= 20 * 1024 * 1024 &&
        asset.contentUrl === `/api/v1/assets/${asset.id}/content`,
    ) ?? [];
  function addAsset(asset: AssetSummary) {
    const end = Math.max(
      0,
      ...document.clips.map((clip) => clip.startSeconds + clip.durationSeconds),
    );
    const duration = Math.min(5, 60 - end, asset.durationSeconds ?? 5);
    if (duration <= 0 || document.clips.length >= 50) {
      setError("The timeline is limited to 60 seconds and 50 clips.");
      return;
    }
    update({
      ...document,
      clips: [
        ...document.clips,
        {
          id: crypto.randomUUID(),
          assetId: asset.id,
          startSeconds: end,
          durationSeconds: duration,
          trimStartSeconds: 0,
          audioLevel: 1,
        },
      ],
    });
  }
  async function save() {
    if (!loaded || !editable || !valid || sdkError) return;
    const input = { expectedRevision: loaded.draft.revision, document: structuredClone(document) };
    setBusy(true);
    setError("");
    try {
      const result = await request(endpoint, VideoEditorResultSchema, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (result.draft.projectId !== projectId || !result.draft.canEdit) {
        revoke();
        return;
      }
      setLoaded((previous) => (previous ? { ...previous, ...result } : null));
      setSaved(fingerprint(input.document));
      setNotice(`Saved private video draft · revision ${result.draft.revision}`);
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function render() {
    if (!loaded || dirty || !valid || sdkError || loaded.capabilities.availability !== "configured")
      return;
    if (!renderAttempt.current || renderAttempt.current.revision !== loaded.draft.revision)
      renderAttempt.current = { revision: loaded.draft.revision, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      const result = await request(`${endpoint}/renders`, VideoRenderResultSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: renderAttempt.current.key,
          draftRevision: loaded.draft.revision,
          consent: "shotstack-render-v1",
        }),
      });
      if (result.job.projectId !== projectId) {
        revoke();
        return;
      }
      setLoaded((previous) =>
        previous
          ? {
              ...previous,
              jobs: [result.job, ...previous.jobs.filter((job) => job.id !== result.job.id)].slice(
                0,
                50,
              ),
            }
          : null,
      );
      setConfirm(false);
      setNotice("Render request accepted. Check its status below.");
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function refreshJob(id: string) {
    setBusy(true);
    setError("");
    try {
      const result = await request(`${endpoint}/renders/${id}/refresh`, VideoRenderResultSchema, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (result.job.projectId !== projectId) {
        revoke();
        return;
      }
      setLoaded((previous) =>
        previous
          ? { ...previous, jobs: previous.jobs.map((job) => (job.id === id ? result.job : job)) }
          : null,
      );
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      {error && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          {error}
        </p>
      )}
      {loading && <p role="status">Loading private video draft and source catalog…</p>}
      {notice && (
        <p role="status" className={styles.status}>
          {notice}
          {dirty ? " · Unsaved changes" : ""}
        </p>
      )}
      {projectId && !loading && !loaded && !denied && (
        <p className={styles.notice}>
          Choose an accessible project and connect your workspace to load private media.{" "}
          <button onClick={() => setAttempt((value) => value + 1)}>Retry video editor</button>
        </p>
      )}
      <div className={styles.actions}>
        <label>
          Aspect ratio
          <select
            aria-label="Video aspect ratio"
            value={document.aspectRatio}
            disabled={!editable || busy}
            onChange={(event) =>
              update({
                ...document,
                aspectRatio: event.target.value as VideoEditorDocument["aspectRatio"],
              })
            }
          >
            <option>16:9</option>
            <option>9:16</option>
            <option>1:1</option>
          </select>
        </label>
        <button
          onClick={() => void save()}
          disabled={!editable || busy || !valid || Boolean(sdkError) || !dirty}
        >
          <Save size={14} aria-hidden="true" /> Save video draft
        </button>
        <button
          className={styles.primary}
          onClick={() => setConfirm(true)}
          disabled={
            !editable ||
            busy ||
            !valid ||
            Boolean(sdkError) ||
            dirty ||
            !loaded?.draft.revision ||
            loaded.capabilities.availability !== "configured"
          }
        >
          Render video
        </button>
        <button
          onClick={() => {
            if (window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true })))
              setAttempt((value) => value + 1);
          }}
          disabled={!editable || busy}
        >
          Reload saved edit
        </button>
        {loaded && (
          <span className={styles.status}>
            Shotstack {loaded.capabilities.availability}
            {loaded.capabilities.environment ? ` · ${loaded.capabilities.environment}` : ""}
          </span>
        )}
      </div>
      {loaded?.capabilities.availability !== "configured" && loaded && (
        <p className={styles.notice}>
          {loaded.capabilities.reason ?? "Shotstack rendering is unavailable."} Preview and private
          draft saves do not send a render request.
        </p>
      )}
      {document.clips.length > 0 && (!valid || sdkError) && (
        <p role="alert" className={`${styles.notice} ${styles.error}`}>
          {sdkError ||
            subsetError ||
            "Use nonoverlapping clips within 60 seconds, positive durations and nonempty text. Save and preview resume when the edit is valid."}
        </p>
      )}
      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Video preview and timeline">
          {editable && valid ? (
            <ShotstackEditor
              document={document}
              assets={loaded?.assets ?? []}
              onChange={(next) => {
                setSdkError("");
                update(next);
              }}
              onError={setSdkError}
              onAccessError={revoke}
            />
          ) : (
            <div className={styles.empty}>
              <Clapperboard size={42} />
              <h2>Your timeline starts here.</h2>
              <p>
                {denied
                  ? "Project access is unavailable. Select an authorized project to continue."
                  : projectId
                    ? "Add a ready image or video from this project's source catalog. Your edit stays private until you explicitly request a render."
                    : "Choose a project to arrange your media, add titles and shape a video up to 60 seconds."}
              </p>
            </div>
          )}
          <p className={styles.footnote}>
            Local preview · actual Shotstack Studio canvas and draggable timeline. Only ready
            project PNG, JPEG, WebP, MP4 and WebM sources, sequential clips, trim, volume and text
            are supported. Canvas transforms and other unsupported SDK changes are rejected visibly.
          </p>
        </section>
        <aside className={styles.panel}>
          <h2>Project sources</h2>
          <p className={styles.subtle}>Ready private media · up to 20 MiB each</p>
          <div className={styles.catalog}>
            {catalog.length ? (
              catalog.map((asset) => (
                <div key={asset.id} className={styles.asset}>
                  <span>
                    {asset.mimeType.startsWith("video/") ? (
                      <Film size={16} />
                    ) : (
                      <Clapperboard size={16} />
                    )}{" "}
                    {asset.mimeType.split("/")[1].toUpperCase()} · {asset.id.slice(0, 8)}
                    <small>
                      {(asset.byteSize / 1024).toFixed(0)} KiB
                      {asset.mimeType.startsWith("video/") && asset.durationSeconds === null
                        ? " · duration unknown"
                        : ""}
                      {asset.durationSeconds ? ` · ${asset.durationSeconds.toFixed(1)}s` : ""}
                    </small>
                  </span>
                  <button
                    disabled={!editable || busy}
                    aria-label={`Add source ${asset.id}`}
                    onClick={() => addAsset(asset)}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.subtle}>
                No supported sources are available. Upload ready media in Assets, then reload this
                edit.
              </p>
            )}
          </div>
        </aside>
        <section className={styles.panel}>
          <h2>
            Clip timing <span className={styles.subtle}>({document.clips.length}/50)</span>
          </h2>
          <div className={styles.list}>
            {document.clips.length ? (
              document.clips.map((clip, index) => (
                <div key={clip.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <h3>
                      Clip {index + 1} · {clip.assetId.slice(0, 8)}
                    </h3>
                    <button
                      disabled={!editable || busy}
                      onClick={() =>
                        update({
                          ...document,
                          clips: document.clips.filter((item) => item.id !== clip.id),
                        })
                      }
                    >
                      Remove clip {index + 1}
                    </button>
                  </div>
                  <div className={styles.fields}>
                    {(
                      [
                        ["Start", "startSeconds", 0, 59.9],
                        ["Duration", "durationSeconds", 0.1, 60],
                        ["Trim", "trimStartSeconds", 0, 599],
                        ["Volume", "audioLevel", 0, 1],
                      ] as const
                    ).map(([label, key, min, max]) => (
                      <label key={key}>
                        {label}
                        {key === "audioLevel" ? " (0–1)" : " (seconds)"}
                        <input
                          aria-label={`Clip ${index + 1} ${label.toLowerCase()}`}
                          type="number"
                          min={min}
                          max={max}
                          step="0.1"
                          value={clip[key]}
                          disabled={
                            !editable ||
                            busy ||
                            (key === "trimStartSeconds" &&
                              loaded?.assets
                                .find((asset) => asset.id === clip.assetId)
                                ?.mimeType.startsWith("image/"))
                          }
                          onChange={(event) =>
                            changeClip(clip.id, { [key]: Number(event.target.value) })
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.subtle}>Add a project source to begin.</p>
            )}
          </div>
        </section>
        <section className={styles.panel}>
          <h2>Titles & captions</h2>
          <div className={styles.actions}>
            {(["title", "caption"] as const).map((kind) => (
              <button
                key={kind}
                disabled={!editable || busy || document.overlays.length >= 50}
                onClick={() =>
                  update({
                    ...document,
                    overlays: [
                      ...document.overlays,
                      {
                        id: crypto.randomUUID(),
                        kind,
                        text: kind === "title" ? "Your title" : "Your caption",
                        startSeconds: 0,
                        durationSeconds: Math.min(
                          5,
                          Math.max(
                            1,
                            ...document.clips.map(
                              (clip) => clip.startSeconds + clip.durationSeconds,
                            ),
                          ),
                        ),
                        style: {
                          color: "#ffffff",
                          fontSize: kind === "title" ? 48 : 32,
                          align: "center",
                        },
                      },
                    ],
                  })
                }
              >
                Add {kind}
              </button>
            ))}
          </div>
          <div className={styles.list}>
            {document.overlays.map((overlay, index) => (
              <div className={styles.item} key={overlay.id}>
                <div className={styles.itemHeader}>
                  <h3>
                    {overlay.kind} {index + 1}
                  </h3>
                  <button
                    disabled={!editable || busy}
                    onClick={() =>
                      update({
                        ...document,
                        overlays: document.overlays.filter((item) => item.id !== overlay.id),
                      })
                    }
                  >
                    Remove text {index + 1}
                  </button>
                </div>
                <div className={styles.fields}>
                  <label className={styles.wide}>
                    Text
                    <textarea
                      aria-label={`Text ${index + 1}`}
                      maxLength={500}
                      value={overlay.text}
                      disabled={!editable || busy}
                      onChange={(event) => changeOverlay(overlay.id, { text: event.target.value })}
                    />
                  </label>
                  {(
                    [
                      ["Start", "startSeconds", 0],
                      ["Duration", "durationSeconds", 0.1],
                    ] as const
                  ).map(([label, key, min]) => (
                    <label key={key}>
                      {label} (seconds)
                      <input
                        aria-label={`Text ${index + 1} ${label.toLowerCase()}`}
                        type="number"
                        min={min}
                        max="60"
                        step="0.1"
                        disabled={!editable || busy}
                        value={overlay[key]}
                        onChange={(event) =>
                          changeOverlay(overlay.id, { [key]: Number(event.target.value) })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Color
                    <input
                      aria-label={`Text ${index + 1} color`}
                      type="color"
                      disabled={!editable || busy}
                      value={overlay.style.color}
                      onChange={(event) =>
                        changeOverlay(overlay.id, {
                          style: { ...overlay.style, color: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Size
                    <input
                      aria-label={`Text ${index + 1} size`}
                      type="number"
                      min="12"
                      max="120"
                      disabled={!editable || busy}
                      value={overlay.style.fontSize}
                      onChange={(event) =>
                        changeOverlay(overlay.id, {
                          style: { ...overlay.style, fontSize: Number(event.target.value) },
                        })
                      }
                    />
                  </label>
                  <label>
                    Alignment
                    <select
                      aria-label={`Text ${index + 1} alignment`}
                      disabled={!editable || busy}
                      value={overlay.style.align}
                      onChange={(event) =>
                        changeOverlay(overlay.id, {
                          style: {
                            ...overlay.style,
                            align: event.target.value as "left" | "center" | "right",
                          },
                        })
                      }
                    >
                      <option>left</option>
                      <option>center</option>
                      <option>right</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className={`${styles.panel} ${styles.jobs}`}>
        <h2>Private renders</h2>
        <p className={styles.subtle}>
          Status refreshes every 3 seconds while pending, checking Shotstack and importing verified
          output into private storage. You can also refresh manually.
        </p>
        {loaded?.jobs.length ? (
          loaded.jobs.map((job) => (
            <div key={job.id} className={styles.job}>
              <div>
                <h3>
                  Revision {job.draftRevision} · {job.status}
                </h3>
                <p className={styles.subtle}>
                  {job.environment} · {new Date(job.createdAt).toLocaleString()}
                </p>
                {job.errorMessage && <p role="status">{job.errorMessage}</p>}
                <button disabled={busy || !editable} onClick={() => void refreshJob(job.id)}>
                  Refresh status {job.id.slice(0, 8)}
                </button>
              </div>
              {job.status === "ready" && job.outputAsset && (
                <RenderPreview asset={job.outputAsset} onAccessError={revoke} />
              )}
            </div>
          ))
        ) : (
          <p className={styles.subtle}>
            No renders for this private draft. Save your edit before requesting one.
          </p>
        )}
      </section>
      <Dialog
        open={confirm}
        title="Render with Shotstack?"
        onClose={() => {
          if (!busy) setConfirm(false);
        }}
      >
        <p>
          Your saved edit and temporary access to its selected project media will be sent to
          Shotstack in the <strong>{loaded?.capabilities.environment ?? "unconfigured"}</strong>{" "}
          environment.
        </p>
        <p>
          Rendering may incur provider charges according to your Shotstack account and environment.
          Sandbox output follows Shotstack sandbox rules. No AI generation is included. The verified
          MP4 will be imported into private project storage.
        </p>
        <p>
          Draft revision {loaded?.draft.revision}. Preview and saving do not render or transfer
          media to Shotstack.
        </p>
        <div className={styles.dialogActions}>
          <button disabled={busy} onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button disabled={busy} onClick={() => void render()}>
            {busy ? "Requesting render…" : "Confirm Shotstack render"}
          </button>
        </div>
      </Dialog>
    </>
  );
}
function RenderPreview({
  asset,
  onAccessError,
}: {
  asset: AssetSummary;
  onAccessError: () => void;
}) {
  const [result, setResult] = useState({ url: "", error: "" });
  useEffect(() => {
    const controller = new AbortController();
    let owned = "";
    void loadVideoPreview(asset, controller.signal)
      .then((url) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          return;
        }
        owned = url;
        setResult({ url, error: "" });
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        if (cause instanceof CreationAccessError) onAccessError();
        else setResult({ url: "", error: errorText(cause) });
      });
    return () => {
      controller.abort();
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [asset, onAccessError]);
  return (
    <div>
      {result.url ? (
        <>
          <video controls src={result.url} aria-label="Private rendered video" />
          <p>
            <a href={result.url} download={`shape-video-${asset.id}.mp4`}>
              Download private MP4
            </a>
          </p>
        </>
      ) : (
        <p role="status">{result.error || "Loading private rendered video…"}</p>
      )}
    </div>
  );
}
