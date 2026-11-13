"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { apiResultSchema, type Language } from "@/lib/contracts";
import {
  XRAssistantReadinessSchema,
  XRAssistantResponseSchema,
  XRTranscriptionSchema,
  validateAssistantCommands,
  type XRCommand,
  type XRAssistantReadiness,
  type XRAssistantResponse,
} from "@/lib/contracts/xr-assistant";
import { XRWorkspaceDataSchema } from "@/lib/contracts/xr-workspace";
import { VoiceCapture, browserVoiceDependencies } from "./voice-capture";

const responseSchema = apiResultSchema(XRAssistantResponseSchema);
const readinessSchema = apiResultSchema(XRAssistantReadinessSchema);
const transcriptionSchema = apiResultSchema(XRTranscriptionSchema);
const workspaceSchema = apiResultSchema(XRWorkspaceDataSchema);
type Busy =
  "idle" | "thinking" | "permission" | "recording" | "transcribing" | "speech" | "approving";

export function useAssistantClient(
  projectId: string,
  disabled: boolean,
  contextKey = "",
  workspaceVersion?: number,
) {
  const [readiness, setReadiness] = useState<XRAssistantReadiness | null>(null);
  const [reply, setReply] = useState<XRAssistantResponse | null>(null);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<Language>("en-IN");
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [reviewCommand, setReviewCommand] = useState<XRCommand | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const requests = useRef(new Set<AbortController>());
  const mounted = useRef(false);
  const generation = useRef(0);
  const busyRef = useRef<Busy>("idle");
  const capture = useRef<VoiceCapture | null>(null);
  const playback = useRef<HTMLAudioElement | null>(null);
  const ownedAudioUrl = useRef<string | null>(null);
  const reloadReadiness = useRef<(() => void) | null>(null);
  const current = (ticket: number) => mounted.current && generation.current === ticket;
  const stopOwned = useCallback(() => {
    generation.current++;
    requests.current.forEach((request) => request.abort());
    requests.current.clear();
    const recording = capture.current;
    capture.current = null;
    recording?.cancel();
    playback.current?.pause();
    if (ownedAudioUrl.current) URL.revokeObjectURL(ownedAudioUrl.current);
    ownedAudioUrl.current = null;
    busyRef.current = "idle";
  }, []);

  // Invalidate during unmount/context-change commit, before a late promise can publish private data.
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopOwned();
    };
  }, [projectId, disabled, contextKey, stopOwned]);

  useEffect(() => {
    // AssistantPanel keys this hook's component by project/context/permission.
    const ownedRequests = requests.current;
    let latest: AbortController | null = null;
    const loadReadiness = () => {
      if (disabled) return;
      latest?.abort();
      const ticket = generation.current;
      const controller = new AbortController();
      latest = controller;
      ownedRequests.add(controller);
      void fetch(`/api/xr/assistant/${projectId}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => {
          const input = await response.json();
          if (!current(ticket) || controller.signal.aborted) return;
          const parsed = readinessSchema.safeParse(input);
          if (!parsed.success)
            throw new Error("Assistant status could not load. Type a command or try again.");
          if (!parsed.data.ok) throw new Error(parsed.data.error.message);
          if (!response.ok) throw new Error("Assistant status is unavailable. Try again later.");
          setReadiness(parsed.data.data);
        })
        .catch((reason: unknown) => {
          if (current(ticket) && !controller.signal.aborted) report(reason, ticket);
        })
        .finally(() => ownedRequests.delete(controller));
    };
    reloadReadiness.current = loadReadiness;
    loadReadiness();
    const hidden = () => {
      if (document.hidden)
        cancel(
          "Voice assistance stopped because this page is hidden. Type a command when you return.",
        );
      else {
        setReadiness(null);
        setError("");
        loadReadiness();
      }
    };
    const pagehide = () => cancel("Voice assistance stopped. Type a command when ready.");
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pagehide);
    return () => {
      latest?.abort();
      if (latest) ownedRequests.delete(latest);
      if (reloadReadiness.current === loadReadiness) reloadReadiness.current = null;
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("pagehide", pagehide);
    };
    // Ref-owned generations isolate all asynchronous work; remount owns state reset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, disabled, contextKey]);

  function cancel(notice = "Request cancelled. You can type a command instead.") {
    stopOwned();
    if (!mounted.current) return;
    setBusy("idle");
    setReply(null);
    setConfirmReset(false);
    setReviewCommand(null);
    setAudioUrl(null);
    setError(notice);
  }
  function begin(phase: Busy, clearReply = true): number | null {
    if (!mounted.current || disabled || document.hidden || busyRef.current !== "idle") return null;
    const ticket = ++generation.current;
    busyRef.current = phase;
    setBusy(phase);
    setError("");
    if (clearReply) {
      setReply(null);
      setConfirmReset(false);
      setReviewCommand(null);
    }
    return ticket;
  }
  function phase(ticket: number, next: Busy) {
    if (current(ticket)) {
      busyRef.current = next;
      setBusy(next);
    }
  }
  function finish(ticket: number) {
    if (current(ticket)) {
      busyRef.current = "idle";
      setBusy("idle");
    }
  }
  async function request(url: string, init: RequestInit, ticket: number) {
    if (!current(ticket)) throw new DOMException("Request cancelled", "AbortError");
    const controller = new AbortController();
    requests.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
      const blob = await response.blob();
      if (!current(ticket) || controller.signal.aborted)
        throw new DOMException("Request cancelled", "AbortError");
      return { response, blob };
    } finally {
      clearTimeout(timeout);
      requests.current.delete(controller);
    }
  }
  function report(reason: unknown, ticket: number) {
    if (!current(ticket)) return;
    const name = reason instanceof Error ? reason.name : "";
    const message =
      name === "NotAllowedError"
        ? "Microphone permission was denied. Type a command or enable microphone access before recording again."
        : name === "AbortError"
          ? "The request was cancelled or timed out. Type a command or try again."
          : reason instanceof TypeError
            ? "The assistant service could not be reached. Type a command or try again."
            : reason instanceof Error
              ? `${reason.message}${/type a command/i.test(reason.message) ? "" : " You can type a command instead."}`
              : "The assistant could not complete the request. Type a command instead.";
    setError(message);
  }
  async function replyFor(text: string, ticket: number) {
    phase(ticket, "thinking");
    const { response, blob } = await request(
      `/api/xr/assistant/${projectId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language }),
      },
      ticket,
    );
    const raw = await blob.text();
    if (!current(ticket)) return;
    const parsed = responseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      throw new Error("The assistant returned an invalid proposal. No action was performed.");
    if (!parsed.data.ok) throw new Error(parsed.data.error.message);
    if (!response.ok) throw new Error("The assistant could not complete this request.");
    setReply(parsed.data.data);
  }
  async function ask(text = message) {
    if (!text.trim() || text.length > 2000 || !readiness?.textAvailable) return;
    const ticket = begin("thinking");
    if (ticket === null) return;
    try {
      await replyFor(text, ticket);
    } catch (reason) {
      report(reason, ticket);
    } finally {
      finish(ticket);
    }
  }
  async function record() {
    if (!consent || !readiness?.sttAvailable || !readiness.textAvailable) return;
    const ticket = begin("permission");
    if (ticket === null) return;
    setTranscript("");
    playback.current?.pause();
    const recording = new VoiceCapture(browserVoiceDependencies(), () =>
      phase(ticket, "recording"),
    );
    capture.current = recording;
    try {
      const audio = await recording.start();
      if (!current(ticket)) return;
      if (capture.current === recording) capture.current = null;
      phase(ticket, "transcribing");
      const { response, blob } = await request(
        `/api/xr/assistant/${projectId}/transcribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": audio.type,
            "X-Speech-Language": language,
            "X-Speech-Consent": "xr-voice-v1",
          },
          body: audio,
        },
        ticket,
      );
      const raw = await blob.text();
      if (!current(ticket)) return;
      const parsed = transcriptionSchema.safeParse(JSON.parse(raw));
      if (!parsed.success)
        throw new Error(
          "Speech recognition returned an invalid transcript. No action was performed.",
        );
      if (!parsed.data.ok) throw new Error(parsed.data.error.message);
      if (!response.ok) throw new Error("Speech recognition is unavailable.");
      setTranscript(parsed.data.data.text);
      setMessage(parsed.data.data.text);
      await replyFor(parsed.data.data.text, ticket);
    } catch (reason) {
      report(reason, ticket);
    } finally {
      if (capture.current === recording) capture.current = null;
      finish(ticket);
    }
  }
  async function verifyCommand(
    command: XRCommand,
    dispatch: (command: XRCommand) => void,
  ): Promise<boolean> {
    const ticket = begin("approving", false);
    if (ticket === null) return false;
    try {
      const { response, blob } = await request(`/api/xr/workspaces/${projectId}`, {}, ticket);
      const raw = await blob.text();
      if (!current(ticket)) return false;
      const parsed = workspaceSchema.safeParse(JSON.parse(raw));
      if (!parsed.success)
        throw new Error("Current project access could not be verified. No action was performed.");
      if (!parsed.data.ok) throw new Error(parsed.data.error.message);
      const data = parsed.data.data;
      if (
        !response.ok ||
        !data.canEdit ||
        data.project.id !== projectId ||
        data.workspace.projectId !== projectId
      )
        throw new Error("Project edit access is unavailable. No action was performed.");
      if (workspaceVersion !== undefined && data.workspace.version !== workspaceVersion)
        throw new Error("The workspace changed. Reload it and request a new proposal.");
      validateAssistantCommands([command], {
        projectId,
        panelIds: data.workspace.layout.objects.map((object) => object.id),
        assetIds: data.content.assets.map((asset) => asset.id),
      });
      if (!current(ticket)) return false;
      setReply(null);
      setReviewCommand(null);
      setConfirmReset(false);
      // Dispatch synchronously after the last generation check, never from a
      // later caller continuation that might belong to another scene/session.
      dispatch(command);
      return true;
    } catch (reason) {
      if (current(ticket)) {
        setReply(null);
        setReviewCommand(null);
        setConfirmReset(false);
        report(reason, ticket);
      }
      return false;
    } finally {
      finish(ticket);
    }
  }
  async function speak() {
    if (!reply || !readiness?.ttsAvailable) return;
    const ticket = begin("speech", false);
    if (ticket === null) return;
    playback.current?.pause();
    try {
      const { response, blob } = await request(
        `/api/xr/assistant/${projectId}/speak`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: reply.reply.slice(0, 1500), language }),
        },
        ticket,
      );
      if (!response.ok)
        throw new Error("Speech playback could not load. The text response remains available.");
      if (blob.type !== "audio/wav" || !blob.size)
        throw new Error("Speech playback returned an unsupported recording.");
      if (!current(ticket)) return;
      if (ownedAudioUrl.current) URL.revokeObjectURL(ownedAudioUrl.current);
      ownedAudioUrl.current = URL.createObjectURL(blob);
      setAudioUrl(ownedAudioUrl.current);
    } catch (reason) {
      report(reason, ticket);
    } finally {
      finish(ticket);
    }
  }
  return {
    readiness,
    retryReadiness: () => {
      setError("");
      reloadReadiness.current?.();
    },
    reply,
    message,
    setMessage,
    transcript,
    language,
    setLanguage,
    busy,
    error,
    setError,
    consent,
    setConsent,
    confirmReset,
    setConfirmReset,
    reviewCommand,
    setReviewCommand,
    audioUrl,
    playback,
    ask,
    record,
    speak,
    verifyCommand,
    cancelRequest: () => cancel(),
    stopRecording: () => capture.current?.stop(),
    cancelRecording: () => cancel(),
  };
}
