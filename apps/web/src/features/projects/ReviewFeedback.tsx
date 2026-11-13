"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { z } from "zod";
import {
  ReviewFeedbackResultSchema,
  ReviewGrantResultSchema,
  ShareReviewSchema,
} from "@/lib/contracts/reviews";
import { creationRequest, CreationAccessError } from "@/features/creation/creation-http";
import styles from "../reviews/reviews.module.css";
export function DeferredReviewFeedback(props: {
  projectId: string;
  versionId: string;
  version: number;
  onAccessLost: () => void;
  onRevise?: (decisionId: string) => void;
  revisionDisabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>Review access and feedback for v{props.version}</summary>
      {open && (
        <ReviewFeedback
          projectId={props.projectId}
          versionId={props.versionId}
          onAccessLost={props.onAccessLost}
          onRevise={props.onRevise}
          revisionDisabled={props.revisionDisabled}
        />
      )}
    </details>
  );
}
export default function ReviewFeedback({
  projectId,
  versionId,
  onAccessLost,
  onRevise,
  revisionDisabled,
}: {
  projectId: string;
  versionId: string;
  onAccessLost: () => void;
  onRevise?: (decisionId: string) => void;
  revisionDisabled?: boolean;
}) {
  const [feedback, setFeedback] = useState<
    z.infer<typeof ReviewFeedbackResultSchema>["feedback"] | null
  >(null);
  const [recipient, setRecipient] = useState(""),
    [days, setDays] = useState("7");
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useRef<AbortController | null>(null),
    pending = useRef<AbortController | null>(null),
    retry = useRef<{ content: string; key: string } | null>(null);
  const path = `/api/v1/projects/${projectId}/deliverables/${versionId}/review-grants`;
  useLayoutEffect(
    () => () => {
      load.current?.abort();
      pending.current?.abort();
    },
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    load.current = controller;
    void creationRequest(path, ReviewFeedbackResultSchema, {}, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.feedback.reviewId !== versionId) throw new Error();
        setFeedback(result.feedback);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof CreationAccessError) onAccessLost();
        else {
          setError("Review feedback could not load. Refresh before sharing again.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [path, versionId, attempt, onAccessLost]);
  function refresh() {
    setError("");
    setLoading(true);
    setAttempt((value) => value + 1);
  }
  async function mutate(grantId?: string) {
    if (pending.current || loading) return;
    let body: unknown = {};
    if (!grantId) {
      const fields = { reviewerId: recipient.trim(), expiresInDays: Number(days) },
        content = JSON.stringify(fields);
      if (retry.current?.content !== content) retry.current = { content, key: crypto.randomUUID() };
      const parsed = ShareReviewSchema.safeParse({ ...fields, idempotencyKey: retry.current.key });
      if (!parsed.success) {
        setError("Enter an existing Clerk user ID and expiry between 1 and 30 days.");
        return;
      }
      body = parsed.data;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await creationRequest(
        grantId ? `${path}/${grantId}/revoke` : path,
        ReviewGrantResultSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        controller.signal,
      );
      if (controller.signal.aborted || pending.current !== controller) return;
      if (result.grant.reviewId !== versionId)
        throw new Error("The review assignment changed. Refresh before retrying.");
      retry.current = null;
      setNotice(
        grantId
          ? "Review access revoked."
          : "Review access granted. The assigned client must sign in to view this version.",
      );
      refresh();
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof CreationAccessError) onAccessLost();
      else
        setError(
          error instanceof TypeError
            ? "The request was interrupted. Your fields are retained; refresh or retry."
            : error instanceof Error
              ? error.message
              : "Review access could not be updated.",
        );
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className={styles.panel} aria-label="Creator review feedback">
      <header>
        <h3>Client review</h3>
        <button type="button" disabled={loading || busy} onClick={refresh}>
          Refresh feedback
        </button>
      </header>
      {loading && <p role="status">Loading review feedback…</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <p>
        Assign one existing signed-in account to this published version. This grants no project
        membership and sends no email.
      </p>
      <fieldset disabled={loading || busy || !!feedback?.grants.some((item) => item.active)}>
        <label>
          Reviewer Clerk user ID
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="user_…"
          />
        </label>
        <label>
          Access expires in days
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </label>
        <button type="button" onClick={() => void mutate()}>
          Share for review
        </button>
      </fieldset>
      {!loading && !feedback?.grants.length && <p>No review assignment yet.</p>}
      <ul>
        {feedback?.grants.map((grant) => (
          <li key={grant.grantId}>
            <strong>
              {grant.active ? "Active review access" : grant.revokedAt ? "Revoked" : "Expired"}
            </strong>
            <p>Expires {new Date(grant.expiresAt).toLocaleString()}</p>
            {grant.active && (
              <>
                <a href={grant.reviewUrl}>Authenticated review page</a>
                <p>The assigned account must sign in; this path is not an anonymous access link.</p>
                <button
                  type="button"
                  disabled={busy || loading}
                  onClick={() => void mutate(grant.grantId)}
                >
                  Revoke review access
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {feedback?.latestDecision ? (
        <>
          <p>
            Latest decision:{" "}
            {feedback.latestDecision.decision === "approved" ? "Approved" : "Changes requested"}
          </p>
          {feedback.latestDecision.comment && <p>{feedback.latestDecision.comment}</p>}
          {onRevise && (
            <>
              <button
                type="button"
                disabled={loading || busy || revisionDisabled}
                onClick={() => onRevise(feedback.latestDecision!.id)}
              >
                Resubmit selected image
              </button>
              <p>
                Select a different ready uploaded image above. New versions require explicit
                sharing.
              </p>
            </>
          )}
        </>
      ) : (
        feedback && (
          <p>
            {feedback.grants.some((grant) => grant.active)
              ? "Pending review"
              : "Not submitted for review"}
          </p>
        )
      )}
      <h4>Version comments</h4>
      {!feedback?.comments.length && <p>No comments yet.</p>}
      <ol>
        {feedback?.comments.map((item) => (
          <li key={item.id}>
            <p>{item.comment}</p>
            <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}
