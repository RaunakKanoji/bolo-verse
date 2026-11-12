"use client";

import { useEffect, useRef, useState } from "react";
import { createValidatedCanvasImageUrl } from "@/features/workspace/useImageCanvas";
import { Clock3, Download, ImageIcon, RefreshCw } from "lucide-react";
import type { useImageGeneration } from "./use-image-generation";
import { CreationAccessError } from "./creation-http";
import styles from "./creation.module.css";

type Generation = ReturnType<typeof useImageGeneration>;
const labels = {
  queued: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
  cancelled: "Cancelled",
};
export function GenerationHistory({
  generation,
  projectId,
  canEdit,
  selectedAssetId,
  select,
}: {
  generation: Generation;
  projectId?: string;
  canEdit: boolean;
  selectedAssetId?: string;
  select(id: string): void;
}) {
  const active = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const downloads = useRef(new Set<string>());
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    active.current = true;
    const urls = downloads.current;
    return () => {
      active.current = false;
      pending.current?.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);
  async function download(assetId: string, jobId: string) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setDownloading(jobId);
    setDownloadError("");
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(`/api/v1/assets/${assetId}/content`, {
        signal: controller.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401 || response.status === 403)
        throw new CreationAccessError(response.status);
      if (!response.ok)
        throw new Error(
          "This generated image is no longer available. Check your access and refresh history.",
        );
      const blob = await response.blob();
      const url = await createValidatedCanvasImageUrl(blob, controller.signal);
      if (!active.current) {
        URL.revokeObjectURL(url);
        return;
      }
      downloads.current.add(url);
      const extension =
        blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `shape-generated-${jobId}.${extension}`;
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        downloads.current.delete(url);
      }, 1000);
    } catch (reason) {
      if (reason instanceof CreationAccessError) generation.revokeAccess();
      if (active.current)
        setDownloadError(
          reason instanceof Error ? reason.message : "The image could not download. Try again.",
        );
    } finally {
      clearTimeout(timer);
      pending.current = null;
      if (active.current) setDownloading("");
    }
  }
  return (
    <section className={styles.history} aria-label="Generation history">
      <header>
        <h2>
          <Clock3 size={16} />
          Generation history
        </h2>
        {projectId && (
          <button
            type="button"
            aria-label="Refresh generation history"
            disabled={generation.history.isFetching}
            onClick={() => void generation.history.refetch()}
          >
            <RefreshCw size={15} />
          </button>
        )}
      </header>
      {!projectId ? (
        <p>No generation jobs. Open a project to keep your generated images here.</p>
      ) : generation.history.isError ? (
        <p role="alert">
          Generation history could not load. Refresh to recover the current job status.
        </p>
      ) : generation.history.isPending ? (
        <p role="status">Loading project history…</p>
      ) : !generation.history.data?.jobs.length ? (
        <p>No generation jobs. Your project images will appear here.</p>
      ) : null}
      {downloadError && (
        <p role="alert" className={styles.error}>
          {downloadError}
        </p>
      )}
      <div className={styles.jobs}>
        {!generation.history.isError &&
          generation.history.data?.jobs.map((job) => (
            <article key={job.id} className={styles.job}>
              <div className={styles.jobHeader}>
                <span className={styles.state} data-status={job.status}>
                  {labels[job.status]}
                </span>
                <small>{job.aspectRatio}</small>
              </div>
              <p className={styles.prompt}>{job.prompt}</p>
              {job.errorMessage && (
                <p role="status" className={styles.error}>
                  {job.errorMessage}
                </p>
              )}
              {job.status === "ready" && job.outputAssetId && (
                <>
                  <button
                    type="button"
                    className={styles.result}
                    aria-label="Use generated image"
                    aria-pressed={selectedAssetId === job.outputAssetId}
                    onClick={() => select(job.outputAssetId!)}
                  >
                    {/* The API authorizes each private image read; no provider/storage URL enters markup. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/v1/assets/${job.outputAssetId}/content`}
                      alt="Generated project image thumbnail"
                      loading="lazy"
                    />
                    <span>
                      <ImageIcon size={14} />
                      Use image
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.download}
                    disabled={Boolean(downloading)}
                    onClick={() => void download(job.outputAssetId!, job.id)}
                  >
                    <Download size={14} />
                    {downloading === job.id ? "Preparing download…" : "Download original image"}
                  </button>
                </>
              )}
              {canEdit && ["queued", "processing"].includes(job.status) && (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={generation.busy}
                  onClick={() => void generation.cancel(job.id)}
                >
                  Cancel generation
                </button>
              )}
              {canEdit && ["failed", "cancelled"].includes(job.status) && (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    generation.busy || generation.capabilities.data?.availability !== "configured"
                  }
                  onClick={() => {
                    if (
                      window.confirm(
                        "Create a new generation from this request? This can incur another provider charge.",
                      )
                    )
                      void generation.generate(
                        {
                          prompt: job.prompt,
                          modelId: job.modelId,
                          aspectRatio: job.aspectRatio,
                          referenceAssetId: job.referenceAssetId,
                        },
                        true,
                      );
                  }}
                >
                  Retry as new generation
                </button>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}
