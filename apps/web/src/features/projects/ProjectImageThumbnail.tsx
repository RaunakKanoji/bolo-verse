"use client";

import { useEffect, useState } from "react";
import type { AssetSummary } from "@/lib/contracts/assets";
import { CreationAccessError } from "@/features/creation/creation-http";
import { readProjectImage } from "./project-images";
import styles from "./project-images.module.css";

export default function ImageThumbnail({
  asset,
  number,
  label,
  onAccessLost,
}: {
  asset: AssetSummary;
  number: number;
  label?: string;
  onAccessLost: () => void;
}) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let owned = "";
    void readProjectImage(asset, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(result);
          return;
        }
        owned = result;
        setUrl(result);
        setFailed(false);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof CreationAccessError) onAccessLost();
        else setFailed(true);
      });
    return () => {
      controller.abort();
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [asset, attempt, onAccessLost]);
  return (
    <div className={styles.preview}>
      {url && (
        <>
          {/* Blob URLs are bounded, authenticated and owned by this component; no optimizer/cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label ?? `Project image ${number}`} onError={() => setFailed(true)} />
        </>
      )}
      {failed && (
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Retry preview {number}
        </button>
      )}
    </div>
  );
}
