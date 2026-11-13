import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, exists, inArray, isNull, sql, or } from "drizzle-orm";
import {
  ReviewDetailSchema,
  type ShareReview,
  type ReviewCommentInput,
  type ReviewDecisionInput,
} from "@/lib/contracts/reviews";
import { UploadedImageProvenanceSchema } from "@/lib/contracts/deliverables";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectEditability } from "./projects";
import {
  accessGrants,
  assets,
  contentVersions,
  projects,
  reviewComments,
  reviewDecisions,
  rateLimitBuckets,
} from "./schema";

type Grant = typeof accessGrants.$inferSelect;
const denied = () =>
  new BoundaryError(
    403,
    "FORBIDDEN",
    "This review is unavailable or your access has expired or been revoked.",
  );
const conflict = (
  message = "This request was already used or the review state changed. Refresh before trying again.",
) => new BoundaryError(409, "CONFLICT", message);
const active = () =>
  and(
    eq(accessGrants.scope, "review"),
    isNull(accessGrants.revokedAt),
    sql`${accessGrants.expiresAt} > now()`,
    sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
  );
const writableProject = (db: Database, subject: string, projectId: string) =>
  exists(
    db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), projectEditability(db, subject))),
  );
const grantSummary = (grant: Grant, current = true) => ({
  grantId: grant.id,
  reviewId: grant.contentVersionId!,
  expiresAt: grant.expiresAt.toISOString(),
  revokedAt: grant.revokedAt?.toISOString() ?? null,
  createdAt: grant.createdAt.toISOString(),
  active: current,
  reviewUrl: `/reviews/${grant.contentVersionId}`,
});
const commentSummary = (row: typeof reviewComments.$inferSelect) => ({
  id: row.id,
  grantId: row.reviewGrantId,
  comment: row.comment,
  timecodeSeconds: row.timecodeSeconds,
  createdAt: row.createdAt.toISOString(),
});
const decisionSummary = (row: typeof reviewDecisions.$inferSelect) => ({
  id: row.id,
  grantId: row.reviewGrantId,
  decision: row.decision,
  comment: row.reason,
  createdAt: row.createdAt.toISOString(),
});
async function editor(db: Database, subject: string, projectId: string, lock = false) {
  const query = db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(db, subject)))
    .limit(1);
  const [project] = lock ? await query.for("update") : await query;
  if (!project) throw denied();
}
async function published(db: Database, versionId: string, projectId?: string) {
  const [result] = await db
    .select({ version: contentVersions, asset: assets })
    .from(contentVersions)
    .innerJoin(
      assets,
      and(eq(assets.id, contentVersions.assetId), eq(assets.projectId, contentVersions.projectId)),
    )
    .where(
      and(
        eq(contentVersions.id, versionId),
        eq(contentVersions.status, "ready"),
        eq(assets.status, "ready"),
        ...(projectId ? [eq(contentVersions.projectId, projectId)] : []),
      ),
    )
    .limit(1);
  if (!result) throw denied();
  const source = UploadedImageProvenanceSchema.safeParse(result.version.sourceSnapshot);
  if (
    !source.success ||
    source.data.projectId !== result.version.projectId ||
    source.data.assetId !== result.asset.id ||
    source.data.checksumSha256 !== result.asset.checksumSha256 ||
    !["image/png", "image/jpeg", "image/webp"].includes(result.asset.mimeType) ||
    result.asset.byteSize < 1 ||
    result.asset.byteSize > 20971520 ||
    !result.asset.width ||
    !result.asset.height ||
    result.asset.width > 8192 ||
    result.asset.height > 8192 ||
    result.asset.width * result.asset.height > 16777216
  )
    throw denied();
  return { ...result, source: source.data };
}
async function recipientIsRestricted(db: Database, recipient: string, projectId: string) {
  const [broad] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(db, recipient)))
    .limit(1);
  if (broad)
    throw conflict(
      "Choose a reviewer without project editing access. Read-only clients may review an explicitly assigned published version.",
    );
}
async function budget(db: Database, subject: string, action: string, limit: number) {
  const keyHash = createHash("sha256").update(`${action}:${subject}`).digest("hex");
  const [allowed] = await db
    .insert(rateLimitBuckets)
    .values({
      keyHash,
      count: 1,
      windowStart: sql`now()`,
      expiresAt: sql`now() + interval '1 minute'`,
    })
    .onConflictDoUpdate({
      target: rateLimitBuckets.keyHash,
      set: {
        count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
        expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 minute' ELSE ${rateLimitBuckets.expiresAt} END`,
      },
      setWhere: or(
        sql`${rateLimitBuckets.expiresAt} <= now()`,
        sql`${rateLimitBuckets.count} < ${limit}`,
      ),
    })
    .returning({ keyHash: rateLimitBuckets.keyHash });
  if (!allowed)
    throw new BoundaryError(
      429,
      "RATE_LIMITED",
      "Too many review requests. Wait a minute and retry.",
    );
}
async function shareRetry(
  db: Database,
  subject: string,
  projectId: string,
  versionId: string,
  input: ShareReview,
) {
  const [grant] = await db
    .select({ grant: accessGrants, current: sql<boolean>`(${active()})` })
    .from(accessGrants)
    .where(eq(accessGrants.id, input.idempotencyKey))
    .limit(1);
  if (!grant) return null;
  const row = grant.grant;
  if (
    !grant.current ||
    row.issuerClerkId !== subject ||
    row.projectId !== projectId ||
    row.contentVersionId !== versionId ||
    row.reviewerClerkId !== input.reviewerId ||
    row.expiresAt.getTime() - row.createdAt.getTime() !== input.expiresInDays * 86400000
  )
    throw conflict();
  return grantSummary(row);
}
export function prepareReviewShare(
  subject: string,
  projectId: string,
  versionId: string,
  input: ShareReview,
) {
  return withDatabase(async (db) => {
    await editor(db, subject, projectId);
    await published(db, versionId, projectId);
    const retry = await shareRetry(db, subject, projectId, versionId, input);
    if (retry) return retry;
    await recipientIsRestricted(db, input.reviewerId, projectId);
    await budget(db, subject, "review-share", 20);
    return null;
  });
}
export function commitReviewShare(
  subject: string,
  projectId: string,
  versionId: string,
  input: ShareReview,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await editor(tx, subject, projectId, true);
      await published(tx, versionId, projectId);
      const retry = await shareRetry(tx, subject, projectId, versionId, input);
      if (retry) return retry;
      await recipientIsRestricted(tx, input.reviewerId, projectId);
      const [decided] = await tx
        .select({ id: reviewDecisions.id })
        .from(reviewDecisions)
        .where(
          and(
            eq(reviewDecisions.contentVersionId, versionId),
            eq(reviewDecisions.reviewerClerkId, input.reviewerId),
          ),
        )
        .limit(1);
      if (decided)
        throw conflict(
          "This reviewer already decided on this version. Publish a new version for another decision.",
        );
      // Retire expired assignments before replacing them; never silently replace an active reviewer.
      await tx
        .update(accessGrants)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(accessGrants.contentVersionId, versionId),
            eq(accessGrants.scope, "review"),
            isNull(accessGrants.revokedAt),
            sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
            sql`${accessGrants.expiresAt} <= now()`,
            writableProject(tx, subject, projectId),
          ),
        );
      const [existing] = await tx
        .select({ id: accessGrants.id })
        .from(accessGrants)
        .where(and(eq(accessGrants.contentVersionId, versionId), active()))
        .limit(1);
      if (existing)
        throw conflict(
          "This version already has an active reviewer. Revoke that assignment before sharing again.",
        );
      const secretHash = createHash("sha256").update(randomBytes(32)).digest("hex");
      const [grant] = await tx
        .insert(accessGrants)
        .select(
          tx
            .select({
              id: sql<string>`${input.idempotencyKey}::uuid`.as("id"),
              projectId: projects.id,
              secretHash: sql<string>`${secretHash}`.as("secret_hash"),
              scope: sql<"review">`'review'::grant_scope`.as("scope"),
              sessionId: sql<null>`NULL::uuid`.as("session_id"),
              contentVersionId: sql<string>`${versionId}::uuid`.as("content_version_id"),
              issuerClerkId: sql<string>`${subject}`.as("issuer_clerk_id"),
              reviewerClerkId: sql<string>`${input.reviewerId}`.as("reviewer_clerk_id"),
              expiresAt: sql<Date>`now() + ${input.expiresInDays} * interval '1 day'`.as(
                "expires_at",
              ),
              revokedAt: sql<null>`NULL::timestamptz`.as("revoked_at"),
              maxUses: sql<number>`1`.as("max_uses"),
              useCount: sql<number>`0`.as("use_count"),
              createdAt: sql<Date>`now()`.as("created_at"),
            })
            .from(projects)
            .where(and(eq(projects.id, projectId), projectEditability(tx, subject))),
        )
        .onConflictDoNothing()
        .returning();
      if (!grant) {
        await editor(tx, subject, projectId);
        throw conflict();
      }
      return grantSummary(grant);
    }),
  );
}
export function revokeReviewGrant(
  subject: string,
  projectId: string,
  versionId: string,
  grantId: string,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await editor(tx, subject, projectId, true);
      await published(tx, versionId, projectId);
      const [grant] = await tx
        .update(accessGrants)
        .set({ revokedAt: sql`COALESCE(${accessGrants.revokedAt}, now())` })
        .where(
          and(
            eq(accessGrants.id, grantId),
            eq(accessGrants.projectId, projectId),
            eq(accessGrants.contentVersionId, versionId),
            eq(accessGrants.scope, "review"),
            sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
            writableProject(tx, subject, projectId),
          ),
        )
        .returning();
      if (!grant) throw denied();
      return grantSummary(grant, false);
    }),
  );
}
async function assigned(
  db: Database,
  subject: string,
  versionId: string,
  grantId?: string,
  lock = false,
) {
  const query = db
    .select()
    .from(accessGrants)
    .where(
      and(
        active(),
        eq(accessGrants.reviewerClerkId, subject),
        eq(accessGrants.contentVersionId, versionId),
        ...(grantId ? [eq(accessGrants.id, grantId)] : []),
      ),
    )
    .limit(1);
  const [grant] = lock ? await query.for("update") : await query;
  if (!grant) throw denied();
  const source = await published(db, versionId, grant.projectId);
  return { grant, ...source };
}
async function ownFeedback(db: Database, subject: string, versionId: string) {
  const comments = await db
    .select()
    .from(reviewComments)
    .where(
      and(
        eq(reviewComments.contentVersionId, versionId),
        eq(reviewComments.reviewerClerkId, subject),
      ),
    )
    .orderBy(desc(reviewComments.createdAt), desc(reviewComments.id))
    .limit(100);
  const [decision] = await db
    .select()
    .from(reviewDecisions)
    .where(
      and(
        eq(reviewDecisions.contentVersionId, versionId),
        eq(reviewDecisions.reviewerClerkId, subject),
      ),
    )
    .orderBy(desc(reviewDecisions.createdAt), desc(reviewDecisions.id))
    .limit(1);
  return {
    comments: comments.reverse().map(commentSummary),
    decision: decision ? decisionSummary(decision) : null,
  };
}
export function readReviewSource(subject: string, versionId: string, grantId?: string) {
  return withDatabase((db) => assigned(db, subject, versionId, grantId));
}
export async function readClientReview(subject: string, versionId: string) {
  return withDatabase(async (db) => {
    const { grant, version, asset, source } = await assigned(db, subject, versionId);
    const feedback = await ownFeedback(db, subject, versionId);
    const history = await reviewInbox(db, subject, grant.projectId);
    // Grant can be revoked between metadata/feedback queries too.
    await assigned(db, subject, versionId, grant.id);
    return ReviewDetailSchema.parse({
      reviewId: versionId,
      grantId: grant.id,
      version: version.version,
      title: source.title,
      caption: source.caption,
      publishedAt: version.createdAt.toISOString(),
      expiresAt: grant.expiresAt.toISOString(),
      preview: {
        url: `/api/v1/reviews/${versionId}/content`,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
      },
      ...feedback,
      history: history.reviews,
    });
  });
}
export function readReviewInbox(subject: string, projectId?: string) {
  return withDatabase((db) => reviewInbox(db, subject, projectId));
}
async function reviewInbox(db: Database, subject: string, projectId?: string) {
  const grants = await db
    .select({ id: accessGrants.contentVersionId })
    .from(accessGrants)
    .innerJoin(
      contentVersions,
      and(
        eq(contentVersions.id, accessGrants.contentVersionId),
        eq(contentVersions.projectId, accessGrants.projectId),
      ),
    )
    .where(
      and(
        active(),
        eq(accessGrants.reviewerClerkId, subject),
        eq(contentVersions.status, "ready"),
        ...(projectId ? [eq(accessGrants.projectId, projectId)] : []),
      ),
    )
    .orderBy(desc(contentVersions.version), accessGrants.id)
    .limit(51);
  const reviews = [];
  for (const item of grants.slice(0, 50)) {
    // Recheck the grant before returning each private summary, omitting revocations.
    try {
      const { grant, version, source } = await assigned(db, subject, item.id!);
      const { decision } = await ownFeedback(db, subject, item.id!);
      await assigned(db, subject, item.id!, grant.id);
      reviews.push({
        reviewId: item.id!,
        grantId: grant.id,
        version: version.version,
        title: source.title,
        expiresAt: grant.expiresAt.toISOString(),
        decision,
      });
    } catch (error) {
      if (!(error instanceof BoundaryError) || error.status !== 403) throw error;
    }
  }
  // A previously scanned assignment may be revoked while later summaries load.
  // Revalidate the entire bounded set together before returning private history.
  const current = reviews.length
    ? await db
        .select({ id: accessGrants.id })
        .from(accessGrants)
        .where(
          and(
            active(),
            eq(accessGrants.reviewerClerkId, subject),
            inArray(
              accessGrants.id,
              reviews.map((item) => item.grantId),
            ),
            ...(projectId ? [eq(accessGrants.projectId, projectId)] : []),
          ),
        )
    : [];
  const allowed = new Set(current.map((item) => item.id));
  return {
    reviews: reviews.filter((item) => allowed.has(item.grantId)),
    hasMore: grants.length > 50,
  };
}
export function readCreatorReviewFeedback(subject: string, projectId: string, versionId: string) {
  return withDatabase(async (db) => {
    await editor(db, subject, projectId);
    const { version } = await published(db, versionId, projectId);
    const grants = await db
      .select({ grant: accessGrants, current: sql<boolean>`(${active()})` })
      .from(accessGrants)
      .where(
        and(
          eq(accessGrants.projectId, projectId),
          eq(accessGrants.contentVersionId, versionId),
          eq(accessGrants.scope, "review"),
          sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
        ),
      )
      .orderBy(desc(accessGrants.createdAt), desc(accessGrants.id))
      .limit(50);
    const comments = await db
      .select()
      .from(reviewComments)
      .where(
        and(
          eq(reviewComments.projectId, projectId),
          eq(reviewComments.contentVersionId, versionId),
        ),
      )
      .orderBy(desc(reviewComments.createdAt), desc(reviewComments.id))
      .limit(100);
    const decisions = await db
      .select()
      .from(reviewDecisions)
      .where(
        and(
          eq(reviewDecisions.projectId, projectId),
          eq(reviewDecisions.contentVersionId, versionId),
        ),
      )
      .orderBy(desc(reviewDecisions.createdAt), desc(reviewDecisions.id))
      .limit(100);
    await editor(db, subject, projectId);
    return {
      reviewId: versionId,
      version: version.version,
      grants: grants.map(({ grant, current }) => grantSummary(grant, current)),
      comments: comments.reverse().map(commentSummary),
      decisions: decisions.map(decisionSummary),
      latestDecision: decisions[0] ? decisionSummary(decisions[0]) : null,
    };
  });
}
export async function appendReviewAction(
  subject: string,
  versionId: string,
  input: ReviewCommentInput | ReviewDecisionInput,
) {
  await withDatabase((db) =>
    db.transaction(async (tx) => {
      const { grant, version } = await assigned(tx, subject, versionId, input.grantId, true);
      if (input.expectedVersion !== version.version)
        throw conflict(
          "The displayed version does not match this review. Reload before submitting.",
        );
      const decisionInput = "decision" in input;
      if (decisionInput) {
        const [existing] = await tx
          .select()
          .from(reviewDecisions)
          .where(eq(reviewDecisions.id, input.idempotencyKey))
          .limit(1);
        if (existing) {
          if (
            existing.contentVersionId !== versionId ||
            existing.reviewGrantId !== grant.id ||
            existing.reviewerClerkId !== subject ||
            existing.decision !== input.decision ||
            (existing.reason ?? "") !== (input.comment ?? "")
          )
            throw conflict();
          return;
        }
      } else {
        const [existing] = await tx
          .select()
          .from(reviewComments)
          .where(eq(reviewComments.id, input.idempotencyKey))
          .limit(1);
        if (existing) {
          if (
            existing.contentVersionId !== versionId ||
            existing.reviewGrantId !== grant.id ||
            existing.reviewerClerkId !== subject ||
            existing.comment !== input.comment ||
            existing.timecodeSeconds !== (input.timecodeSeconds ?? null)
          )
            throw conflict();
          return;
        }
      }
      const [terminal] = await tx
        .select({ id: reviewDecisions.id })
        .from(reviewDecisions)
        .where(
          and(
            eq(reviewDecisions.contentVersionId, versionId),
            eq(reviewDecisions.reviewerClerkId, subject),
          ),
        )
        .limit(1);
      if (terminal)
        throw conflict(
          "A decision already exists for this version. A new decision requires a new published version.",
        );
      await budget(tx, subject, "review-action", 60);
      if (decisionInput) {
        const [saved] = await tx
          .insert(reviewDecisions)
          .values({
            id: input.idempotencyKey,
            projectId: grant.projectId,
            contentVersionId: versionId,
            reviewGrantId: grant.id,
            briefVersionId: version.briefVersionId,
            reviewerClerkId: subject,
            decision: input.decision,
            reason: input.comment ?? null,
          })
          .onConflictDoNothing()
          .returning({ id: reviewDecisions.id });
        if (!saved) throw conflict();
      } else {
        const [saved] = await tx
          .insert(reviewComments)
          .values({
            id: input.idempotencyKey,
            projectId: grant.projectId,
            contentVersionId: versionId,
            reviewGrantId: grant.id,
            reviewerClerkId: subject,
            comment: input.comment,
            timecodeSeconds: input.timecodeSeconds ?? null,
          })
          .onConflictDoNothing()
          .returning({ id: reviewComments.id });
        if (!saved) throw conflict();
      }
    }),
  );
  return readClientReview(subject, versionId);
}
