"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Mic, Square } from "lucide-react";
import { LanguageSchema, type Language } from "@/lib/contracts/api";
import {
  CreativeActionSchema,
  ProductionDraftSchema,
  applyLocalCreativeAction,
  buildProductionDraftSave,
  describeCreativeAction,
  parseCreativeAction,
  productionDraftFromPrompt,
  productionDraftPrompt,
  type CreativeAction,
  type ProductionDraft,
} from "@/lib/contracts/creative-actions";
import {
  CreativeDraftResultSchema,
  type CreativeDraftSnapshot,
  type SaveCreativeDraft,
} from "@/lib/contracts/shape";
import {
  BrainstormSessionSchema,
  BrainstormSessionDetailSchema,
  BrainstormMessageSchema,
  type SendBrainstormMessageSchema,
} from "@/lib/contracts/brainstorm-studio";
import { StudioAssetListSchema, StudioProjectDetailSchema } from "@/lib/contracts/workspace";
import { XRTranscriptionSchema } from "@/lib/contracts/xr-assistant";
import { CreationAccessError, creationRequest } from "@/features/creation/creation-http";
import { VoiceCapture, browserVoiceDependencies } from "@/xr/assistant/voice-capture";
import { useWorkspaceSession } from "./WorkspaceSession";
import { Dialog } from "./WorkspaceUI";
import styles from "./platform.module.css";

type Proposal = { action: CreativeAction; source: string };
type CaptionAttempt = {
  sessionId: string;
  source: string;
  input: z.infer<typeof SendBrainstormMessageSchema>;
};
type DraftSave = { snapshot: CreativeDraftSnapshot; input: SaveCreativeDraft };
const emptyDraft: ProductionDraft = { text: "", durationSeconds: null };
const SessionResultSchema = z.strictObject({ session: BrainstormSessionSchema });
const MessageResultSchema = z.strictObject({
  session: BrainstormSessionSchema,
  message: BrainstormMessageSchema,
});
/** The private scope is discarded on project or Clerk session changes. */
export default function CreationVoice({ projectId }: { projectId?: string }) {
  const { sessionKey } = useWorkspaceSession();
  return <VoiceSession key={`${sessionKey}:${projectId ?? "local"}`} projectId={projectId} />;
}
function VoiceSession({ projectId }: { projectId?: string }) {
  const session = useWorkspaceSession();
  const router = useRouter();
  const [draft, setDraft] = useState<ProductionDraft>(emptyDraft),
    [transcript, setTranscript] = useState(""),
    [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false),
    [voice, setVoice] = useState<"idle" | "permission" | "recording" | "transcribing">("idle");
  const [consent, setConsent] = useState(false),
    [language, setLanguage] = useState<Language>("en-IN"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [caption, setCaption] = useState(""),
    [captionAttempt, setCaptionAttempt] = useState<CaptionAttempt | null>(null),
    [pendingSave, setPendingSave] = useState<DraftSave | null>(null),
    [review, setReview] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<{
    draft: ProductionDraft;
    revision: number;
  } | null>(null);
  const [saved, setSaved] = useState<{ fingerprint: string; revision: number } | null>(null),
    [createKey] = useState(() => crypto.randomUUID());
  const sessionId = useRef<string | null>(null),
    capture = useRef<VoiceCapture | null>(null),
    controllers = useRef(new Set<AbortController>()),
    alive = useRef(true),
    epoch = useRef(0);
  useLayoutEffect(() => {
    alive.current = true;
    const requests = controllers.current;
    return () => {
      alive.current = false;
      requests.forEach((c) => c.abort());
      capture.current?.cancel();
    };
  }, []);
  const blocked = busy || voice !== "idle";
  const persisted = saved?.fingerprint === productionDraftPrompt(draft);
  const dirty = saved ? !persisted : Boolean(draft.text || draft.durationSeconds !== null);
  useLayoutEffect(() => {
    let approved = false;
    const confirmLeave = () => {
      if (!dirty) return true;
      if (!window.confirm("Your production notes are unsaved. Leave this screen and discard them?"))
        return false;
      approved = true;
      queueMicrotask(() => {
        approved = false;
      });
      return true;
    };
    const planned = (event: Event) => {
      if (!confirmLeave()) event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      // Full-document destinations are protected by the browser's beforeunload
      // confirmation, which also runs after asynchronous navigation checks.
      if (
        url.origin !== window.location.origin ||
        url.pathname === "/spatial-studio" ||
        /^\/workspace\/[a-f0-9-]{36}$/.test(url.pathname)
      )
        return;
      if (
        url.href === window.location.href ||
        (url.pathname === window.location.pathname && url.search === window.location.search)
      )
        return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty && !approved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("shape-before-navigate", planned);
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("shape-before-navigate", planned);
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty]);
  function navigate(path: string, spatial = false) {
    if (spatial) {
      window.location.assign(new URL(path, window.location.origin).href);
      return;
    }
    if (!window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true }))) return;
    router.push(path);
  }

  function report(cause: unknown) {
    if (!alive.current || (cause instanceof DOMException && cause.name === "AbortError")) return;
    setError(
      cause instanceof Error
        ? cause.message
        : "The action could not be confirmed. Your local production notes are kept.",
    );
  }
  function requireProject() {
    const id = z.uuid().safeParse(projectId);
    if (!id.success)
      throw new Error(
        "Choose an editable project before using this action. Local production notes remain available.",
      );
    if (!session.configured || !session.isLoaded || session.sessionKey === "signed-out")
      throw new Error(
        "Sign in to a connected workspace to use this action. You can keep drafting locally.",
      );
    return id.data;
  }
  function revoke() {
    epoch.current++;
    controllers.current.forEach((c) => c.abort());
    capture.current?.cancel();
    sessionId.current = null;
    setDraft(emptyDraft);
    setSaved(null);
    setTranscript("");
    setCaption("");
    setCaptionAttempt(null);
    setProposal(null);
    setPendingSave(null);
    setPendingLoad(null);
    setReview(false);
    setNotice("");
  }
  function lostAccess() {
    revoke();
    return new CreationAccessError(403);
  }
  async function request<T>(
    url: string,
    schema: z.ZodType<T>,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController(),
      scope = epoch.current;
    controllers.current.add(controller);
    try {
      const result = await creationRequest(url, schema, options, controller.signal);
      if (!alive.current || scope !== epoch.current || controller.signal.aborted)
        throw new DOMException("Cancelled", "AbortError");
      return result;
    } catch (cause) {
      if (cause instanceof CreationAccessError && alive.current) {
        revoke();
      }
      throw cause;
    } finally {
      controllers.current.delete(controller);
    }
  }
  const json = (body: unknown, method = "POST"): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  async function authorizedProject() {
    const id = requireProject();
    const result = await request(`/api/v1/workspace/projects/${id}`, StudioProjectDetailSchema);
    if (result.project.id !== id || !result.canEdit || !result.project.canEdit) throw lostAccess();
    return id;
  }
  async function ensureSession() {
    const project = requireProject();
    if (sessionId.current) {
      const detail = await request(
        `/api/v1/brainstorm/sessions/${sessionId.current}`,
        BrainstormSessionDetailSchema,
      );
      if (detail.session.projectId !== project)
        throw new Error(
          "The voice session project changed. Reopen your creation project before recording again.",
        );
      return detail.session;
    }
    const result = await request(
      "/api/v1/brainstorm/sessions",
      SessionResultSchema,
      json({ idempotencyKey: createKey, title: "Creation production notes", projectId: project }),
    );
    if (result.session.projectId !== project)
      throw new Error("The saved voice session did not match this project.");
    sessionId.current = result.session.id;
    return result.session;
  }
  function propose() {
    setError("");
    setNotice("");
    const action = parseCreativeAction(transcript);
    if (!action) {
      setProposal(null);
      setError(
        "Use one supported phrase. Unknown or combined commands are not applied. You can edit the transcript or production notes directly.",
      );
      return;
    }
    setProposal({ action, source: transcript.trim() });
  }
  async function commitSave(save: DraftSave) {
    const id = requireProject();
    if (save.snapshot.projectId !== id)
      throw new Error("The saved draft belongs to a different project.");
    const result = await request(
      `/api/v1/projects/${id}/creative-draft`,
      CreativeDraftResultSchema,
      json(save.input, "PUT"),
    );
    if (result.draft.projectId !== id || !result.draft.canEdit) throw lostAccess();
    if (
      result.draft.revision !== save.snapshot.revision + 1 ||
      result.draft.document.prompts.video !== save.input.document.prompts.video
    )
      throw new Error(
        "The save did not match this production draft. Reload the saved draft before retrying.",
      );
    setSaved({ fingerprint: productionDraftPrompt(draft), revision: result.draft.revision });
    setPendingSave(null);
    setProposal(null);
    setNotice(
      `Production notes saved to your private video prompt at revision ${result.draft.revision}. The duration is a planning target.`,
    );
  }
  async function saveDraft() {
    const id = requireProject();
    const result = await request(
      `/api/v1/projects/${id}/creative-draft`,
      CreativeDraftResultSchema,
    );
    if (result.draft.projectId !== id || !result.draft.canEdit) throw lostAccess();
    const save = { snapshot: result.draft, input: buildProductionDraftSave(result.draft, draft) };
    if (
      result.draft.document.prompts.video &&
      result.draft.document.prompts.video !== save.input.document.prompts.video
    ) {
      setPendingSave(save);
      return;
    }
    await commitSave(save);
  }
  async function loadDraft() {
    if (blocked) return;
    setBusy(true);
    setError("");
    try {
      const id = requireProject();
      const result = await request(
        `/api/v1/projects/${id}/creative-draft`,
        CreativeDraftResultSchema,
      );
      if (result.draft.projectId !== id || !result.draft.canEdit) throw lostAccess();
      if (result.draft.revision === 0) {
        setNotice("No saved video draft exists yet. Your local production notes are kept.");
        return;
      }
      const parsed = productionDraftFromPrompt(result.draft.document.prompts.video);
      if (
        (draft.text || draft.durationSeconds !== null) &&
        productionDraftPrompt(draft) !== productionDraftPrompt(parsed)
      ) {
        setPendingLoad({ draft: parsed, revision: result.draft.revision });
        return;
      }
      setDraft(parsed);
      setSaved({ fingerprint: productionDraftPrompt(parsed), revision: result.draft.revision });
      setProposal(null);
      setNotice(
        `Loaded private video prompt revision ${result.draft.revision}. Other creative modes are unchanged.`,
      );
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function generateCaption() {
    if (!draft.text.trim()) throw new Error("Add production notes before generating a caption.");
    const message = `Write one concise caption draft using these production planning notes. Keep verified facts and constraints from the linked saved brief; ask about missing facts. Put the proposed caption in your reply. Notes:\n${productionDraftPrompt(draft)}`;
    if (message.length > 2000)
      throw new Error(
        "Shorten production notes to 1,600 characters before generating a caption. Your longer local draft is kept.",
      );
    const current = await ensureSession();
    const attempt =
      captionAttempt?.source === productionDraftPrompt(draft) &&
      captionAttempt.sessionId === current.id
        ? captionAttempt
        : {
            sessionId: current.id,
            source: productionDraftPrompt(draft),
            input: {
              idempotencyKey: crypto.randomUUID(),
              expectedRevision: current.revision,
              message,
            },
          };
    setCaptionAttempt(attempt);
    const result = await request(
      `/api/v1/brainstorm/sessions/${current.id}/messages`,
      MessageResultSchema,
      json(attempt.input),
    );
    if (
      result.session.id !== current.id ||
      result.session.projectId !== requireProject() ||
      result.message.id !== attempt.input.idempotencyKey ||
      result.message.sessionId !== current.id
    )
      throw new Error("The caption response did not match this private attempt.");
    if (result.message.status !== "completed" || !result.message.content)
      throw new Error(
        "This saved AI attempt is pending or uncertain. Check its saved status before choosing a new billed attempt.",
      );
    setCaption(result.message.content.reply);
    setProposal(null);
    setNotice(
      "Gemini suggestion received. Review it before using it in your local production draft.",
    );
  }
  async function checkCaption() {
    if (!captionAttempt || blocked) return;
    setBusy(true);
    setError("");
    try {
      const detail = await request(
        `/api/v1/brainstorm/sessions/${captionAttempt.sessionId}`,
        BrainstormSessionDetailSchema,
      );
      if (detail.session.projectId !== requireProject())
        throw new Error("This caption belongs to another project.");
      const message = detail.messages.find((row) => row.id === captionAttempt.input.idempotencyKey);
      if (message?.status === "completed" && message.content) {
        setCaption(message.content.reply);
        setNotice("Confirmed saved Gemini suggestion. Review it before use.");
      } else
        throw new Error(
          "No completed caption response was confirmed. The existing attempt will not be sent again automatically.",
        );
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function apply() {
    if (blocked || !proposal) return;
    setError("");
    setNotice("");
    try {
      if (proposal.source !== transcript.trim())
        throw new Error("The transcript changed. Propose and review this action again.");
      const action = CreativeActionSchema.parse(proposal.action);
      if (action.type === "ADD_TEXT" || action.type === "CHANGE_DURATION") {
        setDraft(applyLocalCreativeAction(draft, action));
        setProposal(null);
        setNotice("Production draft updated locally. Save explicitly to persist your notes.");
        return;
      }
      setBusy(true);
      switch (action.type) {
        case "OPEN_ASSET": {
          const id = requireProject();
          const result = await request(
            `/api/v1/workspace/assets?projectId=${id}&search=${action.assetId}&limit=100`,
            StudioAssetListSchema,
          );
          const asset = result.assets.find(
            (a) => a.id === action.assetId && a.projectId === id && a.canEdit,
          );
          if (!asset)
            throw new Error(
              "That asset is not available in the selected editable project. Choose it from the authorized asset library.",
            );
          navigate(`/app/projects/${id}/assets/${asset.id}`);
          break;
        }
        case "CREATE_SCENE": {
          const id = await authorizedProject();
          // Spatial Studio is owned by the separate R3F application and needs full navigation.
          navigate(`/workspace/${id}`, true);
          break;
        }
        case "OPEN_STORYBOARD": {
          const id = await authorizedProject();
          navigate(`/projects/${id}?tab=storyboard`);
          break;
        }
        case "GENERATE_CAPTION":
          await generateCaption();
          break;
        case "SAVE_DRAFT":
          await saveDraft();
          break;
        case "SUBMIT_FOR_REVIEW":
          await authorizedProject();
          setReview(true);
          break;
      }
    } catch (cause) {
      report(cause);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  async function record() {
    if (blocked) return;
    if (!consent) {
      setError("Confirm the speech disclosure before recording.");
      return;
    }
    setError("");
    setVoice("permission");
    const owner = new VoiceCapture(browserVoiceDependencies(), () => {
      if (alive.current) setVoice("recording");
    });
    capture.current = owner;
    try {
      const current = await ensureSession();
      const blob = await owner.start();
      if (!alive.current) return;
      setVoice("transcribing");
      const result = await request(
        `/api/v1/brainstorm/sessions/${current.id}/transcribe`,
        XRTranscriptionSchema,
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
      setTranscript(result.text);
      setProposal(null);
      setNotice(
        "Sarvam transcript received. Edit it and choose Propose action; nothing has been applied.",
      );
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "NotAllowedError")
        report(
          new Error(
            "Microphone permission was denied. You can type a command or enable permission and try again.",
          ),
        );
      else report(cause);
    } finally {
      owner.cancel();
      if (capture.current === owner) capture.current = null;
      if (alive.current) setVoice("idle");
    }
  }
  return (
    <section className={styles.card} aria-labelledby="creation-voice-title">
      <h2 id="creation-voice-title">Production draft &amp; voice actions</h2>
      <p className={styles.muted}>
        Keep production notes here. Voice produces an editable transcript and one reviewed action;
        it never edits media or shares content automatically.
      </p>
      <label className={styles.field}>
        Production notes
        <textarea
          aria-label="Production notes"
          rows={4}
          maxLength={1800}
          value={draft.text}
          disabled={blocked || !!pendingSave}
          onChange={(e) => {
            setDraft((d) => ({ ...d, text: e.target.value }));
            setProposal(null);
          }}
        />
      </label>
      <div className={styles.toolbar}>
        <label className={styles.field}>
          Planning duration target (seconds)
          <input
            aria-label="Planning duration target (seconds)"
            type="number"
            min={1}
            max={60}
            value={draft.durationSeconds ?? ""}
            disabled={blocked || !!pendingSave}
            onChange={(e) => {
              const parsed = ProductionDraftSchema.safeParse({
                ...draft,
                durationSeconds: e.target.value ? Number(e.target.value) : null,
              });
              if (parsed.success) {
                setDraft(parsed.data);
                setProposal(null);
                setError("");
              } else
                setError(
                  "Use a planning target from 1 to 60 whole seconds. Media timing is unchanged.",
                );
            }}
          />
        </label>
        <span className={styles.badge}>
          {persisted
            ? `Saved private video draft · revision ${saved?.revision}`
            : "Unsaved production draft"}
        </span>
        <button className={styles.secondary} disabled={blocked} onClick={() => void loadDraft()}>
          Load saved video draft
        </button>
      </div>
      <p className={styles.muted}>
        The duration is a planning target. Saving writes the private video prompt; image, audio and
        3D prompts are preserved. No browser storage is used.
      </p>
      <label className={styles.field}>
        Creation command
        <textarea
          aria-label="Creation command"
          rows={2}
          maxLength={2000}
          disabled={blocked || !!pendingSave}
          value={transcript}
          placeholder="Add text: A warm product launch"
          onChange={(e) => {
            setTranscript(e.target.value);
            setProposal(null);
          }}
        />
      </label>
      <div className={styles.actions}>
        <button
          className={styles.secondary}
          disabled={busy || voice === "transcribing"}
          aria-label={
            voice === "recording"
              ? "Stop creation recording"
              : voice === "permission"
                ? "Cancel creation microphone request"
                : "Record creation command"
          }
          onClick={() => {
            if (voice === "recording") capture.current?.stop();
            else if (voice === "permission") capture.current?.cancel();
            else void record();
          }}
        >
          {voice === "recording" ? <Square size={16} /> : <Mic size={16} />}{" "}
          {voice === "recording"
            ? "Stop recording"
            : voice === "permission"
              ? "Cancel microphone request"
              : voice === "transcribing"
                ? "Transcribing…"
                : "Record command"}
        </button>
        <button
          className={styles.button}
          disabled={blocked || !transcript.trim() || !!pendingSave}
          onClick={propose}
        >
          Propose action
        </button>
        <label className={styles.field}>
          Speech language
          <select
            aria-label="Creation speech language"
            value={language}
            disabled={blocked}
            onChange={(e) => setLanguage(LanguageSchema.parse(e.target.value))}
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="kn-IN">Kannada</option>
          </select>
        </label>
      </div>
      <label className={styles.muted}>
        <input
          type="checkbox"
          checked={consent}
          disabled={blocked}
          onChange={(e) => setConsent(e.target.checked)}
        />{" "}
        I agree to send a short recording to Sarvam for transcription. Audio is not saved. Recording
        creates a private project-linked session when needed.
      </label>
      <details>
        <summary>Supported phrases</summary>
        <ul>
          <li>Open asset UUID — verifies the selected project&apos;s authorized assets.</li>
          <li>Create scene — opens the project Spatial Studio.</li>
          <li>Open the storyboard — opens the project&apos;s saved text storyboard panel.</li>
          <li>Add text: your production notes</li>
          <li>Change duration to 15 seconds — planning only, 1–60 seconds.</li>
          <li>
            Generate caption — asks configured Gemini using these notes and the linked saved brief.
          </li>
          <li>Save draft — saves your private video prompt after a revision check.</li>
          <li>Submit for review — confirms opening the published-version review workflow.</li>
        </ul>
      </details>
      {proposal && (
        <div className={styles.notice} role="region" aria-label="Proposed creation action">
          <div>
            <h3>Review proposed action</h3>
            <p>{describeCreativeAction(proposal.action)}</p>
            <button
              className={styles.button}
              disabled={blocked || !!pendingSave}
              onClick={() => void apply()}
            >
              Apply proposed action
            </button>
          </div>
        </div>
      )}
      {caption && (
        <div className={styles.card} aria-label="AI caption suggestion">
          <h3>AI caption suggestion</h3>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{caption}</p>
          <p className={styles.muted}>
            Provider-confirmed Gemini text. Check facts, tone and rights before use. It has not
            replaced your production notes.
          </p>
          <button
            className={styles.secondary}
            disabled={blocked || caption.length > 1800}
            onClick={() => {
              setDraft((d) => ({ ...d, text: caption }));
              setProposal(null);
              setNotice("Caption copied into your unsaved local production draft.");
            }}
          >
            Use caption in local draft
          </button>
          {caption.length > 1800 && (
            <p className={styles.muted}>
              This suggestion exceeds the note limit. Copy and edit a shorter passage manually.
            </p>
          )}
        </div>
      )}
      {captionAttempt && (
        <div className={styles.actions}>
          <button
            className={styles.secondary}
            disabled={blocked}
            onClick={() => void checkCaption()}
          >
            Check saved AI attempt
          </button>
          <button
            className={styles.secondary}
            disabled={blocked}
            onClick={() => {
              setCaptionAttempt(null);
              setProposal(null);
              setNotice(
                "A new caption attempt is enabled. Propose Generate caption again; applying it makes a new provider request and may incur another charge.",
              );
            }}
          >
            Enable new caption attempt
          </button>
        </div>
      )}
      {busy && <p role="status">Checking the selected project action…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Dialog
        open={!!pendingSave}
        title="Replace saved video prompt?"
        onClose={() => setPendingSave(null)}
      >
        <p>
          Your saved video prompt contains different text. Review this replacement before saving;
          other creative prompts are preserved.
        </p>
        <h3>Saved video prompt</h3>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {pendingSave?.snapshot.document.prompts.video}
        </p>
        <h3>Proposed video prompt</h3>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {pendingSave?.input.document.prompts.video}
        </p>
        <div className={styles.actions}>
          <button className={styles.secondary} disabled={busy} onClick={() => setPendingSave(null)}>
            Keep saved prompt
          </button>
          <button
            className={styles.button}
            disabled={busy}
            onClick={async () => {
              if (!pendingSave || busy) return;
              setBusy(true);
              setError("");
              try {
                await commitSave(pendingSave);
              } catch (cause) {
                report(cause);
                setPendingSave(null);
              } finally {
                if (alive.current) setBusy(false);
              }
            }}
          >
            Confirm draft replacement
          </button>
        </div>
      </Dialog>
      <Dialog
        open={!!pendingLoad}
        title="Replace local production notes?"
        onClose={() => setPendingLoad(null)}
      >
        <p>
          Your local production notes differ from the saved video draft. Loading it replaces the
          local notes and planning target.
        </p>
        <h3>Local production notes</h3>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {productionDraftPrompt(draft)}
        </p>
        <h3>Saved video draft</h3>
        <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {pendingLoad ? productionDraftPrompt(pendingLoad.draft) : ""}
        </p>
        <div className={styles.actions}>
          <button className={styles.secondary} onClick={() => setPendingLoad(null)}>
            Keep local notes
          </button>
          <button
            className={styles.button}
            onClick={() => {
              if (!pendingLoad) return;
              setDraft(pendingLoad.draft);
              setSaved({
                fingerprint: productionDraftPrompt(pendingLoad.draft),
                revision: pendingLoad.revision,
              });
              setPendingLoad(null);
              setProposal(null);
              setNotice(`Loaded private video prompt revision ${pendingLoad.revision}.`);
            }}
          >
            Confirm loading saved draft
          </button>
        </div>
      </Dialog>
      <Dialog
        open={review}
        title="Open review submission workflow?"
        onClose={() => setReview(false)}
      >
        <p>
          Continue to Deliverables to select an actual published version, enter a verified reviewer,
          and explicitly share it for review. Nothing is submitted by this navigation.
        </p>
        <div className={styles.actions}>
          <button className={styles.secondary} disabled={busy} onClick={() => setReview(false)}>
            Cancel
          </button>
          <button
            className={styles.button}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const id = await authorizedProject();
                navigate(`/projects/${id}?tab=deliverables`);
              } catch (cause) {
                report(cause);
                setReview(false);
              } finally {
                if (alive.current) setBusy(false);
              }
            }}
          >
            Open Deliverables for review
          </button>
        </div>
      </Dialog>
    </section>
  );
}
