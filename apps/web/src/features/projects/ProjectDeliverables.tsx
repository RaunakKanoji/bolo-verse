"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AssetSummary } from "@/lib/contracts/assets";
import {
  DeliverableListSchema,
  DeliverableResultSchema,
  PublishDeliverableSchema,
  type Deliverable,
} from "@/lib/contracts/deliverables";
import { CreationAccessError, creationRequest } from "@/features/creation/creation-http";
import ImageThumbnail from "./ProjectImageThumbnail";
import ReviewFeedback, { DeferredReviewFeedback } from "./ReviewFeedback";
import styles from "./deliverables.module.css";

type Props = {
  projectId: string;
  selectedAsset: AssetSummary | null;
  onAccessLost: () => void;
  selectionBusy: boolean;
};
type RevisionContext = { parent: Deliverable; decisionId: string };
export default function ProjectDeliverables({
  projectId,
  selectedAsset,
  onAccessLost,
  selectionBusy,
}: Props) {
  const [versions, setVersions] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [revision, setRevision] = useState<RevisionContext | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const request = useRef<AbortController | null>(null);
  useLayoutEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void creationRequest(
      `/api/v1/projects/${projectId}/deliverables`,
      DeliverableListSchema,
      {},
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.deliverables.some((version) => version.projectId !== projectId))
          throw new Error();
        setVersions(result.deliverables);
        setHasMore(result.hasMore);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        if (reason instanceof CreationAccessError) onAccessLost();
        else {
          setError(
            "Publication history could not load. Refresh to check saved versions before retrying a publication.",
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [projectId, attempt, onAccessLost]);
  return (
    <section className={styles.history} aria-label="Published image versions">
      <header>
        <h2>Published image versions</h2>
        <button
          type="button"
          disabled={loading || open}
          onClick={() => {
            setLoading(true);
            setError("");
            setAttempt((value) => value + 1);
          }}
        >
          Refresh published versions
        </button>
      </header>
      <p>
        Publishing freezes this uploaded image and its source details. It does not approve it or
        grant client access.
      </p>
      <button
        type="button"
        disabled={!selectedAsset || loading || selectionBusy}
        onClick={() => {
          setRevision(null);
          setOpen(true);
        }}
      >
        Publish selected image
      </button>
      {!selectedAsset && <p>Select a ready uploaded image above to publish a version.</p>}
      {selectionBusy && (
        <p>Finish the image upload or library refresh before publishing a selection.</p>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading published versions…</p>
      ) : (
        !versions.length && <p>No image versions published yet.</p>
      )}
      <ol className={styles.versions}>
        {versions.map((version, index) => (
          <li key={version.deliverableId}>
            <h3>
              v{version.version} · {version.title}
            </h3>
            <p>Uploaded image · Published</p>
            {version.source.revision && (
              <p>Revision of v{version.source.revision.expectedVersion}</p>
            )}
            {index < 4 ? (
              <ReviewFeedback
                projectId={projectId}
                versionId={version.deliverableId}
                onAccessLost={onAccessLost}
                onRevise={(decisionId) => {
                  setRevision({ parent: version, decisionId });
                  setOpen(true);
                }}
                revisionDisabled={
                  !selectedAsset ||
                  selectedAsset.id === version.asset.id ||
                  loading ||
                  selectionBusy ||
                  open ||
                  versions.some(
                    (item) => item.source.revision?.supersedesVersionId === version.deliverableId,
                  )
                }
              />
            ) : (
              <DeferredReviewFeedback
                projectId={projectId}
                versionId={version.deliverableId}
                version={version.version}
                onAccessLost={onAccessLost}
                onRevise={(decisionId) => {
                  setRevision({ parent: version, decisionId });
                  setOpen(true);
                }}
                revisionDisabled={
                  !selectedAsset ||
                  selectedAsset.id === version.asset.id ||
                  loading ||
                  selectionBusy ||
                  open ||
                  versions.some(
                    (item) => item.source.revision?.supersedesVersionId === version.deliverableId,
                  )
                }
              />
            )}
            <time dateTime={version.publishedAt}>
              {new Date(version.publishedAt).toLocaleString()}
            </time>
            {version.caption && <p>{version.caption}</p>}
            {version.source.briefVersion && (
              <p>Source brief version {version.source.briefVersion}</p>
            )}
            {version.source.sceneRevision && (
              <p>
                Scene revision {version.source.sceneRevision} is context only; this image was not
                rendered from the scene.
              </p>
            )}
            {index < 4 &&
              versions
                .slice(0, index + 1)
                .reduce((total, item) => total + item.asset.byteSize, 0) <=
                40 * 1024 * 1024 && (
                <ImageThumbnail
                  asset={version.asset}
                  number={version.version}
                  label={`Published image v${version.version}`}
                  onAccessLost={onAccessLost}
                />
              )}
            <p>
              <a href={`/app/projects/${projectId}/assets/${version.asset.id}`}>
                Open image from v{version.version}
              </a>
            </p>
          </li>
        ))}
      </ol>
      {hasMore && <p>Showing the latest 50 uploaded-image versions.</p>}
      {open && selectedAsset && (
        <PublishDialog
          projectId={projectId}
          asset={selectedAsset}
          revision={revision ?? undefined}
          onAccessLost={onAccessLost}
          onDismiss={() => setOpen(false)}
          onPublished={(version) => {
            request.current?.abort();
            setLoading(false);
            setError("");
            setVersions((current) =>
              [version, ...current.filter((item) => item.deliverableId !== version.deliverableId)]
                .sort((a, b) => b.version - a.version)
                .slice(0, 50),
            );
            setNotice(
              `Published version ${version.version}.${revision ? " Share this version for review explicitly." : ""}`,
            );
            setOpen(false);
          }}
        />
      )}
    </section>
  );
}
function PublishDialog({
  projectId,
  asset,
  revision,
  onAccessLost,
  onDismiss,
  onPublished,
}: {
  projectId: string;
  asset: AssetSummary;
  revision?: RevisionContext;
  onAccessLost: () => void;
  onDismiss: () => void;
  onPublished: (value: Deliverable) => void;
}) {
  const [title, setTitle] = useState(revision?.parent.title ?? "Uploaded image");
  const [caption, setCaption] = useState(revision?.parent.caption ?? "");
  const [brief, setBrief] = useState("");
  const [scene, setScene] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement | null>(null);
  const titleInput = useRef<HTMLInputElement | null>(null);
  const pending = useRef<AbortController | null>(null);
  const retry = useRef<{ content: string; id: string } | null>(null);
  useLayoutEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    titleInput.current?.focus();
    return () => element?.close();
  }, []);
  async function publish() {
    if (pending.current) return;
    setError("");
    const fields = {
      assetId: asset.id,
      ...(revision
        ? {
            revision: {
              supersedesVersionId: revision.parent.deliverableId,
              expectedVersion: revision.parent.version,
              expectedDecisionId: revision.decisionId,
            },
          }
        : {}),
      title,
      caption,
      ...(brief.trim() ? { briefVersion: Number(brief) } : {}),
      ...(scene.trim() ? { sceneRevision: Number(scene) } : {}),
    };
    const content = JSON.stringify(fields);
    if (retry.current?.content !== content) retry.current = { content, id: crypto.randomUUID() };
    const input = PublishDeliverableSchema.safeParse({
      ...fields,
      idempotencyKey: retry.current.id,
    });
    if (!input.success) {
      setError(
        "Enter a title and positive whole source version numbers, or leave optional versions empty.",
      );
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    try {
      const { deliverable } = await creationRequest(
        `/api/v1/projects/${projectId}/deliverables`,
        DeliverableResultSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.data),
        },
        controller.signal,
      );
      if (controller.signal.aborted || pending.current !== controller) return;
      if (
        deliverable.projectId !== projectId ||
        deliverable.deliverableId !== input.data.idempotencyKey ||
        deliverable.asset.id !== asset.id ||
        deliverable.title !== input.data.title ||
        deliverable.caption !== (input.data.caption ?? "") ||
        deliverable.source.briefVersion !== input.data.briefVersion ||
        deliverable.source.sceneRevision !== input.data.sceneRevision ||
        deliverable.source.revision?.supersedesVersionId !==
          input.data.revision?.supersedesVersionId ||
        deliverable.source.revision?.expectedVersion !== input.data.revision?.expectedVersion ||
        deliverable.source.revision?.expectedDecisionId !== input.data.revision?.expectedDecisionId
      )
        throw new Error(
          "The publication response did not match. Keep your form and refresh history before retrying.",
        );
      onPublished(deliverable);
    } catch (reason) {
      if (controller.signal.aborted) return;
      if (reason instanceof CreationAccessError) onAccessLost();
      else
        setError(
          reason instanceof TypeError
            ? "The connection was interrupted. Your form is retained; retry uses the same request key."
            : reason instanceof Error
              ? reason.message
              : "Publication could not finish. Keep your form and retry.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="publish-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <h2 id="publish-dialog-title">
        {revision ? "Resubmit reviewed image" : "Publish uploaded image"}
      </h2>
      {revision && (
        <p>
          Revision of v{revision.parent.version}. The previous image and feedback stay unchanged.
        </p>
      )}
      <p>
        Uploaded image. This publishes the original verified bytes, not local edits or a render from
        the 3D scene.
      </p>
      <ImageThumbnail
        asset={asset}
        number={0}
        label="Image to publish"
        onAccessLost={onAccessLost}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void publish();
        }}
      >
        <fieldset disabled={busy}>
          <label>
            Publication title
            <input
              ref={titleInput}
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Caption (optional)
            <textarea
              value={caption}
              maxLength={1000}
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <label>
            Source brief version (optional)
            <input
              type="number"
              min={1}
              step={1}
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
            />
          </label>
          <label>
            Saved scene revision (context only, optional)
            <input
              type="number"
              min={1}
              step={1}
              value={scene}
              onChange={(event) => setScene(event.target.value)}
            />
          </label>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" onClick={onDismiss}>
            {busy ? "Cancel request" : "Keep unpublished"}
          </button>
          <button type="submit" disabled={busy || !title.trim()}>
            {busy ? "Publishing…" : revision ? "Resubmit version" : "Publish version"}
          </button>
        </div>
        <p>
          Published versions cannot be replaced. Cancellation stops this request in the browser;
          refresh history if the server may have accepted it.
        </p>
      </form>
    </dialog>
  );
}
