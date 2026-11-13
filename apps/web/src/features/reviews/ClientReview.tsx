"use client";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ReviewInboxSchema,
  ReviewResultSchema,
  ReviewCommentInputSchema,
  ReviewDecisionInputSchema,
  type ReviewDetail,
} from "@/lib/contracts/reviews";
import type { z } from "zod";
import { creationRequest, CreationAccessError } from "@/features/creation/creation-http";
import { loadReviewPreview } from "./review-preview";
import styles from "./reviews.module.css";
export default function ClientReview({ versionId }: { versionId?: string }) {
  const { isLoaded, sessionId } = useAuth();
  if (!isLoaded) return <p role="status">Checking review session…</p>;
  if (!sessionId) return <p role="status">Sign in to view reviews.</p>;
  return <ReviewSession key={`${sessionId}:${versionId ?? "inbox"}`} versionId={versionId} />;
}
const decisionLabel = (value: string) => (value === "approved" ? "Approved" : "Changes requested");
function ReviewSession({ versionId }: { versionId?: string }) {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [inbox, setInbox] = useState<z.infer<typeof ReviewInboxSchema> | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [denied, setDenied] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [comment, setComment] = useState(""),
    [reason, setReason] = useState("");
  const [attempt, setAttempt] = useState(0),
    [previewReady, setPreviewReady] = useState(false);
  const load = useRef<AbortController | null>(null),
    pending = useRef<AbortController | null>(null);
  const retry = useRef<{ content: string; key: string } | null>(null);
  useLayoutEffect(
    () => () => {
      load.current?.abort();
      pending.current?.abort();
    },
    [],
  );
  const loseAccess = useCallback(() => {
    load.current?.abort();
    pending.current?.abort();
    load.current = null;
    pending.current = null;
    setReview(null);
    setInbox(null);
    setComment("");
    setReason("");
    setError("");
    setNotice("");
    setBusy(false);
    setLoading(false);
    setPreviewReady(false);
    retry.current = null;
    setDenied(true);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    load.current = controller;
    void (async () => {
      if (versionId) {
        const result = await creationRequest(
          `/api/v1/reviews/${versionId}`,
          ReviewResultSchema,
          {},
          controller.signal,
        );
        if (result.review.reviewId !== versionId) throw new Error();
        if (!controller.signal.aborted) setReview(result.review);
      } else {
        const result = await creationRequest(
          "/api/v1/reviews",
          ReviewInboxSchema,
          {},
          controller.signal,
        );
        if (!controller.signal.aborted) setInbox(result);
      }
      if (!controller.signal.aborted) {
        setLoading(false);
        setError("");
      }
    })().catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof CreationAccessError) loseAccess();
      else {
        setError("Reviews could not load. Check your connection and refresh.");
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [versionId, attempt, loseAccess]);
  function refresh() {
    setLoading(true);
    setError("");
    setAttempt((value) => value + 1);
  }
  async function act(kind: "comments" | "approved" | "changes_requested") {
    if (!review || pending.current || loading || review.decision || !previewReady) return;
    const fields = {
      grantId: review.grantId,
      expectedVersion: review.version,
      ...(kind === "comments"
        ? { comment: comment.trim() }
        : { decision: kind, comment: reason.trim() }),
    };
    const content = JSON.stringify({ kind, ...fields });
    if (retry.current?.content !== content) retry.current = { content, key: crypto.randomUUID() };
    const schema = kind === "comments" ? ReviewCommentInputSchema : ReviewDecisionInputSchema;
    const input = schema.safeParse({ ...fields, idempotencyKey: retry.current.key });
    if (!input.success) {
      setError("Enter a comment up to 2000 characters.");
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await creationRequest(
        `/api/v1/reviews/${review.reviewId}/${kind === "comments" ? "comments" : "decision"}`,
        ReviewResultSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.data),
        },
        controller.signal,
      );
      if (controller.signal.aborted || pending.current !== controller) return;
      if (
        result.review.reviewId !== review.reviewId ||
        result.review.grantId !== review.grantId ||
        result.review.version !== review.version
      )
        throw new Error("The review changed. Refresh before retrying.");
      load.current?.abort();
      setReview(result.review);
      setLoading(false);
      retry.current = null;
      if (kind === "comments") {
        setComment("");
        setNotice("Comment saved.");
      } else {
        setReason("");
        setNotice("Decision saved.");
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof CreationAccessError) loseAccess();
      else
        setError(
          error instanceof TypeError
            ? "The request was interrupted. Your text is retained; retry uses the same request key."
            : error instanceof Error
              ? error.message
              : "The review action could not finish. Refresh and retry.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  if (denied)
    return (
      <section className={styles.panel}>
        <h1>Review unavailable</h1>
        <p role="alert">
          Review unavailable. Sign in with the assigned account or ask the creator to check expiry
          and access.
        </p>
        <Link href="/reviews">Back to your reviews</Link>
      </section>
    );
  return (
    <section className={styles.panel} aria-label="Client review">
      <header>
        <h1>{review?.title ?? (versionId ? "Client review" : "Your reviews")}</h1>
        <button type="button" disabled={loading || busy} onClick={refresh}>
          {versionId ? "Refresh review" : "Refresh reviews"}
        </button>
      </header>
      {loading && <p role="status">Loading reviews…</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!versionId && inbox && (
        <>
          <p>Only versions explicitly assigned to your account appear here.</p>
          {!inbox.reviews.length && <p>No active review assignments.</p>}
          <ul>
            {inbox.reviews.map((item) => (
              <li key={item.grantId}>
                <Link href={`/reviews/${item.reviewId}`}>
                  v{item.version} · {item.title}
                </Link>
                <span>
                  {" "}
                  · {item.decision ? decisionLabel(item.decision.decision) : "Pending review"}
                </span>
              </li>
            ))}
          </ul>
          {inbox.hasMore && <p>Showing the latest 50 assignments.</p>}
        </>
      )}
      {review && (
        <>
          {review.history && (
            <section aria-label="Your granted version history">
              <h2>Your granted version history</h2>
              <p>
                Only versions currently assigned to your account appear here. Each decision belongs
                to its own version.
              </p>
              <ol>
                {review.history.map((item) => (
                  <li key={item.grantId}>
                    <Link href={`/reviews/${item.reviewId}`}>
                      v{item.version} · {item.title}
                    </Link>
                    <span>
                      {" "}
                      · {item.decision ? decisionLabel(item.decision.decision) : "Pending review"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <p>
            Published version {review.version} · Access expires{" "}
            <time dateTime={review.expiresAt}>{new Date(review.expiresAt).toLocaleString()}</time>
          </p>
          <p>{review.caption}</p>
          {!review.decision && <p>Pending review</p>}
          <ReviewImage
            key={`${review.reviewId}:${review.grantId}`}
            review={review}
            onDenied={loseAccess}
            onReady={setPreviewReady}
          />
          {review.decision && (
            <div className={styles.decision}>
              <h2>{decisionLabel(review.decision.decision)}</h2>
              {review.decision.comment && <p>{review.decision.comment}</p>}
              <p>
                This decision is saved for version {review.version}. A new decision requires a new
                published version.
              </p>
            </div>
          )}
          <h2>Comments</h2>
          {!review.comments.length && <p>No comments yet.</p>}
          <ol>
            {review.comments.map((item) => (
              <li key={item.id}>
                <p>{item.comment}</p>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
              </li>
            ))}
          </ol>
          <fieldset disabled={busy || loading || !!review.decision || !previewReady}>
            <label>
              Comment
              <textarea
                value={comment}
                maxLength={2000}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <button type="button" disabled={!comment.trim()} onClick={() => void act("comments")}>
              Add comment
            </button>
            <label>
              Decision note (optional)
              <textarea
                value={reason}
                maxLength={2000}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <div className={styles.actions}>
              <button type="button" onClick={() => void act("approved")}>
                Approve
              </button>
              <button type="button" onClick={() => void act("changes_requested")}>
                Request changes
              </button>
            </div>
          </fieldset>
          <p>Comments and decisions are permanent records for this exact version.</p>
          <Link href="/reviews">Your reviews</Link>
        </>
      )}
    </section>
  );
}
function ReviewImage({
  review,
  onDenied,
  onReady,
}: {
  review: ReviewDetail;
  onDenied: () => void;
  onReady: (value: boolean) => void;
}) {
  const [url, setUrl] = useState(""),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const { url: path, byteSize, mimeType, width, height } = review.preview;
  const { reviewId, grantId } = review;
  useEffect(() => {
    const controller = new AbortController();
    let owned = "";
    void loadReviewPreview(
      { reviewId, preview: { url: path, byteSize, mimeType, width, height } },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          URL.revokeObjectURL(result);
          return;
        }
        owned = result;
        setUrl(result);
        setFailed(false);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          if (error instanceof CreationAccessError) onDenied();
          else setFailed(true);
        }
      });
    return () => {
      controller.abort();
      if (owned) URL.revokeObjectURL(owned);
    };
    // The immutable media identity does not change when a comment/decision returns.
  }, [reviewId, grantId, path, byteSize, mimeType, width, height, attempt, onDenied]);
  return (
    <div className={styles.preview}>
      {url && (
        <>
          {/* Authenticated bounded blob URL, never a public optimizer/cache input. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Published review image"
            onLoad={() => onReady(true)}
            onError={() => {
              setFailed(true);
              onReady(false);
            }}
          />
        </>
      )}
      {failed && (
        <>
          <p>Image preview unavailable. Check review access or retry the image.</p>
          <button
            type="button"
            onClick={() => {
              onReady(false);
              setAttempt((value) => value + 1);
            }}
          >
            Retry review preview
          </button>
        </>
      )}
    </div>
  );
}
