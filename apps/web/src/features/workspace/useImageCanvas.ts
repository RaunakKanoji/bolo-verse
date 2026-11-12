"use client";

import { useEffect, useRef, useState } from "react";
import { CreationAccessError } from "@/features/creation/creation-http";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";

/** Prepare a local URL only after the image passes the canvas import boundary. */
export async function createValidatedCanvasImageUrl(input: Blob, signal: AbortSignal) {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(input.type) ||
    input.size > MAX_PREVIEW_BYTES
  )
    throw new Error("This canvas accepts static PNG, JPEG, or WebP images up to 20 MiB.");
  signal.throwIfAborted();
  const bytes = new Uint8Array(await input.arrayBuffer());
  signal.throwIfAborted();
  // Validate header dimensions before Image.decode() can allocate pixel storage.
  validatePreviewAsset(bytes, input.type);
  return URL.createObjectURL(input);
}

export function useImageCanvas(assetId?: string, onAccessRevoked?: () => void) {
  const [upload, setUpload] = useState<File | null>(null);
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{
    assetId?: string;
    upload: File | null;
    revision: number;
    url: string;
    error: string;
  } | null>(null);
  const current =
    loaded?.assetId === assetId && loaded?.upload === upload && loaded?.revision === revision;
  const url = current ? loaded.url : "";
  const error = current ? loaded.error : "";
  const loading = !current;
  const name = upload?.name ?? (assetId ? "Project image" : "Botanical product study");
  const image = useRef<HTMLImageElement | null>(null);
  const sample = !assetId && !upload;
  useEffect(() => {
    const abort = new AbortController();
    let active = true;
    let owned = "";
    image.current = null;
    void (async () => {
      try {
        let source = "/studio/campaign-studies.png";
        if (upload) {
          owned = await createValidatedCanvasImageUrl(upload, abort.signal);
          source = owned;
        } else if (assetId) {
          const response = await fetch(`/api/xr/assets/${assetId}`, {
            signal: abort.signal,
            cache: "no-store",
          });
          if (response.status === 401 || response.status === 403) {
            onAccessRevoked?.();
            throw new CreationAccessError(response.status);
          }
          if (!response.ok)
            throw new Error("This project image is unavailable. Check access and try again.");
          const blob = await response.blob();
          owned = await createValidatedCanvasImageUrl(blob, abort.signal);
          source = owned;
        }
        if (!active || abort.signal.aborted) {
          if (owned) URL.revokeObjectURL(owned);
          owned = "";
          return;
        }
        const decoded = new Image();
        decoded.src = source;
        await decoded.decode();
        if (!active) return;
        if (
          decoded.naturalWidth * decoded.naturalHeight > 4096 * 4096 ||
          decoded.naturalWidth > 8192 ||
          decoded.naturalHeight > 8192
        )
          throw new Error("This image exceeds the canvas pixel limit. Use a smaller image.");
        image.current = decoded;
        setLoaded({ assetId, upload, revision, url: source, error: "" });
      } catch (reason) {
        if (owned) URL.revokeObjectURL(owned);
        owned = "";
        if (active && !abort.signal.aborted)
          setLoaded({
            assetId,
            upload,
            revision,
            url: "",
            error: reason instanceof Error ? reason.message : "The image could not load.",
          });
      }
    })();
    return () => {
      active = false;
      abort.abort();
      image.current = null;
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [assetId, upload, revision, onAccessRevoked]);
  return {
    image,
    url,
    error,
    name,
    loading,
    sample,
    localUpload: Boolean(upload),
    setUpload,
    retry: () => setRevision((v) => v + 1),
  };
}
