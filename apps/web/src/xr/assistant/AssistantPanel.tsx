"use client";

import { Mic, Send, Square, Volume2 } from "lucide-react";
import type { Language } from "@/lib/contracts";
import { XRCommandSchema, type XRCommand } from "@/lib/contracts/xr-assistant";
import { useAssistantClient } from "./use-assistant-client";
import styles from "./assistant.module.css";

type Props = { projectId: string; disabled?: boolean; onCommand(command: XRCommand): void };
const labels: Record<XRCommand["type"], string> = {
  OPEN_ASSET: "Open asset",
  FOCUS_PANEL: "Focus panel",
  RESET_WORKSPACE: "Reset workspace…",
  GENERATE_IDEAS: "Generate ideas",
};

export default function AssistantPanel(props: Props) {
  return <AssistantPanelContent key={props.projectId} {...props} />;
}

function AssistantPanelContent({ projectId, disabled = false, onCommand }: Props) {
  const {
    readiness,
    reply,
    message,
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
  } = useAssistantClient(projectId, disabled);
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
    onCommand(validated);
  }

  return (
    <section className={styles.panel} aria-label="Creative assistant">
      <h3>Creative assistant</h3>
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
          {(busy === "recording" || busy === "permission") && (
            <button type="button" onClick={() => cancelRecording()}>
              Cancel recording
            </button>
          )}
        </div>
        {!readiness?.sttAvailable && (
          <p className={styles.note}>Sarvam speech recognition is not configured.</p>
        )}
      </details>
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
                  : ""}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {reply && (
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
          {confirmReset && (
            <div className={styles.confirm} role="alert">
              <p>
                Reset this workspace to its default layout? Your current unsaved arrangement will be
                replaced.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirmReset(false);
                  onCommand({ type: "RESET_WORKSPACE" });
                }}
              >
                Confirm reset
              </button>
              <button type="button" onClick={() => setConfirmReset(false)}>
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
