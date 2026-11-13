"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AssetSummary } from "@/lib/contracts/assets";
import type { VideoEditorDocument } from "@/lib/contracts/video-editor";
import { CreationAccessError } from "@/features/creation/creation-http";
import { documentFromSdk, documentToSdk, type PreviewSources } from "./sdk-document";
import { loadVideoPreview } from "./private-preview";
import styles from "./video-editor.module.css";
// The SDK uses process-wide Pixi caches and document selectors. Serialize complete
// owned lifetimes, including an asynchronous load superseded by React StrictMode.
let previousOwner: Promise<void> = Promise.resolve();
type Runtime = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  getEdit: () => unknown;
  dispose: () => void;
};
export default function ShotstackEditor({
  document,
  assets,
  onChange,
  onError,
  onAccessError,
}: {
  document: VideoEditorDocument;
  assets: AssetSummary[];
  onChange: (document: VideoEditorDocument) => void;
  onError: (message: string) => void;
  onAccessError: () => void;
}) {
  const canvasHost = useRef<HTMLDivElement>(null),
    timelineHost = useRef<HTMLDivElement>(null),
    runtime = useRef<Runtime | null>(null);
  const callbacks = useRef({ onChange, onError, onAccessError });
  useLayoutEffect(() => {
    callbacks.current = { onChange, onError, onAccessError };
  }, [onChange, onError, onAccessError]);
  const [status, setStatus] = useState("Loading Shotstack Studio…"),
    [retry, setRetry] = useState(0),
    [ready, setReady] = useState(false);
  const fingerprint = JSON.stringify(document),
    catalogFingerprint = JSON.stringify(
      assets.map((asset) => [asset.id, asset.byteSize, asset.mimeType, asset.contentUrl]),
    );
  useEffect(() => {
    const controller = new AbortController(),
      sources: PreviewSources = new Map();
    let edit: Runtime | null = null,
      canvas: { dispose: () => void; resize: () => void; zoomToFit: () => void } | null = null,
      timeline: { dispose: () => void } | null = null,
      observer: ResizeObserver | null = null;
    const unsubscribers: (() => void)[] = [];
    let pixiAssets: (typeof import("pixi.js"))["Assets"] | null = null;
    const host = canvasHost.current,
      timelineElement = timelineHost.current;
    async function sdkLoad(promise: Promise<unknown>) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              timedOut = true;
              controller.abort();
              reject(new Error("The video preview timed out. Restore the valid preview to retry."));
            }, 20000);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    }
    let timedOut = false;
    let disposed = false,
      release: () => void = () => {};
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const predecessor = previousOwner;
    const initialize = predecessor
      .catch(() => undefined)
      .then(async () => {
        if (controller.signal.aborted) return;
        setReady(false);
        setStatus("Preparing private media…");
        const selected = [...new Set(document.clips.map((clip) => clip.assetId))].map((id) =>
          assets.find((asset) => asset.id === id),
        );
        if (
          selected.some((asset) => !asset) ||
          selected.reduce((sum, asset) => sum + (asset?.byteSize ?? 0), 0) > 100 * 1024 * 1024
        )
          throw new Error(
            "The selected sources are unavailable or exceed the 100 MiB preview budget.",
          );
        for (const asset of selected) {
          controller.signal.throwIfAborted();
          const url = await loadVideoPreview(asset!, controller.signal);
          if (controller.signal.aborted) {
            URL.revokeObjectURL(url);
            return;
          }
          sources.set(asset!.id, { url, mimeType: asset!.mimeType });
        }
        // A dynamic import keeps the actual SDK and WebGL initialization browser-only.
        const sdk = await import("@shotstack/shotstack-studio");
        if (controller.signal.aborted) return;
        pixiAssets = (await import("pixi.js")).Assets;
        // Blob URLs have no extension. Select Pixi's image parser explicitly,
        // so the real SDK can reuse the validated image texture from its cache.
        for (const source of sources.values())
          if (source.mimeType.startsWith("image/")) {
            await sdkLoad(pixiAssets.load({ src: source.url, loadParser: "loadTextures" }));
            if (controller.signal.aborted) return;
          }
        setStatus("Loading Shotstack canvas and timeline…");
        const template = documentToSdk(document, sources);
        // Pinned 2.31.0 exposes dispose at runtime but strips its @internal declaration.
        const activeEdit = new sdk.Edit(
          template as ConstructorParameters<typeof sdk.Edit>[0],
        ) as InstanceType<typeof sdk.Edit> & { dispose(): void };
        edit = activeEdit;
        runtime.current = activeEdit;
        const activeCanvas = new sdk.Canvas(activeEdit);
        canvas = activeCanvas;
        await sdkLoad(activeCanvas.load());
        if (controller.signal.aborted) return;
        let clipFailed = false;
        unsubscribers.push(
          activeEdit.events.on("clip:loadFailed", () => {
            if (controller.signal.aborted) return;
            clipFailed = true;
            callbacks.current.onError(
              "A private clip could not be decoded. Remove it or reload the preview.",
            );
          }),
        );
        await sdkLoad(activeEdit.load());
        if (clipFailed)
          throw new Error("A private clip could not be decoded. Remove it or reload the preview.");
        if (controller.signal.aborted) return;
        if (!timelineHost.current) throw new Error("The video timeline is unavailable.");
        const activeTimeline = new sdk.Timeline(activeEdit, timelineHost.current);
        timeline = activeTimeline;
        await sdkLoad(activeTimeline.load());
        if (controller.signal.aborted) return;
        activeCanvas.resize();
        activeCanvas.zoomToFit();
        const inspect = () => {
          if (controller.signal.aborted) return;
          try {
            const next = documentFromSdk(activeEdit.getEdit(), document, sources);
            if (JSON.stringify(next) !== fingerprint) callbacks.current.onChange(next);
          } catch (cause) {
            activeEdit.pause();
            callbacks.current.onError(
              cause instanceof Error
                ? cause.message
                : "Unsupported editor change. Restore the valid preview to continue.",
            );
          }
        };
        unsubscribers.push(activeEdit.events.on("edit:changed", inspect));
        unsubscribers.push(
          activeEdit.events.on("clip:loadFailed", () => {
            if (controller.signal.aborted) return;
            callbacks.current.onError(
              "A private clip could not be decoded. Remove the source or reload its preview.",
            );
          }),
        );
        if (canvasHost.current) {
          observer = new ResizeObserver(() => {
            if (!controller.signal.aborted) {
              activeCanvas.resize();
              activeCanvas.zoomToFit();
            }
          });
          observer.observe(canvasHost.current);
        }
        // Validate actual SDK serialization before allowing a private save or render.
        documentFromSdk(activeEdit.getEdit(), document, sources);
        callbacks.current.onError("");
        setReady(true);
        setStatus("Shotstack Studio ready");
      })
      .catch(async (cause) => {
        if (controller.signal.aborted && !timedOut) {
          await dispose();
          return;
        }
        if (cause instanceof CreationAccessError) callbacks.current.onAccessError();
        else {
          const message =
            cause instanceof Error ? cause.message : "The video preview could not be initialized.";
          setStatus(message);
          callbacks.current.onError(message);
        }
        await dispose();
      });
    previousOwner = initialize.then(() => released);
    async function dispose() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      for (const resource of [timeline, edit, canvas]) {
        try {
          resource?.dispose();
        } catch {
          /* A superseded SDK load can be only partially initialized. */
        }
      }
      if (runtime.current === edit) runtime.current = null;
      try {
        if (pixiAssets)
          for (const source of sources.values())
            if (pixiAssets.cache.has(source.url)) await pixiAssets.unload(source.url);
      } finally {
        sources.forEach((source) => URL.revokeObjectURL(source.url));
        sources.clear();
        host?.replaceChildren();
        timelineElement?.replaceChildren();
        release();
      }
    }
    return () => {
      controller.abort();
      edit?.pause();
      // Revoke private capabilities immediately even when SDK initialization is pending.
      sources.forEach((source) => URL.revokeObjectURL(source.url));
      host?.replaceChildren();
      timelineElement?.replaceChildren();
      void initialize.finally(dispose);
    };
    // Each valid edit snapshot gets one owned runtime; late SDK loads are disposed before another starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, catalogFingerprint, retry]);
  return (
    <div className={styles.sdk} data-shotstack-editor>
      <div className={styles.toolbar}>
        <span role="status">{status}</span>
        <div className={styles.actions}>
          <button disabled={!ready} onClick={() => runtime.current?.play()}>
            Play preview
          </button>
          <button disabled={!ready} onClick={() => runtime.current?.pause()}>
            Pause preview
          </button>
          <button
            onClick={() => {
              callbacks.current.onError("");
              setRetry((value) => value + 1);
            }}
          >
            Restore valid preview
          </button>
        </div>
      </div>
      <div
        ref={canvasHost}
        data-shotstack-studio
        className={styles.canvas}
        aria-label="Shotstack video canvas"
      />
      <div
        ref={timelineHost}
        data-shotstack-timeline
        className={styles.timeline}
        aria-label="Shotstack draggable timeline"
      />
    </div>
  );
}
