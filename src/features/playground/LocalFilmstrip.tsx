"use client";

import type { RefObject } from "react";
import { Clock3, Layers3 } from "lucide-react";
import type { LocalSnapshot } from "./playground-state";
import { filterFor } from "./image-processing";
import { usePreviewImage } from "./use-preview-image";
import styles from "./playground.module.css";

function Thumbnail({
  snapshot,
  image,
  url,
  sample,
  restore,
}: {
  snapshot: LocalSnapshot;
  image: RefObject<HTMLImageElement | null>;
  url: string;
  sample: boolean;
  restore(): void;
}) {
  const preview = usePreviewImage(image, url, sample, snapshot.edits);
  return (
    <button
      type="button"
      className={styles.thumbnail}
      onClick={restore}
      aria-label={`Restore ${snapshot.label.toLowerCase()}`}
    >
      <span
        aria-hidden="true"
        style={{
          backgroundImage: preview.url ? `url("${preview.url}")` : undefined,
          filter: filterFor(snapshot.edits),
        }}
      />
      <strong>{snapshot.label}</strong>
      <small>
        {snapshot.edits.crop} · {snapshot.edits.rotation}°
      </small>
    </button>
  );
}
export function LocalFilmstrip({
  snapshots,
  image,
  url,
  sample,
  restore,
}: {
  snapshots: LocalSnapshot[];
  image: RefObject<HTMLImageElement | null>;
  url: string;
  sample: boolean;
  restore(id: number): void;
}) {
  return (
    <div className={styles.historyArea}>
      <section className={styles.localHistory} aria-label="Local image variants">
        <div className={styles.sectionHeading}>
          <h2>
            <Layers3 size={16} />
            Local variants
          </h2>
          <span>{snapshots.length}/8 · this tab only</span>
        </div>
        {snapshots.length ? (
          <div className={styles.filmstrip}>
            {snapshots.map((snapshot) => (
              <Thumbnail
                key={snapshot.id}
                snapshot={snapshot}
                image={image}
                url={url}
                sample={sample}
                restore={() => restore(snapshot.id)}
              />
            ))}
          </div>
        ) : (
          <p>Capture a local variant to revisit an edit. No variants yet.</p>
        )}
      </section>
      <section className={styles.generationHistory} aria-label="Generation history">
        <h2>
          <Clock3 size={16} />
          Generation history
        </h2>
        <p>
          No generation jobs. Results will appear here when generation and asset storage are
          connected.
        </p>
      </section>
    </div>
  );
}
