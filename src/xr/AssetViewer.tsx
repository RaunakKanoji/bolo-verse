"use client";

import { useEffect, useState } from "react";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";

export default function AssetViewer({ assetId, mimeType }: { assetId: string; mimeType: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/xr/assets/${assetId}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result?.error?.message || "This protected asset could not be loaded.");
        }
        if (Number(response.headers.get("Content-Length")) > MAX_PREVIEW_BYTES)
          throw new Error("This asset exceeds the preview limit.");
        const blob = await response.blob();
        if (blob.size > MAX_PREVIEW_BYTES) throw new Error("This asset exceeds the preview limit.");
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (reason) {
        if (active && !controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : "The asset could not load.");
      }
    })();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetId]);
  if (error)
    return (
      <p role="alert" className="my-3 text-sm text-red-800">
        {error}
      </p>
    );
  if (!url)
    return (
      <p role="status" className="my-3 text-sm">
        Loading protected asset…
      </p>
    );
  return (
    <div className="my-3 w-full space-y-3">
      {mimeType.startsWith(
        "image/",
      ) /* Authorized temporary blob; Next Image optimization cannot access it. */ && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Selected project asset"
          className="max-h-96 w-full rounded-lg object-contain"
        />
      )}
      {mimeType.startsWith("video/") && (
        <video
          src={url}
          controls
          preload="metadata"
          aria-label="Project video preview"
          className="max-h-96 w-full rounded-lg"
        />
      )}
      {mimeType.startsWith("model/") && (
        <p className="text-sm">
          This model is available for spatial preview. Open the Spatial Studio to inspect it in 3D.
        </p>
      )}
      {mimeType === "application/pdf" && (
        <p className="text-sm">PDF document. Download to open it in your document viewer.</p>
      )}
      <a
        className="text-sm font-semibold text-blue-700 underline"
        href={url}
        download={`project-asset-${assetId}${mimeType === "application/pdf" ? ".pdf" : ""}`}
      >
        Download asset
      </a>
    </div>
  );
}
