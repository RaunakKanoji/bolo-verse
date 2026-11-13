"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Camera, Mic, Square, Circle, Download } from "lucide-react";
import { apiResultSchema } from "@/lib/contracts/api";
import { AssetSummarySchema } from "@/lib/contracts/assets";
import { z } from "zod";
import { StudioProjectListSchema } from "@/lib/contracts/workspace";
import { claimMicrophone } from "@/lib/media/microphone-owner";
import {
  beginLocalRecording,
  chooseRecordingMime,
  type RecordingTake,
} from "@/features/studio/recording/local-recording";
import { PageHeader, ServiceNotice } from "./WorkspaceUI";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import styles from "./platform.module.css";
import own from "./recording.module.css";

type Take = { blob: Blob; url: string; extension: string; id: string };
export default function DeviceRecorder() {
  const { sessionKey } = useWorkspaceSession();
  return <RecorderSession key={sessionKey} />;
}
function RecorderSession() {
  const projects = useWorkspaceData("projects", StudioProjectListSchema);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]),
    [camera, setCamera] = useState(""),
    [microphone, setMicrophone] = useState("");
  const [preview, setPreview] = useState(false),
    [pending, setPending] = useState(false),
    [recording, setRecording] = useState(false),
    [stopping, setStopping] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [seconds, setSeconds] = useState(0),
    [level, setLevel] = useState(0);
  const [take, setTake] = useState<Take | null>(null),
    [projectId, setProjectId] = useState(""),
    [uploading, setUploading] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    activeTake = useRef<RecordingTake | null>(null);
  const epoch = useRef(0),
    release = useRef<(() => void) | null>(null),
    meter = useRef<ReturnType<typeof setInterval> | null>(null),
    timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<AudioContext | null>(null),
    blobUrl = useRef<string | null>(null),
    upload = useRef<AbortController | null>(null);
  function clearCapture() {
    if (meter.current) clearInterval(meter.current);
    if (timer.current) clearInterval(timer.current);
    meter.current = null;
    timer.current = null;
    if (audio.current) void audio.current.close().catch(() => undefined);
    audio.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    release.current?.();
    release.current = null;
  }
  useLayoutEffect(
    () => () => {
      epoch.current++;
      if (activeTake.current)
        void activeTake.current
          .stop("Recording cancelled because the workspace closed.")
          .catch(() => undefined);
      clearCapture();
      upload.current?.abort();
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    },
    [],
  );
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    let alive = true;
    const refresh = () => {
      void navigator.mediaDevices
        .enumerateDevices()
        .then((items) => {
          if (alive) setDevices(items);
        })
        .catch(() => undefined);
    };
    refresh();
    navigator.mediaDevices.addEventListener("devicechange", refresh);
    return () => {
      alive = false;
      navigator.mediaDevices.removeEventListener("devicechange", refresh);
    };
  }, []);
  async function enable() {
    if (pending || recording || stream.current) return;
    setError("");
    setNotice("");
    setPending(true);
    const id = ++epoch.current;
    const timeout = setTimeout(() => {
      if (epoch.current !== id) return;
      epoch.current++;
      clearCapture();
      setPending(false);
      setError(
        "Camera or microphone permission timed out. Dismiss the browser prompt and try again.",
      );
    }, 30_000);
    try {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error(
          "Camera recording needs a secure browser with MediaRecorder support. You can still use the local canvas recording lab.",
        );
      release.current = claimMicrophone(stream);
      const media = await navigator.mediaDevices.getUserMedia({
        video: camera
          ? {
              deviceId: { exact: camera },
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
            }
          : { width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } },
        audio: {
          ...(microphone ? { deviceId: { exact: microphone } } : {}),
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (epoch.current !== id) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      if (video.current) video.current.srcObject = media;
      media.getTracks().forEach((track) =>
        track.addEventListener(
          "ended",
          () => {
            if (epoch.current !== id) return;
            setError("A recording device disconnected. Reconnect it and enable preview again.");
            if (activeTake.current)
              void activeTake.current
                .stop("A recording device disconnected.")
                .catch(() => undefined);
            clearCapture();
            setPreview(false);
          },
          { once: true },
        ),
      );
      try {
        const context = new AudioContext();
        audio.current = context;
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        context.createMediaStreamSource(media).connect(analyser);
        const bytes = new Uint8Array(analyser.frequencyBinCount);
        meter.current = setInterval(() => {
          analyser.getByteTimeDomainData(bytes);
          const power = bytes.reduce((sum, value) => sum + (value - 128) ** 2, 0) / bytes.length;
          setLevel(Math.min(100, Math.round(Math.sqrt(power) * 3)));
        }, 100);
      } catch {
        /* A supported recording can continue if the level analyser is unavailable. */
      }
      setPreview(true);
      const items = await navigator.mediaDevices.enumerateDevices();
      if (epoch.current === id) setDevices(items);
    } catch (cause) {
      if (epoch.current !== id) return;
      clearCapture();
      setPreview(false);
      setLevel(0);
      setError(
        cause instanceof DOMException && ["NotAllowedError", "SecurityError"].includes(cause.name)
          ? "Camera or microphone permission was denied. Allow access in this browser, then enable preview again."
          : cause instanceof DOMException &&
              ["NotFoundError", "OverconstrainedError"].includes(cause.name)
            ? "The selected camera or microphone is unavailable. Choose another device and try again."
            : cause instanceof Error
              ? cause.message
              : "Your recording devices could not start.",
      );
    } finally {
      clearTimeout(timeout);
      if (epoch.current === id) setPending(false);
    }
  }
  async function record() {
    if (!stream.current || activeTake.current || recording) return;
    const id = epoch.current,
      started = performance.now();
    setError("");
    setNotice("");
    setSeconds(0);
    try {
      const mime = chooseRecordingMime((type) => MediaRecorder.isTypeSupported(type));
      if (!mime)
        throw new Error(
          "This browser has no supported video recording format. Try another browser.",
        );
      const recorder = new MediaRecorder(stream.current, {
        mimeType: mime,
        videoBitsPerSecond: 1_500_000,
        audioBitsPerSecond: 96_000,
      });
      const result = beginLocalRecording(recorder, stream.current.getTracks(), 60_000);
      activeTake.current = result;
      setRecording(true);
      timer.current = setInterval(
        () => setSeconds(Math.floor((performance.now() - started) / 1000)),
        200,
      );
      const completed = await result.result;
      if (epoch.current !== id) return;
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
      const url = URL.createObjectURL(completed.blob);
      blobUrl.current = url;
      setTake({
        blob: completed.blob,
        url,
        extension: completed.extension,
        id: crypto.randomUUID(),
      });
      setNotice("Recording ready. Save it locally or add it to a connected project.");
    } catch (cause) {
      if (epoch.current === id)
        setError(cause instanceof Error ? cause.message : "The recording could not finish.");
    } finally {
      if (epoch.current === id) {
        activeTake.current = null;
        clearCapture();
        setRecording(false);
        setStopping(false);
        setPreview(false);
        setLevel(0);
      }
    }
  }
  async function attach() {
    if (!take || !projectId || upload.current) return;
    setError("");
    setNotice("");
    setUploading(true);
    const controller = new AbortController();
    upload.current = controller;
    try {
      if (take.blob.size > 20 * 1024 * 1024)
        throw new Error(
          "This take exceeds the 20 MiB project upload limit. Save it locally or record a shorter take.",
        );
      const response = await fetch(
        `/api/v1/workspace/recordings?projectId=${projectId}&idempotencyKey=${take.id}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": take.blob.type.split(";")[0] },
          body: take.blob,
          signal: controller.signal,
        },
      );
      if (response.status === 401 || response.status === 403) {
        projects.revoke();
        setProjectId("");
        throw new Error(
          "Project access changed. Reopen an authorized project before adding this take. Your local recording is retained.",
        );
      }
      const parsed = apiResultSchema(z.object({ asset: AssetSummarySchema })).safeParse(
        await response.json(),
      );
      if (controller.signal.aborted) return;
      if (!parsed.success)
        throw new Error(
          "The upload response was interrupted. Keep this take and retry with the same recording.",
        );
      if (!parsed.data.ok) throw new Error(parsed.data.error.message);
      if (
        !response.ok ||
        parsed.data.data.asset.projectId !== projectId ||
        parsed.data.data.asset.id !== take.id
      )
        throw new Error(
          "The saved asset did not match this take. Refresh the project library before retrying.",
        );
      setNotice("Recording added to the project asset library.");
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "The take could not be uploaded. It remains available locally.",
        );
    } finally {
      if (upload.current === controller) {
        upload.current = null;
        setUploading(false);
      }
    }
  }
  return (
    <div className={styles.page}>
      <PageHeader
        title="Recording Lab"
        description="Record a camera take with explicit microphone and camera permission. Keep the original, then add it to a project."
      />
      <div className={styles.split}>
        <section className={styles.card}>
          <div className={own.preview}>
            <video ref={video} autoPlay playsInline muted aria-label="Camera preview" />
            {!preview && (
              <div className={own.previewEmpty}>
                <Camera size={36} />
                <p>Your camera is off</p>
                <span>Enable preview when you&apos;re ready.</span>
              </div>
            )}
          </div>
          <div className={styles.toolbar}>
            <label className={styles.field}>
              Camera
              <select
                value={camera}
                onChange={(e) => setCamera(e.target.value)}
                disabled={preview || pending || recording}
              >
                <option value="">Default camera</option>
                {devices
                  .filter((device) => device.kind === "videoinput")
                  .map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
              </select>
            </label>
            <label className={styles.field}>
              Microphone
              <select
                value={microphone}
                onChange={(e) => setMicrophone(e.target.value)}
                disabled={preview || pending || recording}
              >
                <option value="">Default microphone</option>
                {devices
                  .filter((device) => device.kind === "audioinput")
                  .map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className={own.level}>
            <Mic size={16} />
            <meter aria-label="Microphone level" min={0} max={100} value={level} />
            <span>{`${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}</span>
          </div>
          <div className={styles.actions}>
            {!preview ? (
              <button className={styles.secondary} onClick={() => void enable()} disabled={pending}>
                {pending ? "Waiting for permission…" : "Enable preview"}
              </button>
            ) : (
              !recording && (
                <button
                  className={styles.secondary}
                  onClick={() => {
                    epoch.current++;
                    clearCapture();
                    setPreview(false);
                    setLevel(0);
                  }}
                >
                  Turn devices off
                </button>
              )
            )}
            <button
              className={styles.button}
              disabled={!preview || recording || pending}
              onClick={() => void record()}
            >
              <Circle size={16} />
              Start recording
            </button>
            {recording && (
              <button
                className={styles.secondary}
                disabled={stopping}
                onClick={() => {
                  setStopping(true);
                  void activeTake.current?.stop();
                }}
              >
                <Square size={16} />
                {stopping ? "Finishing…" : "Stop recording"}
              </button>
            )}
          </div>
          <p className={styles.muted}>
            Takes stop after 60 seconds. Project uploads are limited to 20 MiB. Camera and audio
            tracks are released after each take or when you leave.
          </p>
        </section>
        <section className={styles.card}>
          <h2>Your recording</h2>
          {take ? (
            <>
              <video
                className={own.playback}
                controls
                playsInline
                src={take.url}
                aria-label="Recorded take"
              />
              <p>
                {(take.blob.size / 1024 / 1024).toFixed(2)} MiB · {take.blob.type.split(";")[0]}
              </p>
              <a
                href={take.url}
                download={`shape-recording.${take.extension}`}
                className={styles.button}
              >
                <Download size={16} />
                Save recording
              </a>
            </>
          ) : (
            <p className={styles.muted}>
              Your completed take appears here. Nothing records until you enable devices and choose
              Start recording.
            </p>
          )}
          <h3>Add to a project</h3>
          {!projects.configured && (
            <ServiceNotice message="Connect your workspace to store recordings privately. Local recording and download are available now." />
          )}
          <label className={styles.field}>
            Recording project
            <select
              aria-label="Recording project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={uploading}
            >
              <option value="">Choose a project</option>
              {projects.data?.projects
                .filter((p) => p.canEdit)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            className={styles.secondary}
            disabled={!take || !projectId || uploading || !projects.configured}
            onClick={() => void attach()}
          >
            {uploading ? "Adding recording…" : "Add recording to project"}
          </button>
          <p className={styles.muted}>
            Recorded media is a private project asset. It is not automatically published or
            submitted for review.
          </p>
          <Link href="/studio/feasibility">
            Open the preserved mono canvas recording experiment
          </Link>
        </section>
      </div>
      {recording && <p role="status">Recording…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
