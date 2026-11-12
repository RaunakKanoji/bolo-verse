"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiResultSchema, type Language } from "@/lib/contracts";
import {
  XRAssistantReadinessSchema,
  XRAssistantResponseSchema,
  XRTranscriptionSchema,
  type XRAssistantReadiness,
  type XRAssistantResponse,
} from "@/lib/contracts/xr-assistant";
import { VoiceCapture, browserVoiceDependencies } from "./voice-capture";

const responseSchema = apiResultSchema(XRAssistantResponseSchema);
const readinessSchema = apiResultSchema(XRAssistantReadinessSchema);
const transcriptionSchema = apiResultSchema(XRTranscriptionSchema);
type Busy = "idle" | "thinking" | "permission" | "recording" | "transcribing" | "speech";

export function useAssistantClient(projectId: string, disabled: boolean) {
  const [readiness, setReadiness] = useState<XRAssistantReadiness | null>(null);
  const [reply, setReply] = useState<XRAssistantResponse | null>(null);
  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState<Language>("en-IN");
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const requests = useRef(new Set<AbortController>());
  const mounted = useRef(false);
  const capture = useRef<VoiceCapture | null>(null);
  const playback = useRef<HTMLAudioElement | null>(null);
  const ownedAudioUrl = useRef<string | null>(null);
  const pausePlayback = useCallback(() => playback.current?.pause(), []);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    if (!disabled) {
      void fetch(`/api/xr/assistant/${projectId}`, { signal: controller.signal, cache: "no-store" })
        .then(async (response) => {
          const result = readinessSchema.parse(await response.json());
          if (!mounted.current || controller.signal.aborted) return;
          if (!result.ok) throw new Error(result.error.message);
          setReadiness(result.data);
        })
        .catch((reason: unknown) => {
          if (!controller.signal.aborted && mounted.current)
            setError(reason instanceof Error ? reason.message : "Assistant status could not load.");
        });
    }
    const onHidden = () => {
      if (document.hidden) {
        capture.current?.cancel();
        pausePlayback();
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    const pendingRequests = requests.current;
    return () => {
      mounted.current = false;
      controller.abort();
      pendingRequests.forEach((request) => request.abort());
      pendingRequests.clear();
      capture.current?.cancel();
      pausePlayback();
      if (ownedAudioUrl.current) URL.revokeObjectURL(ownedAudioUrl.current);
      ownedAudioUrl.current = null;
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [projectId, disabled, pausePlayback]);

  async function request(path: string, init: RequestInit) {
    const controller = new AbortController();
    requests.current.add(controller);
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`/api/xr/assistant/${projectId}${path}`, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      // Keep the request timeout active through body consumption.
      const blob = await response.blob();
      if (!mounted.current || controller.signal.aborted)
        throw new DOMException("Request cancelled", "AbortError");
      return { response, blob };
    } finally {
      clearTimeout(timeout);
      requests.current.delete(controller);
    }
  }
  function report(reason: unknown) {
    if (!mounted.current) return;
    setError(
      reason instanceof DOMException && reason.name === "AbortError"
        ? "The request was cancelled or timed out. Try again when ready."
        : reason instanceof Error
          ? reason.message
          : "The assistant could not complete the request.",
    );
  }
  async function ask(text = message) {
    if (!text.trim() || !readiness?.textAvailable || disabled) return;
    setBusy("thinking");
    setError("");
    setConfirmReset(false);
    try {
      const { blob } = await request("", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, language }),
      });
      const result = responseSchema.parse(JSON.parse(await blob.text()));
      if (!result.ok) throw new Error(result.error.message);
      if (mounted.current) setReply(result.data);
    } catch (reason) {
      report(reason);
    } finally {
      if (mounted.current) setBusy("idle");
    }
  }
  async function record() {
    if (
      busy !== "idle" ||
      !consent ||
      !readiness?.sttAvailable ||
      !readiness.textAvailable ||
      disabled
    )
      return;
    setBusy("permission");
    setError("");
    playback.current?.pause();
    const recording = new VoiceCapture(browserVoiceDependencies(), () => {
      if (mounted.current) setBusy("recording");
    });
    capture.current = recording;
    try {
      const audio = await recording.start();
      if (!mounted.current) return;
      setBusy("transcribing");
      const { blob } = await request("/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": audio.type,
          "X-Speech-Language": language,
          "X-Speech-Consent": "xr-voice-v1",
        },
        body: audio,
      });
      const result = transcriptionSchema.parse(JSON.parse(await blob.text()));
      if (!result.ok) throw new Error(result.error.message);
      if (!mounted.current) return;
      setMessage(result.data.text);
      await ask(result.data.text);
    } catch (reason) {
      report(reason);
    } finally {
      capture.current = null;
      if (mounted.current) setBusy("idle");
    }
  }
  async function speak() {
    if (!reply || !readiness?.ttsAvailable || busy !== "idle" || disabled) return;
    setBusy("speech");
    setError("");
    playback.current?.pause();
    try {
      const { response, blob } = await request("/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply.reply.slice(0, 1500), language }),
      });
      if (!response.ok) {
        const result = responseSchema.safeParse(JSON.parse(await blob.text()));
        throw new Error(
          result.success && !result.data.ok
            ? result.data.error.message
            : "Speech playback could not load.",
        );
      }
      if (blob.type !== "audio/wav" || !blob.size)
        throw new Error("Speech playback returned an unsupported recording.");
      if (ownedAudioUrl.current) URL.revokeObjectURL(ownedAudioUrl.current);
      const url = URL.createObjectURL(blob);
      ownedAudioUrl.current = url;
      setAudioUrl(url);
      // The separate native Play control supplies its own user gesture.
    } catch (reason) {
      report(reason);
    } finally {
      if (mounted.current) setBusy("idle");
    }
  }
  return {
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
    stopRecording: () => capture.current?.stop(),
    cancelRecording: () => capture.current?.cancel(),
  };
}
