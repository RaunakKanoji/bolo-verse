"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AssetSummary } from "@/lib/contracts/assets";
import { CreationAccessError } from "@/features/creation/creation-http";
import {
  uploadProjectImage,
  type ImageUploadPhase,
} from "@/features/creation/upload-reference-image";
import { listProjectImages } from "./project-images";
import ImageThumbnail from "./ProjectImageThumbnail";
import ProjectDeliverables from "./ProjectDeliverables";
import styles from "./project-images.module.css";

type Props = { projectId: string; canEdit: boolean };
export default function ProjectImageLibrary(props: Props) {
  const { isLoaded, sessionId } = useAuth();
  if (!isLoaded) return <p role="status">Checking project image session…</p>;
  if (!sessionId) return <p role="status">Sign in to view project images.</p>;
  return (
    <ImageLibrarySession key={`${sessionId}:${props.projectId}:${props.canEdit}`} {...props} />
  );
}
const phases: ImageUploadPhase[] = ["preparing", "reserving", "uploading", "verifying"];
const phaseLabels = {
  preparing: "Checking image",
  reserving: "Reserving private upload",
  uploading: "Transferring image",
  verifying: "Verifying image on server",
};
function ImageLibrarySession({ projectId, canEdit }: Props) {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [choice, setChoice] = useState<{ file: File; key: string; attempted: boolean } | null>(
    null,
  );
  const [phase, setPhase] = useState<ImageUploadPhase | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [previewRevision, setPreviewRevision] = useState(0);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const active = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const catalog = useRef<AbortController | null>(null);
  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
      catalog.current?.abort();
    };
  }, []);
  const revoke = useCallback(() => {
    pending.current?.abort();
    catalog.current?.abort();
    pending.current = null;
    catalog.current = null;
    setAssets([]);
    setSelectedId(null);
    setChoice(null);
    setPhase(null);
    setLoading(false);
    setError("");
    setNotice("");
    setDenied(true);
  }, []);
  useEffect(() => {
    catalog.current?.abort();
    const controller = new AbortController();
    catalog.current = controller;
    void listProjectImages(projectId, controller.signal)
      .then((result) => {
        if (!active.current || controller.signal.aborted || catalog.current !== controller) return;
        setAssets(result.assets);
        setHasMore(result.hasMore);
        setPage(0);
        setPreviewRevision((value) => value + 1);
      })
      .catch((reason: unknown) => {
        if (!active.current || controller.signal.aborted) return;
        if (reason instanceof CreationAccessError) revoke();
        else
          setError(
            "Project images could not be refreshed. Existing images and your selected file are retained. Check your connection and retry.",
          );
      })
      .finally(() => {
        if (active.current && catalog.current === controller) {
          catalog.current = null;
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [projectId, revoke, catalogAttempt]);
  function refresh() {
    setLoading(true);
    setError("");
    setCatalogAttempt((value) => value + 1);
  }
  async function upload() {
    if (!choice || !canEdit || denied || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setError("");
    setNotice("");
    setChoice({ ...choice, attempted: true });
    try {
      const asset = await uploadProjectImage(projectId, choice.file, controller.signal, {
        idempotencyKey: choice.key,
        onPhase: (value) => {
          if (active.current && pending.current === controller && !controller.signal.aborted)
            setPhase(value);
        },
      });
      if (!active.current || controller.signal.aborted || pending.current !== controller) return;
      catalog.current?.abort();
      catalog.current = null;
      setLoading(false);
      setAssets((current) => [asset, ...current.filter(({ id }) => id !== asset.id)]);
      setPage(0);
      setSelectedId(asset.id);
      setChoice(null);
      setNotice("Image uploaded and ready.");
    } catch (reason) {
      if (!active.current || controller.signal.aborted || pending.current !== controller) return;
      if (reason instanceof CreationAccessError) revoke();
      else
        setError(
          reason instanceof TypeError
            ? "The upload connection was interrupted. Retry the same image or refresh project images to check its status."
            : reason instanceof Error
              ? reason.message
              : "The image could not upload. Retry the same image.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setPhase(null);
      }
    }
  }
  function cancel() {
    pending.current?.abort();
    pending.current = null;
    setPhase(null);
    setError("");
    setNotice(
      "Upload cancelled. Refresh to check whether verification already completed, or retry the same file.",
    );
  }
  const selected = assets.find(({ id }) => id === selectedId);
  const displayed = assets.slice(page * 4, page * 4 + 4);
  return (
    <section className={styles.library} aria-label="Project images">
      <header>
        <div>
          <h2>Project images</h2>
          <p>
            Private ready images for this project. Uploads do not generate images or call an AI
            provider.
          </p>
        </div>
        {!denied && (
          <button type="button" disabled={loading || !!phase} onClick={() => void refresh()}>
            Refresh project images
          </button>
        )}
      </header>
      {denied ? (
        <p role="alert">
          Project image access is unavailable. Reopen this project with an authorized account.
        </p>
      ) : (
        <>
          {canEdit ? (
            <div className={styles.upload}>
              <label>
                Choose project image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={!!phase}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setChoice({ file, key: crypto.randomUUID(), attempted: false });
                      setError("");
                      setNotice("");
                    }
                    event.target.value = "";
                  }}
                />
              </label>
              <p>
                Static PNG, JPEG or WebP up to 20 MiB, 8192 pixels per side and 16 megapixels. Only
                verified images become ready.
              </p>
              {choice && <p>Selected file: {choice.file.name}</p>}
              <button
                type="button"
                disabled={!choice || !!phase || loading}
                onClick={() => void upload()}
              >
                {choice?.attempted ? "Retry upload" : "Upload image"}
              </button>
              {phase && (
                <>
                  <p role="status">
                    {phaseLabels[phase]} — step {phases.indexOf(phase) + 1} of 4
                  </p>
                  <progress
                    aria-label="Image upload steps"
                    value={phases.indexOf(phase) + 1}
                    max={4}
                  />
                  <button type="button" onClick={cancel}>
                    Cancel upload
                  </button>
                </>
              )}
            </div>
          ) : (
            <p>Read-only project images. An editor can upload new images.</p>
          )}
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {loading && <p role="status">Loading project images…</p>}
          {!loading && !assets.length && <p>No ready project images yet.</p>}
          <ul className={styles.grid}>
            {displayed.map((asset, index) => {
              const previewBytes = displayed
                .slice(0, index + 1)
                .reduce((total, item) => total + item.byteSize, 0);
              const number = page * 4 + index + 1;
              return (
                <li key={`${asset.id}:${previewRevision}`}>
                  {previewBytes <= 40 * 1024 * 1024 ? (
                    <ImageThumbnail asset={asset} number={number} onAccessLost={revoke} />
                  ) : (
                    <p>Preview budget reached. Open the selected image to view it.</p>
                  )}
                  <button
                    type="button"
                    aria-label={`Select project image ${number}`}
                    aria-pressed={selectedId === asset.id}
                    onClick={() => setSelectedId(asset.id)}
                  >
                    Project image {number}
                  </button>
                  <small>
                    {asset.width} × {asset.height} · {asset.mimeType}
                  </small>
                </li>
              );
            })}
          </ul>
          {assets.length > 4 && (
            <nav aria-label="Image pages">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous images
              </button>
              <button
                type="button"
                disabled={(page + 1) * 4 >= assets.length}
                onClick={() => setPage((value) => value + 1)}
              >
                Next images
              </button>
            </nav>
          )}
          {hasMore && <p>Showing images from the first 100 ready assets.</p>}
          {selected && (
            <p className={styles.selection}>
              Selected: {selected.width} × {selected.height} {selected.mimeType}.{" "}
              <Link href={`/app/projects/${projectId}/assets/${selected.id}`}>
                Open selected image
              </Link>
              . Selection stays in this tab; it does not publish or approve an image.
            </p>
          )}
          {canEdit && (
            <ProjectDeliverables
              key={selected?.id ?? "none"}
              projectId={projectId}
              selectedAsset={selected ?? null}
              onAccessLost={revoke}
              selectionBusy={!!phase || loading}
            />
          )}
          <p>
            <a href={`/workspace/${projectId}`}>Open 3D editor</a> and use Refresh assets to place
            ready project images.
          </p>
        </>
      )}
    </section>
  );
}
