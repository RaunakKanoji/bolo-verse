"use client";

import { Mic, Send, Square, Volume2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import type { Language } from "@/lib/contracts";
import { XRCommandSchema, type XRCommand } from "@/lib/contracts/xr-assistant";
import { useAssistantClient } from "./use-assistant-client";
import styles from "./assistant.module.css";

type Props = {
  projectId: string;
  disabled?: boolean;
  contextKey?: string;
  workspaceVersion?: number;
  sessionAware?: boolean;
  onCommand(command: XRCommand): void;
};
const labels: Record<XRCommand["type"], string> = {
  OPEN_ASSET: "Open asset",
  FOCUS_PANEL: "Focus panel",
  RESET_WORKSPACE: "Reset workspace…",
  GENERATE_IDEAS: "Generate ideas",
};

export default function AssistantPanel(props: Props) {
  return props.sessionAware ? (
    <SessionAssistantPanel {...props} />
  ) : (
    <ScopedAssistantPanel {...props} />
  );
}

function SessionAssistantPanel(props: Props) {
  const { isLoaded, sessionId } = useAuth();
  if (!isLoaded) return <p role="status">Checking your assistant session…</p>;
  if (!sessionId) return <p role="status">Sign in to use the creative assistant.</p>;
  return <ScopedAssistantPanel key={sessionId} {...props} />;
}

function ScopedAssistantPanel(props: Props) {
  // A changed workspace or permission scope starts a fresh, consent-gated
  // assistant session; React discards its private state during the commit.
  return (
    <AssistantPanelContent
      key={`${props.projectId}:${props.contextKey ?? ""}:${Boolean(props.disabled)}`}
      {...props}
    />
  );
}

function AssistantPanelContent({
  projectId,
  disabled = false,
  contextKey,
  workspaceVersion,
  onCommand,
}: Props) {
  const {
    readiness,
    retryReadiness,
    reply,
    message,
    transcript,
    setMessage,
    language,
    setLanguage,
    busy,
    error,
    setError,
    consent,
    setConsent,
    confirmReset,
    setConfirmReset,
    audioUrl,
    playback,
    ask,
    record,
    speak,
    stopRecording,
    cancelRecording,
    cancelRequest,
    reviewCommand,
    setReviewCommand,
    verifyCommand,
  } = useAssistantClient(projectId, disabled, contextKey, workspaceVersion);
  function choose(command: XRCommand) {
    const validated = XRCommandSchema.parse(command);
    if (validated.type === "RESET_WORKSPACE") {
      setConfirmReset(true);
      return;
    }
    if (validated.type === "GENERATE_IDEAS") {
      void ask(
        "Generate three concise campaign ideas using this project's authorized brief and facts. Return ideas in your reply, with no further GENERATE_IDEAS command.",
      );
      return;
    }
    setReviewCommand(validated);
  }

  return (
    <section className={styles.panel} aria-label="Creative assistant">
      <h3>Creative assistant</h3>
      <p className={styles.note}>
        Legacy A-Frame actions only. Canonical R3F voice commands are not implemented.
      </p>
      <p className={styles.note}>
        {disabled
          ? "Open an editable, connected project to use the assistant."
          : (readiness?.message ?? "Checking assistant configuration…")}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (busy === "idle") void ask();
        }}
      >
        <label className={styles.field}>
          Language
          <select
            value={language}
            disabled={busy !== "idle" || disabled}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="en-IN">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="kn-IN">Kannada</option>
          </select>
        </label>
        <label className={styles.field}>
          Ask about this project
          <textarea
            rows={3}
            maxLength={2000}
            value={message}
            disabled={disabled || busy !== "idle"}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Summarize the brief or suggest three story ideas"
          />
        </label>
        <button
          type="submit"
          disabled={disabled || busy !== "idle" || !readiness?.textAvailable || !message.trim()}
        >
          <Send size={15} />
          Send to assistant
        </button>
      </form>
      <details className={styles.voice}>
        <summary>Voice controls</summary>
        <p>
          Voice records for up to 20 seconds. Audio is sent to Sarvam for transcription, then the
          text and authorized project context go to the configured assistant. This app does not
          store the audio or conversation. Development mock mode does not call Gemini.
        </p>
        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={consent}
            disabled={disabled || busy !== "idle"}
            onChange={(event) => setConsent(event.target.checked)}
          />
          I agree to send this voice message for speech recognition and assistance.
        </label>
        <div className={styles.actions}>
          {busy === "recording" ? (
            <button type="button" onClick={() => stopRecording()}>
              <Square size={15} />
              Stop and send
            </button>
          ) : (
            <button
              type="button"
              disabled={
                disabled ||
                busy !== "idle" ||
                !consent ||
                !readiness?.sttAvailable ||
                !readiness?.textAvailable
              }
              onClick={() => void record()}
            >
              <Mic size={15} />
              Record voice message
            </button>
          )}
        </div>
        {!readiness?.sttAvailable && (
          <p className={styles.note}>Sarvam speech recognition is not configured.</p>
        )}
      </details>
      {(busy === "recording" || busy === "permission") && (
        <button type="button" onClick={cancelRecording}>
          Cancel recording
        </button>
      )}
      {["transcribing", "thinking", "approving", "speech"].includes(busy) && (
        <button type="button" onClick={cancelRequest}>
          Cancel request
        </button>
      )}
      {!readiness && error && !disabled && (
        <button type="button" onClick={retryReadiness}>
          Retry assistant status
        </button>
      )}
      <p role="status" className={styles.status}>
        {busy === "thinking"
          ? "Thinking…"
          : busy === "permission"
            ? "Waiting for microphone permission…"
            : busy === "recording"
              ? "Recording · stops after 20 seconds"
              : busy === "transcribing"
                ? "Transcribing with Sarvam…"
                : busy === "speech"
                  ? "Preparing speech…"
                  : busy === "approving"
                    ? "Checking current project access…"
                    : ""}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {transcript && !disabled && (
        <div className={styles.transcript}>
          <strong>Voice transcript</strong>
          <output aria-label="Voice transcript">{transcript}</output>
          <p className={styles.note}>
            Edit the message above to correct recognition, then send it again. No action runs until
            you approve a proposal.
          </p>
        </div>
      )}
      {reply && !disabled && (
        <div className={styles.reply}>
          <strong>
            {reply.mode === "development-mock" ? "Development mock response" : "Assistant response"}
          </strong>
          <p>{reply.reply}</p>
          <p className={styles.note}>
            Suggestions are drafts. Actions below run only when you choose them.
          </p>
          <div className={styles.actions}>
            {reply.commands.map((command, index) => (
              <button
                key={index}
                type="button"
                disabled={disabled || busy !== "idle"}
                onClick={() => choose(command)}
              >
                {labels[command.type]}
              </button>
            ))}
          </div>
          {reviewCommand && (
            <div className={styles.confirm} role="region" aria-label="Review action proposal">
              <strong>Review legacy action</strong>
              <p>
                {reviewCommand.type === "FOCUS_PANEL"
                  ? `Focus panel ${reviewCommand.panelId}. Desktop view frames this panel; headset pose is unchanged. Does not change or save the layout.`
                  : reviewCommand.type === "OPEN_ASSET"
                    ? `Open the authorized preview for asset ${reviewCommand.assetId}. Does not change or save the layout.`
                    : "Review this action before applying."}
              </p>
              <button
                type="button"
                disabled={disabled || busy !== "idle"}
                onClick={() => void verifyCommand(reviewCommand, onCommand)}
              >
                Apply proposal
              </button>
              <button
                type="button"
                disabled={busy !== "idle"}
                onClick={() => setReviewCommand(null)}
              >
                Discard proposal
              </button>
            </div>
          )}
          {confirmReset && (
            <div className={styles.confirm} role="alert">
              <p>
                Reset and save the default workspace layout? This replaces your saved layout and
                current unsaved arrangement.
              </p>
              <button
                type="button"
                disabled={disabled || busy !== "idle"}
                onClick={() => {
                  void verifyCommand({ type: "RESET_WORKSPACE" }, onCommand);
                }}
              >
                Confirm reset
              </button>
              <button
                type="button"
                onClick={() => (busy === "approving" ? cancelRequest() : setConfirmReset(false))}
              >
                Keep layout
              </button>
            </div>
          )}
          <button
            type="button"
            disabled={disabled || busy !== "idle" || !readiness?.ttsAvailable}
            onClick={() => void speak()}
          >
            <Volume2 size={15} />
            Prepare spoken reply
          </button>
          {reply.reply.length > 1500 && (
            <p className={styles.note}>Speech uses the first 1500 characters.</p>
          )}
          {audioUrl && (
            <audio
              ref={playback}
              controls
              src={audioUrl}
              aria-label="Assistant spoken reply"
              onError={() =>
                setError(
                  "This browser could not play the spoken reply. The text response remains available.",
                )
              }
            />
          )}
        </div>
      )}
    </section>
  );
}
