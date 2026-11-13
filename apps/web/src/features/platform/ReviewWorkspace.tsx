"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, MessageSquare } from "lucide-react";
import { ReviewInboxSchema, ReviewResultSchema } from "@/lib/contracts/reviews";
import type { z } from "zod";
import { StudioProjectListSchema } from "@/lib/contracts/workspace";
import { creationRequest, CreationAccessError } from "@/features/creation/creation-http";
import ClientReview from "@/features/reviews/ClientReview";
import { loadReviewPreview } from "@/features/reviews/review-preview";
import ProjectDeliverables from "@/features/projects/ProjectDeliverables";
import { PageHeader, EmptyState, ServiceNotice, StatusBadge } from "./WorkspaceUI";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import styles from "./platform.module.css";

type Summary = z.infer<typeof ReviewInboxSchema>["reviews"][number];
function ReviewThumbnail({
  id,
  grantId,
  onDenied,
}: {
  id: string;
  grantId: string;
  onDenied: (id: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let owned: string | undefined;
    void creationRequest(`/api/v1/reviews/${id}`, ReviewResultSchema, {}, controller.signal)
      .then((result) => {
        if (result.review.grantId !== grantId) throw new CreationAccessError(403);
        return loadReviewPreview(result.review, controller.signal);
      })
      .then((value) => {
        owned = value;
        if (controller.signal.aborted) URL.revokeObjectURL(value);
        else setUrl(value);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && error instanceof CreationAccessError) onDenied(id);
      });
    return () => {
      controller.abort();
      if (owned) URL.revokeObjectURL(owned);
    };
  }, [id, grantId, onDenied]);
  // Private original bytes use the existing bounded blob preview, never an external image optimizer.
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.image} src={url} alt="Submitted deliverable preview" />
  ) : (
    <div className={styles.empty} style={{ minHeight: 140, padding: 20 }}>
      <ImageIcon aria-hidden="true" />
      <span>Private image preview</span>
    </div>
  );
}
export default function ReviewWorkspace({ projectId }: { projectId?: string }) {
  const { sessionKey } = useWorkspaceSession();
  return <ReviewSession key={sessionKey} initialProject={projectId} />;
}
function ReviewSession({ initialProject }: { initialProject?: string }) {
  const session = useWorkspaceSession(),
    projects = useWorkspaceData("projects", StudioProjectListSchema);
  const [inbox, setInbox] = useState<z.infer<typeof ReviewInboxSchema> | null>(null),
    [category, setCategory] = useState("Pending Review"),
    [scope, setScope] = useState<"assigned" | "creator">(initialProject ? "creator" : "assigned"),
    [selected, setSelected] = useState(initialProject ?? "");
  const [loading, setLoading] = useState(session.configured),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const current = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!session.configured) return;
    const controller = new AbortController();
    current.current = controller;
    void creationRequest("/api/v1/reviews", ReviewInboxSchema, {}, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setInbox(value);
          setError("");
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setInbox(null);
          setError(
            "Your review inbox is unavailable. Check your account and connection, then retry.",
          );
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [session.configured, session.sessionKey, attempt]);
  const categories = ["Pending Review", "Changes Requested", "Approved", "All Submissions"];
  const filter = (item: Summary) =>
    category === "All Submissions" ||
    (category === "Pending Review" && !item.decision) ||
    (category === "Changes Requested" && item.decision?.decision === "changes_requested") ||
    (category === "Approved" && item.decision?.decision === "approved");
  const rows = inbox?.reviews.filter(filter) ?? [];
  const removeDenied = useCallback((id: string) => {
    setInbox((current) =>
      current
        ? { ...current, reviews: current.reviews.filter((item) => item.reviewId !== id) }
        : current,
    );
  }, []);
  const chosen = projects.data?.projects.find(
    (project) => project.id === selected && project.canEdit,
  );
  return (
    <div className={styles.page}>
      <PageHeader
        title="Review & Approvals"
        description="Keep every creative decision moving forward."
      >
        <button
          className={styles.secondary}
          onClick={() => {
            setLoading(session.configured);
            setAttempt((v) => v + 1);
            projects.refresh();
          }}
        >
          Refresh submissions
        </button>
      </PageHeader>
      {!session.configured && (
        <ServiceNotice message="Sign in to a connected workspace to see private submissions. Review tools stay here while your workspace is being connected." />
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          className={scope === "assigned" ? styles.button : styles.secondary}
          onClick={() => setScope("assigned")}
        >
          Assigned to you
        </button>
        <button
          className={scope === "creator" ? styles.button : styles.secondary}
          onClick={() => setScope("creator")}
        >
          Your project submissions
        </button>
      </div>
      {scope === "assigned" ? (
        <>
          <div role="tablist" aria-label="Review categories" className={styles.tabs}>
            {categories.map((name) => (
              <button
                role="tab"
                aria-selected={category === name}
                key={name}
                onClick={() => setCategory(name)}
              >
                {name}
              </button>
            ))}
          </div>
          {loading ? (
            <p role="status">Loading submissions…</p>
          ) : rows.length ? (
            <div className={styles.grid}>
              {rows.map((item, index) => (
                <article className={styles.card} key={item.grantId}>
                  {index < 2 && (
                    <ReviewThumbnail
                      id={item.reviewId}
                      grantId={item.grantId}
                      onDenied={removeDenied}
                    />
                  )}
                  <div className={styles.sectionHeader}>
                    <h2>{item.title}</h2>
                    <StatusBadge status={item.decision?.decision ?? "pending_review"} />
                  </div>
                  <p>Version {item.version} · Assigned to your account</p>
                  <p className={styles.muted}>
                    Access expires {new Date(item.expiresAt).toLocaleString()}
                  </p>
                  {item.decision?.comment && <p>{item.decision.comment}</p>}
                  <Link className={styles.button} href={`/review/${item.reviewId}`}>
                    <MessageSquare size={16} />
                    Open review
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No submissions to review"
              description={
                inbox
                  ? "Assigned versions appear here when a creator explicitly submits work for your account."
                  : "Connect your workspace to load assigned submissions and their feedback history."
              }
            >
              <Link className={styles.secondary} href="/projects">
                Open projects
              </Link>
            </EmptyState>
          )}
          {inbox?.hasMore && (
            <p className={styles.muted}>Showing your latest 50 active assignments.</p>
          )}
        </>
      ) : (
        <>
          <label className={styles.field}>
            Project submissions
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              <option value="">Choose a project</option>
              {projects.data?.projects
                .filter((project) => project.canEdit)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </label>
          {chosen ? (
            <ProjectDeliverables
              key={chosen.id}
              projectId={chosen.id}
              selectedAsset={null}
              selectionBusy={false}
              onAccessLost={() => {
                setSelected("");
                projects.revoke();
              }}
            />
          ) : (
            <EmptyState
              title="Choose a project to manage reviews"
              description="Share a published image with an existing client account, then track its comments and exact-version decision here."
            >
              <Link className={styles.button} href="/projects">
                Your projects
              </Link>
            </EmptyState>
          )}
        </>
      )}
    </div>
  );
}
export function ReviewDetail({ reviewId }: { reviewId: string }) {
  const session = useWorkspaceSession();
  return (
    <div className={styles.page}>
      <PageHeader
        title="Deliverable review"
        description="Review the submitted version and keep its feedback attached to the original work."
      >
        <Link className={styles.secondary} href="/review">
          All submissions
        </Link>
      </PageHeader>
      {session.configured ? (
        <ClientReview versionId={reviewId} />
      ) : (
        <>
          <ServiceNotice message="This is a private review. Connect authentication and sign in with the assigned account to load it." />
          <EmptyState
            title="Your review will open here"
            description="The submitted image, comments, version history and approval actions are available only to the assigned account."
          />
        </>
      )}
    </div>
  );
}
