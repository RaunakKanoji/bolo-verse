"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Box, Film, Maximize, Minimize, Minus, Plus, Scan, Volume2 } from "lucide-react";
import type { CreativeMode } from "@/lib/contracts/shape";
import { filterFor, originalEdits, type EditSettings } from "./image-processing";
import styles from "./playground.module.css";

type Props = {
  mode: CreativeMode;
  projectId?: string;
  url: string;
  ratio: number;
  name: string;
  sample: boolean;
  loading: boolean;
  error: string;
  edits: EditSettings;
  compare: boolean;
  zoom: number;
  pan: { x: number; y: number };
  setCompare(value: boolean): void;
  setZoom(value: number): void;
  setPan(x: number, y: number): void;
  fit(): void;
  retry(): void;
};
export function PreviewViewport({
  mode,
  projectId,
  url,
  ratio,
  name,
  sample,
  loading,
  error,
  edits,
  compare,
  zoom,
  pan,
  setCompare,
  setZoom,
  setPan,
  fit,
  retry,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; px: number; py: number } | null>(null);
  const [full, setFull] = useState(false);
  const [fullError, setFullError] = useState("");
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  async function fullscreen() {
    setFullError("");
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else setFullError("Fullscreen is unavailable in this browser.");
    } catch {
      setFullError("Fullscreen could not open. Keep working in the current preview.");
    }
  }
  const PlaceholderIcon = mode === "video" ? Film : mode === "audio" ? Volume2 : Box;
  const ready = mode === "image" && Boolean(url) && !loading && !error;
  return (
    <div ref={root} className={styles.previewPanel}>
      <div className={styles.previewHeading}>
        <div>
          <span className={styles.eyebrow}>
            {mode === "image"
              ? sample
                ? "Illustrative sample"
                : "Local image workspace"
              : "Creative preview"}
          </span>
          <h2>
            {mode === "image"
              ? name
              : `${mode === "model3d" ? "3D" : mode[0].toUpperCase() + mode.slice(1)} workspace`}
          </h2>
        </div>
        {mode === "image" && (
          <button
            type="button"
            className={styles.compareButton}
            disabled={!ready}
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
          >
            {compare ? "Show edits" : "Show original"}
          </button>
        )}
      </div>
      <div
        className={styles.viewport}
        tabIndex={ready ? 0 : undefined}
        aria-label={
          ready
            ? "Image viewport. Use plus or minus to zoom, arrow keys to pan, and zero to fit."
            : undefined
        }
        onKeyDown={(event) => {
          if (!ready || event.target !== event.currentTarget) return;
          if (
            ["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
              event.key,
            )
          )
            event.preventDefault();
          if (event.key === "+" || event.key === "=") setZoom(zoom + 0.25);
          if (event.key === "-") setZoom(zoom - 0.25);
          if (event.key === "0") fit();
          if (event.key === "ArrowLeft") setPan(pan.x - 30, pan.y);
          if (event.key === "ArrowRight") setPan(pan.x + 30, pan.y);
          if (event.key === "ArrowUp") setPan(pan.x, pan.y - 30);
          if (event.key === "ArrowDown") setPan(pan.x, pan.y + 30);
        }}
        onPointerDown={(event) => {
          if (!ready || event.button !== 0 || zoom <= 1) return;
          drag.current = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            px: pan.x,
            py: pan.y,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = drag.current;
          if (start?.id === event.pointerId)
            setPan(start.px + event.clientX - start.x, start.py + event.clientY - start.y);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        style={{ touchAction: zoom > 1 ? "none" : "auto" }}
      >
        {mode !== "image" ? (
          <div className={styles.emptyPreview}>
            <PlaceholderIcon size={42} strokeWidth={1.2} />
            <h3>A space for your next {mode === "model3d" ? "dimension" : mode}</h3>
            <p>
              Keep an idea in your prompt draft. Generation and preview for this mode are not
              connected yet.
            </p>
            {mode === "video" ? (
              <Link href="/studio/feasibility">Open the recording lab</Link>
            ) : mode === "model3d" ? (
              <Link href={projectId ? `/studio/xr/${projectId}` : "/xr/preview"}>
                Explore the Spatial Studio
              </Link>
            ) : (
              <Link href={projectId ? `/studio/xr/${projectId}` : "/studio/xr"}>
                Open the project voice assistant
              </Link>
            )}
          </div>
        ) : error ? (
          <div className={styles.emptyPreview}>
            <p role="alert">{error}</p>
            <button type="button" onClick={retry}>
              Retry image
            </button>
          </div>
        ) : loading || !url ? (
          <div className={styles.emptyPreview}>
            <span className={styles.loadingDot} />
            <p role="status">Preparing your canvas…</p>
          </div>
        ) : (
          <div
            className={styles.artworkFrame}
            style={
              {
                "--image-ratio": ratio,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              } as CSSProperties
            }
          >
            <div
              role="img"
              aria-label="Image adjustment preview"
              className={styles.artwork}
              style={{
                backgroundImage: `url("${url}")`,
                filter: filterFor(compare ? originalEdits : edits),
              }}
            />
          </div>
        )}
        {compare && ready && <span className={styles.originalBadge}>Original</span>}
      </div>
      <div className={styles.previewToolbar} role="group" aria-label="Preview controls">
        <button
          type="button"
          disabled={!ready || zoom <= 0.5}
          aria-label="Zoom out"
          onClick={() => setZoom(zoom - 0.25)}
        >
          <Minus size={16} />
        </button>
        <output aria-label="Preview zoom">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          disabled={!ready || zoom >= 4}
          aria-label="Zoom in"
          onClick={() => setZoom(zoom + 0.25)}
        >
          <Plus size={16} />
        </button>
        <span className={styles.toolbarDivider} />
        <button type="button" disabled={!ready} onClick={fit}>
          <Scan size={16} />
          Fit
        </button>
        <button
          type="button"
          onClick={() => void fullscreen()}
          aria-label={full ? "Exit fullscreen" : "Fullscreen preview"}
        >
          {full ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
        <span className={styles.toolbarHint}>Zoom to drag · Arrow keys to pan</span>
      </div>
      {fullError && (
        <p className={styles.error} role="status">
          {fullError}
        </p>
      )}
    </div>
  );
}
