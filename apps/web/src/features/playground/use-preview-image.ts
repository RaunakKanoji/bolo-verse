"use client";

import { useEffect, useState, type RefObject } from "react";
import { imageBaseCanvas, originalEdits, type EditSettings } from "./image-processing";

export function usePreviewImage(
  source: RefObject<HTMLImageElement | null>,
  sourceUrl: string,
  sample: boolean,
  edits: EditSettings,
) {
  const key = `${sourceUrl}:${edits.crop}:${edits.rotation}:${edits.sharpness}`;
  const [result, setResult] = useState({ key: "", url: "", ratio: 1, error: "" });
  useEffect(() => {
    let active = true;
    if (!sourceUrl) return;
    // Scheduling avoids synchronous state changes and lets superseded work be discarded.
    void Promise.resolve().then(() => {
      if (!active || !source.current) return;
      try {
        const canvas = imageBaseCanvas(
          source.current,
          {
            ...originalEdits,
            crop: edits.crop,
            rotation: edits.rotation,
            sharpness: edits.sharpness,
          },
          sample,
          1024,
        );
        if (active)
          setResult({
            key,
            url: canvas.toDataURL("image/png"),
            ratio: canvas.width / canvas.height,
            error: "",
          });
      } catch (reason) {
        if (active)
          setResult({
            key,
            url: "",
            ratio: 1,
            error: reason instanceof Error ? reason.message : "Preview could not be prepared.",
          });
      }
    });
    return () => {
      active = false;
    };
  }, [source, sourceUrl, sample, key, edits.crop, edits.rotation, edits.sharpness]);
  return result.key === key ? result : { key, url: "", ratio: 1, error: "" };
}
