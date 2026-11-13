"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CAPTURE_FPS, CAPTURE_HEIGHT, CAPTURE_WIDTH, createMonoStage, type MonoStage } from "./engine/mono-stage";
import { beginLocalRecording, chooseRecordingMime, type LocalRecording, type RecordingTake } from "./recording/local-recording";
import { claimMicrophone } from "@/lib/media/microphone-owner";
import styles from "./studio.module.css";

type Phase = "loading" | "idle" | "permission" | "recording" | "stopping" | "ready" | "error";
type Capabilities = { secure: boolean; webgl: boolean; capture: boolean; microphone: boolean; recorder: boolean; mime: string | null };
type LocalFile = LocalRecording & { url: string; filename: string; elapsed: number };
type Runtime = {
  alive: boolean;
  requestId: number;
  pending: boolean;
  stage: MonoStage | null;
  take: RecordingTake | null;
  tracks: MediaStreamTrack[];
  url: string | null;
  interruption: string | null;
  cleanupTake: (() => void) | null;
};

function explainError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone permission was denied. Allow microphone access in your browser, then try again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") return "No microphone was found. Connect one and try again.";
  if (error instanceof DOMException && error.name === "NotReadableError") return "Your microphone is unavailable. Close other apps using it and try again.";
  return error instanceof Error ? error.message : "Recording could not start. Please try again.";
}

export default function StudioExperiment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<Runtime>({ alive: false, requestId: 0, pending: false, stage: null, take: null, tracks: [], url: null, interruption: null, cleanupTake: null });
  const [phase, setPhase] = useState<Phase>("loading");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [consent, setConsent] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<LocalFile | null>(null);
  const [playbackSize, setPlaybackSize] = useState<string | null>(null);

  const interrupt = useCallback((message: string) => {
    const owner = runtime.current;
    if (!owner.alive) return;
    if (owner.pending) {
      owner.requestId += 1;
      owner.pending = false;
      owner.cleanupTake?.();
      setPhase("error");
      setError(message);
    }
    if (owner.take) {
      owner.interruption ??= message;
      setPhase("stopping");
      setError(owner.interruption);
      void owner.take.stop(owner.interruption);
      // Interruption/pagehide must release the microphone even if the browser
      // suspends event delivery before the recorder can finish.
      owner.cleanupTake?.();
    }
  }, []);

  useEffect(() => {
    const owner = runtime.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    owner.alive = true;
    const setupId = ++owner.requestId;
    let stageError: string | null = null;
    try {
      owner.stage = createMonoStage(canvas, () => {
        interrupt("The graphics context was lost. Reload the page to restore the preview.");
        setCapabilities((current) => current ? { ...current, webgl: false } : current);
        if (!owner.take && !owner.pending) setPhase("error");
        setError("The graphics context was lost. Download any completed take, then reload this page.");
      });
    } catch (cause) {
      stageError = explainError(cause);
    }
    const recorderAvailable = typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function";
    const detected: Capabilities = {
      secure: window.isSecureContext,
      webgl: Boolean(owner.stage),
      capture: typeof canvas.captureStream === "function",
      microphone: typeof navigator.mediaDevices?.getUserMedia === "function",
      recorder: recorderAvailable,
      mime: recorderAvailable ? chooseRecordingMime((mime) => MediaRecorder.isTypeSupported(mime)) : null,
    };
    // Publish results after this external renderer has initialized.
    queueMicrotask(() => {
      if (!owner.alive || owner.requestId !== setupId) return;
      setCapabilities(detected);
      setPhase(stageError ? "error" : "idle");
      if (stageError) setError(`Portrait preview unavailable: ${stageError}`);
    });

    function onVisibility() {
      const visible = document.visibilityState === "visible";
      owner.stage?.setVisible(visible);
      if (!visible) interrupt("Recording interrupted because the page was hidden. Keep this tab visible and try again.");
    }
    function onPageHide() {
      interrupt("Recording interrupted because you left the page. Return to the studio and try again.");
      owner.stage?.setVisible(false);
    }
    function onPageShow() { owner.stage?.setVisible(document.visibilityState === "visible"); }
    function beforeUnload(event: BeforeUnloadEvent) {
      if (owner.url || owner.take || owner.pending) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    function beforeClientNavigation(event: MouseEvent) {
      if ((!owner.url && !owner.take && !owner.pending) || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const destination = new URL(link.href, window.location.href);
      // External links perform a full navigation and use beforeunload. Next.js
      // same-origin links need their own warning before client-side teardown.
      if (destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      const message = owner.url
        ? "This local recording is not saved. Leaving this page discards it. Download it first, or leave anyway?"
        : "A recording or microphone request is in progress. Leaving this page ends it and discards the take. Leave anyway?";
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", beforeClientNavigation, true);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      owner.alive = false;
      owner.requestId += 1;
      owner.pending = false;
      void owner.take?.stop("Studio closed. The interrupted take was discarded.");
      owner.take = null;
      owner.cleanupTake?.();
      owner.cleanupTake = null;
      owner.tracks = [];
      if (owner.url) URL.revokeObjectURL(owner.url);
      owner.url = null;
      owner.stage?.dispose();
      owner.stage = null;
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", beforeClientNavigation, true);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [interrupt]);

  async function record(seconds: 5 | 15) {
    const owner = runtime.current;
    const canvas = canvasRef.current;
    if (!consent || !capabilities?.mime || !canvas || owner.pending || owner.take || owner.url) return;
    if (document.visibilityState !== "visible") return;
    const requestId = ++owner.requestId;
    owner.pending = true;
    owner.interruption = null;
    setError(null);
    setPhase("permission");
    const ownedTracks: MediaStreamTrack[] = [];
    let take: RecordingTake | null = null;
    let progressTimer: ReturnType<typeof setInterval> | undefined;
    let removeListeners = () => {};
    let releaseMicrophone = () => {};
    const permissionTimer = setTimeout(() => {
      if (owner.alive && owner.pending && requestId === owner.requestId) {
        interrupt("Microphone permission timed out. Dismiss the browser prompt and try again.");
      }
    }, 30_000);
    function cleanupTake() {
      clearTimeout(permissionTimer);
      clearInterval(progressTimer);
      removeListeners();
      ownedTracks.forEach((track) => track.stop());
      releaseMicrophone();
    }
    owner.cleanupTake = cleanupTake;
    try {
      releaseMicrophone = claimMicrophone(owner);
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
      ownedTracks.push(...microphone.getTracks());
      clearTimeout(permissionTimer);
      if (!owner.alive || requestId !== owner.requestId) return;
      owner.pending = false;
      const capture = canvas.captureStream(CAPTURE_FPS);
      ownedTracks.push(...capture.getTracks());
      const video = capture.getVideoTracks()[0];
      const audio = microphone.getAudioTracks()[0];
      if (!video || !audio || video.readyState !== "live" || audio.readyState !== "live") {
        throw new Error("The browser did not provide a live video and microphone track. Please try again.");
      }
      const stream = new MediaStream([video, audio]);
      const recorder = new MediaRecorder(stream, { mimeType: capabilities.mime, videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 });
      take = beginLocalRecording(recorder, ownedTracks, seconds * 1000);
      owner.take = take;
      owner.tracks = ownedTracks;
      function onEnded() { interrupt("A recording track disconnected. Reconnect your microphone and try again."); }
      function onMuted() { interrupt("The microphone became unavailable during the take. Check your microphone and try again."); }
      ownedTracks.forEach((track) => track.addEventListener("ended", onEnded));
      audio.addEventListener("mute", onMuted);
      removeListeners = () => {
        ownedTracks.forEach((track) => track.removeEventListener("ended", onEnded));
        audio.removeEventListener("mute", onMuted);
      };
      const startedAt = performance.now();
      setRemaining(seconds);
      setPhase("recording");
      progressTimer = setInterval(() => {
        if (!owner.alive || requestId !== owner.requestId) return;
        const left = Math.max(0, seconds - (performance.now() - startedAt) / 1000);
        setRemaining(Math.ceil(left));
        if (left === 0) setPhase("stopping");
      }, 200);
      const completed = await take.result;
      if (!owner.alive || requestId !== owner.requestId) return;
      const url = URL.createObjectURL(completed.blob);
      owner.url = url;
      setLocalFile({ ...completed, url, filename: `boloverse-local-draft.${completed.extension}`, elapsed: (performance.now() - startedAt) / 1000 });
      setPhase("ready");
    } catch (cause) {
      if (owner.alive && requestId === owner.requestId) {
        setError(explainError(cause));
        setPhase("error");
      }
    } finally {
      cleanupTake();
      if (owner.cleanupTake === cleanupTake) owner.cleanupTake = null;
      if (requestId === owner.requestId) {
        owner.pending = false;
        if (owner.take === take) owner.take = null;
        owner.tracks = [];
      }
    }
  }

  function stop() {
    if (runtime.current.pending) {
      interrupt("Microphone request cancelled. Dismiss any remaining browser permission prompt; a late stream will be released.");
    } else if (runtime.current.take) {
      setPhase("stopping");
      void runtime.current.take.stop();
    }
  }

  function discard() {
    if (runtime.current.url) URL.revokeObjectURL(runtime.current.url);
    runtime.current.url = null;
    setLocalFile(null);
    setPlaybackSize(null);
    setError(null);
    setPhase("idle");
  }

  const busy = phase === "permission" || phase === "recording" || phase === "stopping";
  const supported = capabilities && capabilities.secure && capabilities.webgl && capabilities.capture && capabilities.microphone && capabilities.recorder && capabilities.mime;
  const canRecord = Boolean(supported && consent && !busy && !localFile);
  const status = phase === "loading" ? "Checking this browser…"
    : phase === "permission" ? "Waiting for microphone permission…"
    : phase === "recording" ? `Recording · ${remaining}s remaining`
    : phase === "stopping" ? "Finalizing local recording…"
    : phase === "ready" ? "Local recording ready — not saved"
    : phase === "error" ? "Test paused"
    : "Ready when you are";
  const checks = capabilities ? [
    ["Secure context", capabilities.secure, "HTTPS or localhost"],
    ["WebGL 2 preview", capabilities.webgl, "Three.js renderer"],
    ["Canvas capture", capabilities.capture, "Portrait video source"],
    ["Microphone API", capabilities.microphone, "Permission requested on record"],
    ["Video encoder", capabilities.recorder && Boolean(capabilities.mime), capabilities.mime ?? "No supported format"],
  ] as const : [];

  return (
    <div className={styles.experiment}>
      <section className={styles.previewPanel} aria-label="Portrait scene preview">
        <div className={styles.previewHeading}><span>MONO PREVIEW</span><span>9:16</span></div>
        <div className={styles.canvasFrame}>
          <canvas ref={canvasRef} data-testid="portrait-canvas" width={CAPTURE_WIDTH} height={CAPTURE_HEIGHT} aria-label="Portrait sample campaign: illustrated Ilkal textile with a draft watermark" />
          {phase === "loading" && <span className={styles.loading}>Preparing scene…</span>}
        </div>
        <div className={styles.previewFooter}><span className={styles.dot} /> Fixed portrait camera <span>720 × 1280</span></div>
        <p className={styles.previewNote}>Original illustrated sample · 2.5D card</p>
      </section>

      <div className={styles.controls}>
        <section className={styles.recordPanel} aria-labelledby="record-heading">
          <p className={styles.eyebrow}>A SMALL FIRST TAKE</p>
          <h2 id="record-heading">Give your story a voice.</h2>
          <p className={styles.description}>Test a portrait video with your narration. The scene is a fictional Ilkal saree campaign, ready for a few words from you.</p>
          <div className={styles.disclosure}>
            <strong>Only on this device</strong>
            <p>Your microphone and this scene are recorded in this browser. No audio is sent to a provider or uploaded. Microphone access ends after each take.</p>
          </div>
          <label className={styles.consent}>
            <input type="checkbox" checked={Boolean(consent)} disabled={busy} onChange={(event) => setConsent(event.target.checked ? new Date().toISOString() : null)} />
            <span>I agree to record my microphone locally</span>
          </label>
          {consent && <p className={styles.consentNote}>Local narration consent v1 accepted for this page session.</p>}
          <div className={styles.actions}>
            <Button disabled={!canRecord} onClick={() => void record(5)}>Record 5-second test</Button>
            <Button variant="outline" disabled={!canRecord} onClick={() => void record(15)}>Record 15-second test</Button>
          </div>
          {busy && <Button variant="outline" disabled={phase === "stopping"} onClick={stop}>{phase === "permission" ? "Cancel microphone request" : "Stop recording"}</Button>}
          <div className={`${styles.status} ${phase === "recording" ? styles.recordingStatus : ""}`} role="status" data-testid="recording-status"><span className={styles.dot} />{status}</div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {capabilities && !supported && <p className={styles.error}>This browser is missing a required capability. Use current Chrome on HTTPS or localhost and check the readiness panel below.</p>}
          <p className={styles.helper}>Recording starts after permission is granted and stops automatically. Keep this tab visible. Voice commands, uploads, and saved projects arrive in later milestones.</p>
        </section>

        {localFile && <section className={styles.resultPanel} aria-label="Completed local recording">
          <div className={styles.resultHeading}><h3>Your local take</h3><span>NOT SAVED</span></div>
          <p>Available in this page only. Download before leaving or reloading; there is no cloud save or reload recovery.</p>
          <video controls playsInline preload="metadata" src={localFile.url} aria-label="Local recording playback" onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            setPlaybackSize(`${video.videoWidth} × ${video.videoHeight}`);
          }} />
          <dl className={styles.fileDetails}>
            <div><dt>Actual format</dt><dd data-testid="recording-mime">{localFile.mimeType}</dd></div>
            <div><dt>File size</dt><dd>{(localFile.blob.size / 1024 / 1024).toFixed(2)} MB</dd></div>
            <div><dt>Encoded dimensions</dt><dd>{playbackSize ?? "Reading video metadata…"}</dd></div>
            <div><dt>Elapsed to ready</dt><dd>{localFile.elapsed.toFixed(1)} seconds</dd></div>
          </dl>
          <div className={styles.actions}>
            <Button asChild><a href={localFile.url} download={localFile.filename}>Download local recording</a></Button>
            <Button variant="outline" onClick={discard}>Discard local recording</Button>
          </div>
          <p className={styles.helper}>The draft watermark is part of the video pixels. Downloading creates a device copy; this app cannot confirm that the copy was saved.</p>
        </section>}

        <section className={styles.capabilityPanel} aria-labelledby="capability-heading">
          <div className={styles.capabilityHeading}><h3 id="capability-heading">Browser readiness</h3><span>LIVE CHECK</span></div>
          <ul className={styles.checks}>{checks.map(([name, okay, detail]) => <li key={name}>
            <span className={okay ? styles.checkOkay : styles.checkFail} aria-hidden="true">{okay ? "✓" : "–"}</span>
            <span>{name}<small>{detail}</small></span>
            <span className={styles.checkLabel}>{okay ? "Available" : "Unavailable"}</span>
          </li>)}</ul>
          <p className={styles.helper}>Capture target: 720 × 1280, up to 30 fps. This is a configured target, not a measured frame rate. Phone microphone quality, encoding performance, and headset comfort still need physical-device testing.</p>
        </section>
      </div>
    </div>
  );
}
