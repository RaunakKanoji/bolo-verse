"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brain, ChevronRight, Lightbulb, Mic, Pin, Plus, Send, Square } from "lucide-react";
import { z } from "zod";
import { apiResultSchema, LanguageSchema, type Language } from "@/lib/contracts/api";
import {
  BrainstormDetailResponseSchema,
  BrainstormIdeaResponseSchema,
  BrainstormMessageResponseSchema,
  BrainstormSessionResponseSchema,
  BrainstormSessionsResponseSchema,
  SaveBrainstormIdeaSchema,
  type BrainstormConceptSchema,
  type BrainstormIdea,
  type BrainstormSession,
  type BrainstormSessionDetail,
} from "@/lib/contracts/brainstorm-studio";
import { XRTranscriptionSchema } from "@/lib/contracts/xr-assistant";
import { useWorkspaceSession } from "@/features/platform/WorkspaceSession";
import { PageHeader, ServiceNotice, StatusBadge } from "@/features/platform/WorkspaceUI";
import { browserVoiceDependencies, VoiceCapture } from "@/xr/assistant/voice-capture";
import styles from "./brainstorm-studio.module.css";
import { brainstormTemplates, buildTemplatePrompt } from "@/lib/contracts/brainstorm-templates";
type StudioSession = BrainstormSessionDetail & {
  persisted: boolean;
  draft: string;
  localIdeas: BrainstormIdea[];
};
type Summary = BrainstormSession & { persisted: boolean };
type IdeaInput = {
  title: string;
  description: string;
  category: BrainstormIdea["category"];
  tags: string;
  sourceMessageId?: string;
};
const emptyIdea: IdeaInput = { title: "", description: "", category: "idea", tags: "" };
function localSession(projectId: string | null): StudioSession {
  const now = new Date().toISOString();
  return {
    session: {
      id: crypto.randomUUID(),
      title: "Untitled session",
      projectId,
      pinned: false,
      revision: 0,
      createdAt: now,
      updatedAt: now,
    },
    messages: [],
    ideas: [],
    persisted: false,
    draft: "",
    localIdeas: [],
  };
}
function conceptDescription(c: z.infer<typeof BrainstormConceptSchema>) {
  return `Audience: ${c.targetAudience}\nCore message: ${c.coreMessage}\nFormat: ${c.contentFormat}\nCreative direction: ${c.creativeDirection}\nProduction: ${c.productionRequirements.join("; ")}\nNext steps: ${c.nextSteps.join("; ")}`;
}
class AccessLost extends Error {}
export default function BrainstormStudio({
  initialProject = null,
  initialSession = null,
}: {
  initialProject?: string | null;
  initialSession?: string | null;
}) {
  const { sessionKey, isLoaded } = useWorkspaceSession();
  return (
    <Studio
      key={`${sessionKey}:${initialSession ?? "new"}:${initialProject ?? "standalone"}`}
      loaded={isLoaded}
      initialProject={initialProject}
      initialSession={initialSession}
    />
  );
}
function Studio({
  loaded,
  initialProject,
  initialSession,
}: {
  loaded: boolean;
  initialProject: string | null;
  initialSession: string | null;
}) {
  const [active, setActive] = useState<StudioSession>(() => localSession(initialProject));
  const [locals, setLocals] = useState<StudioSession[]>([]);
  const [saved, setSaved] = useState<BrainstormSession[]>([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(Boolean(initialSession));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [ideaForm, setIdeaForm] = useState<IdeaInput>(emptyIdea);
  const [language, setLanguage] = useState<Language>("en-IN");
  const [consent, setConsent] = useState(false);
  const [voice, setVoice] = useState<"idle" | "permission" | "recording" | "transcribing">("idle");
  const [projectLink, setProjectLink] = useState(initialProject ?? "");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [conversion, setConversion] = useState<{
    ideaId: string;
    key: string;
    projectId?: string;
  } | null>(null);
  const pending = useRef(new Set<AbortController>());
  const capture = useRef<VoiceCapture | null>(null);
  const mounted = useRef(true);
  const accessEpoch = useRef(0);
  const [sendRetry, setSendRetry] = useState<{
    sessionId: string;
    input: { idempotencyKey: string; expectedRevision: number; message: string };
  } | null>(null);
  useEffect(() => {
    mounted.current = true;
    const requests = pending.current;
    return () => {
      mounted.current = false;
      requests.forEach((c) => c.abort());
      capture.current?.cancel();
    };
  }, []);
  async function request<T extends z.ZodType>(
    url: string,
    schema: T,
    init: RequestInit = {},
  ): Promise<z.infer<T>> {
    const epoch = accessEpoch.current;
    const controller = new AbortController();
    pending.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
      const value = schema.safeParse(await response.json());
      if (!mounted.current || controller.signal.aborted || epoch !== accessEpoch.current)
        throw new DOMException("Cancelled", "AbortError");
      if (response.status === 401 || response.status === 403) {
        accessEpoch.current++;
        pending.current.forEach((other) => {
          if (other !== controller) other.abort();
        });
        capture.current?.cancel();
        setProjects([]);
        setProjectLink("");
        setNotice("");
        setConversion(null);
        setConsent(false);
        setSaved([]);
        setLocals([]);
        setActive(localSession(null));
        setIdeaForm(emptyIdea);
        setSendRetry(null);
        throw new AccessLost(
          "Sign in with an account that can edit this private session. Private content has been cleared.",
        );
      }
      if (!value.success)
        throw new Error("Could not confirm the workspace response. Your local draft is kept.");
      const envelope = value.data as { ok: boolean; error?: { message: string } };
      if (!response.ok || !envelope.ok)
        throw new Error(
          envelope.error?.message ?? "Your workspace is unavailable. Your local draft is kept.",
        );
      return value.data;
    } finally {
      clearTimeout(timeout);
      pending.current.delete(controller);
    }
  }
  function report(cause: unknown) {
    if (!mounted.current || (cause instanceof DOMException && cause.name === "AbortError")) return;
    setError(
      cause instanceof Error
        ? cause.message
        : "The workspace could not confirm this action. Your local draft is kept.",
    );
  }
  const json = (body: unknown, method = "POST"): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    void request("/api/v1/brainstorm/sessions", BrainstormSessionsResponseSchema)
      .then((result) => {
        if (!cancelled && result.ok) setSaved(result.data.sessions);
      })
      .catch((cause) => {
        if (!cancelled && !(cause instanceof AccessLost))
          setNotice(
            "Workspace connection unavailable. Sessions, drafts and ideas marked Unsaved stay only in this tab.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    if (initialSession) {
      void request(`/api/v1/brainstorm/sessions/${initialSession}`, BrainstormDetailResponseSchema)
        .then((result) => {
          if (!cancelled && result.ok) {
            install({ ...result.data, persisted: true, draft: "", localIdeas: [] });
            setProjectLink(result.data.session.projectId ?? "");
          }
        })
        .catch((cause) => {
          if (!cancelled) report(cause);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }
    const projectSchema = apiResultSchema(
      z
        .object({ projects: z.array(z.object({ id: z.uuid(), name: z.string() }).passthrough()) })
        .passthrough(),
    );
    void request("/api/v1/workspace/projects", projectSchema)
      .then((result) => {
        if (!cancelled && result.ok) setProjects(result.data.projects);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // The session boundary remounts this component and aborts every request.
  }, [loaded, initialSession]);
  function install(next: StudioSession) {
    setActive(next);
    if (next.persisted)
      setSaved((rows) => [next.session, ...rows.filter((r) => r.id !== next.session.id)]);
    setLocals((rows) => rows.filter((r) => r.session.id !== next.session.id));
  }
  function remember() {
    const current = active;
    setLocals((rows) => [current, ...rows.filter((r) => r.session.id !== current.session.id)]);
  }
  function selectLocal(next: StudioSession) {
    if (busy || voice !== "idle") return;
    remember();
    setActive(next);
    setProjectLink(next.session.projectId ?? "");
    setIdeaForm(emptyIdea);
    setError("");
    setSendRetry(null);
  }
  async function selectSaved(summary: BrainstormSession) {
    if (busy || voice !== "idle") return;
    const local = locals.find((r) => r.session.id === summary.id);
    if (local) {
      selectLocal(local);
      return;
    }
    remember();
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/api/v1/brainstorm/sessions/${summary.id}`,
        BrainstormDetailResponseSchema,
      );
      if (result.ok) {
        install({ ...result.data, persisted: true, draft: "", localIdeas: [] });
        setProjectLink(result.data.session.projectId ?? "");
        setIdeaForm(emptyIdea);
        setSendRetry(null);
      }
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function persist(current = active) {
    if (current.persisted) return current;
    const result = await request(
      "/api/v1/brainstorm/sessions",
      BrainstormSessionResponseSchema,
      json({
        idempotencyKey: current.session.id,
        title: current.session.title,
        ...(current.session.projectId ? { projectId: current.session.projectId } : {}),
      }),
    );
    if (!result.ok) throw new Error("Session was not saved.");
    const next = { ...current, session: result.data.session, persisted: true };
    install(next);
    return next;
  }
  async function saveSession() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await persist();
      setNotice("Session saved. Ideas marked Unsaved remain local until you save each card.");
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function mutate(fields: { pinned?: boolean; title?: string; projectId?: string | null }) {
    if (busy) return;
    setError("");
    if (!active.persisted) {
      setActive((current) => ({ ...current, session: { ...current.session, ...fields } }));
      return;
    }
    setBusy(true);
    try {
      const result = await request(
        `/api/v1/brainstorm/sessions/${active.session.id}`,
        BrainstormSessionResponseSchema,
        json(
          {
            idempotencyKey: crypto.randomUUID(),
            expectedRevision: active.session.revision,
            ...fields,
          },
          "PATCH",
        ),
      );
      if (result.ok) install({ ...active, session: result.data.session });
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function reload() {
    if (!active.persisted) return;
    setBusy(true);
    try {
      const current = active;
      const result = await request(
        `/api/v1/brainstorm/sessions/${current.session.id}`,
        BrainstormDetailResponseSchema,
      );
      if (result.ok) install({ ...current, ...result.data });
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function send() {
    if (busy || voice !== "idle" || !active.draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      const current = await persist();
      const previous = sendRetry;
      const input =
        previous &&
        previous.sessionId === current.session.id &&
        previous.input.message === current.draft.trim()
          ? previous.input
          : {
              idempotencyKey: crypto.randomUUID(),
              expectedRevision: current.session.revision,
              message: current.draft.trim(),
            };
      setSendRetry({ sessionId: current.session.id, input });
      const result = await request(
        `/api/v1/brainstorm/sessions/${current.session.id}/messages`,
        BrainstormMessageResponseSchema,
        json(input),
      );
      if (result.ok) {
        const m = result.data.message;
        install({
          ...current,
          session: result.data.session,
          messages: [...current.messages.filter((row) => row.id !== m.id), m],
          draft: m.status === "completed" ? "" : current.draft,
        });
        if (m.status === "completed") {
          setSendRetry(null);
          setNotice(
            "AI-generated suggestions saved. Review facts and production needs before using them.",
          );
        } else
          setError(
            m.status === "pending"
              ? "This saved attempt is pending. Reload to check; it will not be automatically repeated."
              : "This attempt is uncertain and will not be sent again. Reload saved content, then choose New AI attempt if you want another billed request.",
          );
      }
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function saveConcept(concept: z.infer<typeof BrainstormConceptSchema>, sourceMessageId: string) {
    const draft: IdeaInput = {
      title: concept.title,
      description: conceptDescription(concept),
      category: "concept",
      tags: concept.contentFormat.slice(0, 40),
      sourceMessageId,
    };
    if (draft.description.length > 4000) {
      setIdeaForm(draft);
      setError(
        "This concept is longer than an idea card. Shorten the idea description to 4,000 characters, then save it.",
      );
      return;
    }
    void saveIdea(draft);
  }
  async function saveIdea(input: IdeaInput, localId?: string) {
    if (busy) return;
    const parsed = SaveBrainstormIdeaSchema.safeParse({
      idempotencyKey: localId ?? crypto.randomUUID(),
      expectedRevision: active.session.revision,
      title: input.title,
      description: input.description,
      tags: input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      category: input.category,
      ...(input.sourceMessageId ? { sourceMessageId: input.sourceMessageId } : {}),
    });
    if (!parsed.success) {
      setError("Enter an idea title and description, with at most eight short tags.");
      return;
    }
    if (!active.persisted) {
      const now = new Date().toISOString();
      const idea: BrainstormIdea = {
        id: parsed.data.idempotencyKey,
        sessionId: active.session.id,
        title: parsed.data.title,
        description: parsed.data.description,
        tags: parsed.data.tags,
        category: parsed.data.category,
        sourceMessageId: parsed.data.sourceMessageId ?? null,
        createdAt: now,
      };
      setActive((current) => ({
        ...current,
        localIdeas: [...current.localIdeas.filter((r) => r.id !== idea.id), idea],
      }));
      setIdeaForm(emptyIdea);
      setNotice(
        "Idea kept in this tab. Save the session, then Save to workspace on this card to persist it.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await request(
        `/api/v1/brainstorm/sessions/${active.session.id}/ideas`,
        BrainstormIdeaResponseSchema,
        json(parsed.data),
      );
      if (result.ok) {
        install({
          ...active,
          session: result.data.session,
          ideas: [...active.ideas.filter((r) => r.id !== result.data.idea.id), result.data.idea],
          localIdeas: active.localIdeas.filter((r) => r.id !== localId),
        });
        setIdeaForm(emptyIdea);
        setNotice("Idea saved to your private session.");
      }
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function convert(idea: BrainstormIdea) {
    if (busy || voice !== "idle") return;
    setBusy(true);
    setError("");
    const attempt = conversion?.ideaId === idea.id ? conversion : { ideaId: idea.id, key: idea.id };
    setConversion(attempt);
    try {
      const current = await persist();
      let projectId = attempt.projectId;
      if (!projectId) {
        const schema = apiResultSchema(
          z.object({ project: z.object({ id: z.uuid() }).passthrough() }),
        );
        const result = await request(
          "/api/v1/workspace/projects",
          schema,
          json({
            idempotencyKey: attempt.key,
            name: idea.title,
            objective: idea.description.slice(0, 2000),
          }),
        );
        if (!result.ok) throw new Error("Project creation could not be confirmed.");
        projectId = result.data.project.id;
        setConversion({ ...attempt, projectId });
      }
      const result = await request(
        `/api/v1/brainstorm/sessions/${current.session.id}`,
        BrainstormSessionResponseSchema,
        json(
          {
            idempotencyKey: crypto.randomUUID(),
            expectedRevision: current.session.revision,
            projectId,
          },
          "PATCH",
        ),
      );
      if (result.ok) {
        install({ ...current, session: result.data.session });
        setProjectLink(projectId);
        setNotice(
          "Project created and linked. Review its brief and production details in Projects.",
        );
        setConversion(null);
      }
    } catch (cause) {
      report(cause);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function record() {
    if (voice !== "idle" || busy) return;
    if (!consent) {
      setError("Confirm the speech disclosure before recording.");
      return;
    }
    setError("");
    setVoice("permission");
    try {
      const recording = new VoiceCapture(browserVoiceDependencies(), () => {
        if (mounted.current) setVoice("recording");
      });
      capture.current = recording;
      const current = await persist();
      if (!mounted.current) return;
      const blob = await recording.start();
      if (!mounted.current) return;
      setVoice("transcribing");
      const result = await request(
        `/api/v1/brainstorm/sessions/${current.session.id}/transcribe`,
        apiResultSchema(XRTranscriptionSchema),
        {
          method: "POST",
          headers: {
            "Content-Type": blob.type,
            "x-speech-language": language,
            "x-speech-consent": "xr-voice-v1",
          },
          body: blob,
        },
      );
      if (result.ok) {
        setActive((s) => ({ ...s, draft: result.data.text }));
        setSendRetry(null);
        setNotice("Sarvam transcript received. Edit the message, then choose Send to Gemini.");
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "NotAllowedError")
        setError(
          "Microphone permission was denied. You can type your message or enable permission and record again.",
        );
      else report(cause);
    } finally {
      capture.current?.cancel();
      capture.current = null;
      if (mounted.current) setVoice("idle");
    }
  }
  const summaries: Summary[] = [
    ...saved.map((s) => ({ ...s, persisted: true })),
    ...locals.filter((l) => !l.persisted).map((l) => ({ ...l.session, persisted: false })),
  ];
  if (!summaries.some((s) => s.id === active.session.id))
    summaries.unshift({ ...active.session, persisted: active.persisted });
  const visible = summaries.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
  function sessionButton(s: Summary) {
    return (
      <button
        key={s.id}
        type="button"
        className={styles.session}
        aria-current={active.session.id === s.id ? "true" : undefined}
        disabled={busy || voice !== "idle"}
        onClick={() => {
          const local =
            s.id === active.session.id ? active : locals.find((l) => l.session.id === s.id);
          if (local) selectLocal(local);
          else void selectSaved(s);
        }}
      >
        <strong>{s.title}</strong>
        <span>
          {s.persisted ? new Date(s.updatedAt).toLocaleDateString() : "Unsaved · local"}
          {s.projectId ? " · Project linked" : ""}
        </span>
      </button>
    );
  }
  const allIdeas = [
    ...active.ideas.map((i) => ({ idea: i, persisted: true })),
    ...active.localIdeas.map((i) => ({ idea: i, persisted: false })),
  ];
  return (
    <div className={styles.page}>
      <PageHeader title="Brainstorm Studio" description="Turn your ideas into creative concepts.">
        <StatusBadge status={active.persisted ? "Saved session" : "Unsaved · local"} />
      </PageHeader>
      {(notice || loading) && (
        <ServiceNotice message={loading ? "Loading your private sessions…" : notice} />
      )}
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Brainstorm sessions">
          <button
            className={styles.primary}
            disabled={busy || voice !== "idle"}
            onClick={() => {
              remember();
              setActive(localSession(projectLink || null));
              setIdeaForm(emptyIdea);
              setError("");
              setSendRetry(null);
            }}
          >
            <Plus size={17} />
            New session
          </button>
          <label htmlFor="session-search">Search sessions</label>
          <input
            id="session-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find an idea…"
          />
          {visible.some((s) => s.pinned) && (
            <>
              <h2>Pinned sessions</h2>
              {visible.filter((s) => s.pinned).map(sessionButton)}
            </>
          )}
          <h2>Recent sessions</h2>
          {visible.filter((s) => !s.pinned).map(sessionButton)}
          {!visible.length && <p className={styles.muted}>No matching sessions.</p>}
          <h2>Project-linked sessions</h2>
          {visible
            .filter((s) => s.projectId)
            .map((s) => (
              <a
                key={s.id}
                href={`#session-${s.id}`}
                className={styles.linked}
                onClick={(e) => {
                  e.preventDefault();
                  const local = locals.find((l) => l.session.id === s.id);
                  if (local) selectLocal(local);
                  else void selectSaved(s);
                }}
              >
                {s.title}
                <ChevronRight size={14} />
              </a>
            ))}
          {!visible.some((s) => s.projectId) && (
            <p className={styles.muted}>Link a project to use its saved brief.</p>
          )}
          <p className={styles.privacy}>
            Private to your account. Local drafts disappear when this tab closes.
          </p>
        </aside>
        <section className={styles.conversation} aria-label="AI conversation">
          <header className={styles.sessionHeader}>
            <Brain size={22} aria-hidden="true" />
            <div>
              <label htmlFor="session-title">Session title</label>
              <input
                id="session-title"
                value={active.session.title}
                maxLength={120}
                disabled={busy}
                onChange={(e) =>
                  setActive((s) => ({ ...s, session: { ...s.session, title: e.target.value } }))
                }
                onBlur={() => {
                  if (
                    active.persisted &&
                    active.session.title.trim() &&
                    saved.find((s) => s.id === active.session.id)?.title !==
                      active.session.title.trim()
                  )
                    void mutate({ title: active.session.title.trim() });
                }}
              />
            </div>
            <button
              className={styles.iconButton}
              aria-label={active.session.pinned ? "Unpin session" : "Pin session"}
              aria-pressed={active.session.pinned}
              disabled={busy}
              onClick={() => void mutate({ pinned: !active.session.pinned })}
            >
              <Pin size={18} />
            </button>
          </header>
          <div className={styles.projectBar}>
            <label htmlFor="brainstorm-project">Project context</label>
            <select
              id="brainstorm-project"
              value={projectLink}
              disabled={busy || voice !== "idle"}
              onChange={(e) => setProjectLink(e.target.value)}
            >
              <option value="">Standalone brainstorm</option>
              {projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
              {projectLink && !projects.some((p) => p.id === projectLink) && (
                <option value={projectLink}>Linked project</option>
              )}
            </select>
            <button
              disabled={busy || voice !== "idle"}
              onClick={() => void mutate({ projectId: projectLink || null })}
            >
              Apply link
            </button>
            {active.session.projectId && (
              <Link href={`/projects/${active.session.projectId}`}>Open project</Link>
            )}
          </div>
          <div className={styles.messages} aria-live="polite">
            {!active.messages.length && (
              <div className={styles.welcome}>
                <span className={styles.spark}>
                  <Lightbulb size={28} />
                </span>
                <h2>Where should we begin?</h2>
                <p>
                  Explore a direction, shape a campaign, or work through your next creative
                  question.
                </p>
                <div className={styles.starters}>
                  {brainstormTemplates.slice(0, 5).map((template) => (
                    <button
                      key={template.id}
                      disabled={busy}
                      onClick={() => {
                        try {
                          const prompt = buildTemplatePrompt(template.id, active.draft);
                          setActive((current) => ({ ...current, draft: prompt }));
                          setSendRetry(null);
                          setError("");
                        } catch (cause) { report(cause); }
                      }}
                    >
                      {template.label}
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {active.messages.map((m) => (
              <div key={m.id} className={styles.turn}>
                <article className={styles.userMessage}>
                  <span>You</span>
                  <p>{m.message}</p>
                </article>
                {m.content && (
                  <article className={styles.aiMessage}>
                    <span>AI-generated suggestion</span>
                    <p>{m.content.reply}</p>
                    {m.content.concepts.map((c, index) => (
                      <div key={index} className={styles.concept}>
                        <h3>{c.title}</h3>
                        <dl>
                          <dt>Target audience</dt>
                          <dd>{c.targetAudience}</dd>
                          <dt>Core message</dt>
                          <dd>{c.coreMessage}</dd>
                          <dt>Content format</dt>
                          <dd>{c.contentFormat}</dd>
                          <dt>Creative direction</dt>
                          <dd>{c.creativeDirection}</dd>
                          <dt>Production requirements</dt>
                          <dd>{c.productionRequirements.join(" · ") || "Review with your team"}</dd>
                          <dt>Suggested next steps</dt>
                          <dd>{c.nextSteps.join(" · ") || "Review and refine"}</dd>
                        </dl>
                        <button disabled={busy} onClick={() => saveConcept(c, m.id)}>
                          Save {c.title} as idea
                        </button>
                      </div>
                    ))}
                  </article>
                )}
                {m.status !== "completed" && (
                  <p className={styles.attempt}>
                    {m.status === "pending"
                      ? "Saved attempt pending. Reload to check its status; it will not be automatically sent again."
                      : "Saved attempt uncertain. No AI response was confirmed. A new attempt may incur another provider charge."}
                  </p>
                )}
              </div>
            ))}
            {busy && <p role="status">Working on your request…</p>}
          </div>
          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <label htmlFor="brainstorm-template">Prompt template</label>
            <select id="brainstorm-template" value="" disabled={busy || voice !== "idle"}
              onChange={(event) => {
                if (!event.target.value) return;
                try {
                  const prompt = buildTemplatePrompt(event.target.value, active.draft);
                  setActive((current) => ({ ...current, draft: prompt }));
                  setSendRetry(null);
                  setNotice("Template added to your editable message. Review the instructions before sending.");
                  setError("");
                } catch (cause) { report(cause); }
              }}>
              <option value="">Add a template to your instructions…</option>
              {brainstormTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
            </select>
            <label htmlFor="brainstorm-message">Brainstorm message</label>
            <textarea
              id="brainstorm-message"
              rows={4}
              maxLength={2000}
              value={active.draft}
              disabled={busy || voice !== "idle"}
              placeholder="Describe what you want to create…"
              onChange={(e) => {
                setActive((current) => ({ ...current, draft: e.target.value }));
                setSendRetry(null);
              }}
            />
            <div className={styles.composerActions}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label={voice === "recording" ? "Stop recording" : "Record voice message"}
                disabled={busy || voice === "transcribing"}
                onClick={() => {
                  if (voice === "recording") capture.current?.stop();
                  else if (voice === "permission") capture.current?.cancel();
                  else void record();
                }}
              >
                {voice === "recording" ? <Square size={18} /> : <Mic size={18} />}
                <span>
                  {voice === "recording"
                    ? "Stop"
                    : voice === "permission"
                      ? "Cancel microphone request"
                      : voice === "transcribing"
                        ? "Transcribing…"
                        : "Voice"}
                </span>
              </button>
              <button
                type="button"
                disabled
                title="File context is available through the linked project brief"
              >
                Attachments unavailable
              </button>
              <button
                className={styles.primary}
                type="submit"
                disabled={busy || voice !== "idle" || !active.draft.trim()}
              >
                <Send size={16} />
                Send to Gemini
              </button>
            </div>
            <div className={styles.voiceOptions}>
              <label>
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={voice !== "idle"}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I agree to send a short recording to Sarvam for transcription. Audio is not saved.
              </label>
              <select
                aria-label="Speech language"
                value={language}
                disabled={voice !== "idle"}
                onChange={(e) => setLanguage(LanguageSchema.parse(e.target.value))}
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="kn-IN">Kannada</option>
              </select>
            </div>
            <p className={styles.muted}>
              Review and edit your transcript before sending. Gemini uses up to eight recent saved ideas, the linked saved brief and
              up to six recent exchanges. Text suggestions never execute scene commands.
            </p>
          </form>
          <div className={styles.sessionActions}>
            <button
              disabled={busy || active.persisted || !active.session.title.trim()}
              onClick={() => void saveSession()}
            >
              Save session
            </button>
            <button disabled={busy || !active.persisted} onClick={() => void reload()}>
              Reload saved content
            </button>
            {sendRetry && (
              <button
                disabled={busy}
                onClick={() => {
                  setSendRetry(null);
                  setNotice(
                    "New attempt selected. Sending will make a new provider request and may incur another charge.",
                  );
                  setError("");
                }}
              >
                New AI attempt
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
        </section>
        <aside className={styles.canvas} aria-label="Creative canvas">
          <div className={styles.canvasTitle}>
            <Lightbulb size={20} />
            <h2>Creative canvas</h2>
          </div>
          <p className={styles.muted}>Collect the ideas worth exploring.</p>
          <form
            className={styles.ideaForm}
            onSubmit={(e) => {
              e.preventDefault();
              void saveIdea(ideaForm);
            }}
          >
            <label htmlFor="idea-title">Idea title</label>
            <input
              id="idea-title"
              value={ideaForm.title}
              maxLength={120}
              onChange={(e) => setIdeaForm((i) => ({ ...i, title: e.target.value }))}
            />
            <label htmlFor="idea-description">Idea description</label>
            <textarea
              id="idea-description"
              rows={3}
              value={ideaForm.description}
              maxLength={4000}
              onChange={(e) => setIdeaForm((i) => ({ ...i, description: e.target.value }))}
            />
            <label htmlFor="idea-category">Category</label>
            <select
              id="idea-category"
              value={ideaForm.category}
              onChange={(e) =>
                setIdeaForm((i) => ({ ...i, category: e.target.value as IdeaInput["category"] }))
              }
            >
              <option value="idea">Saved Ideas</option>
              <option value="concept">Creative Concepts</option>
              <option value="direction">Campaign Direction</option>
              <option value="outline">Content Outline</option>
              <option value="action">Action Items</option>
            </select>
            <label htmlFor="idea-tags">Tags, separated by commas</label>
            <input
              id="idea-tags"
              value={ideaForm.tags}
              maxLength={320}
              onChange={(e) => setIdeaForm((i) => ({ ...i, tags: e.target.value }))}
            />
            <button
              disabled={busy || !ideaForm.title.trim() || !ideaForm.description.trim()}
              type="submit"
            >
              Save idea
            </button>
          </form>
          {(
            [
              ["idea", "Saved Ideas"],
              ["concept", "Creative Concepts"],
              ["direction", "Campaign Direction"],
              ["outline", "Content Outline"],
              ["action", "Action Items"],
            ] as const
          ).map(([category, label]) => (
            <section className={styles.ideaGroup} key={category}>
              <h3>{label}</h3>
              {allIdeas
                .filter((row) => row.idea.category === category)
                .map(({ idea, persisted }) => (
                  <article className={styles.ideaCard} key={idea.id}>
                    <span className={styles.saveStatus}>
                      {persisted ? "Saved to workspace" : "Unsaved · local"}
                    </span>
                    <h4>{idea.title}</h4>
                    <p>{idea.description}</p>
                    {!!idea.tags.length && (
                      <div className={styles.tags}>
                        {idea.tags.map((tag, index) => (
                          <span key={index}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <small>Source: {active.session.title}</small>
                    <div className={styles.cardActions}>
                      {!persisted && active.persisted && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void saveIdea(
                              {
                                title: idea.title,
                                description: idea.description,
                                category: idea.category,
                                tags: idea.tags.join(","),
                                ...(idea.sourceMessageId
                                  ? { sourceMessageId: idea.sourceMessageId }
                                  : {}),
                              },
                              idea.id,
                            )
                          }
                        >
                          Save to workspace
                        </button>
                      )}
                      <button disabled={busy} onClick={() => void convert(idea)}>
                        Convert to project
                      </button>
                    </div>
                  </article>
                ))}
              {!allIdeas.some((row) => row.idea.category === category) && (
                <p className={styles.noIdeas}>No {label.toLowerCase()} yet.</p>
              )}
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}
