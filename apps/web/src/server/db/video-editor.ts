import "server-only";
import { createHash } from "node:crypto";
import { and, desc, eq, exists, inArray, isNull, or, sql } from "drizzle-orm";
import { AssetSummarySchema } from "@/lib/contracts/assets";
import { previewSupported } from "@/lib/contracts/xr-assets";
import {
  CreateVideoRenderSchema,
  SaveVideoEditorDraftSchema,
  VideoEditorDraftSchema,
  VideoRenderJobSchema,
  videoEditorSourceMaxBytes,
  type CreateVideoRender,
  type SaveVideoEditorDraft,
  type VideoEditorDocument,
  type VideoRenderJob,
} from "@/lib/contracts/video-editor";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectEditability } from "./projects";
import { assets, processingJobs, projects, rateLimitBuckets } from "./schema";
import {
  videoEditorDrafts,
  videoRenderRequests,
  type VideoEditorSourceSnapshot,
} from "./video-editor-schema";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const denied = () =>
  new BoundaryError(
    403,
    "FORBIDDEN",
    "This private video editor is not available to your account.",
  );
const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "The saved video draft or request changed. Reload the saved revision before continuing.",
  );
const joins = { job: processingJobs, request: videoRenderRequests, output: assets };
type Row = {
  job: typeof processingJobs.$inferSelect;
  request: typeof videoRenderRequests.$inferSelect;
  output: typeof assets.$inferSelect | null;
};
export type VideoRenderClaim = Row & { subject: string; lease: Date };
export type VideoRenderOutput = {
  objectKey: string;
  mimeType: "video/mp4";
  byteSize: number;
  checksumSha256: string;
};
function sameSources(current: VideoEditorSourceSnapshot[], snapshot: VideoEditorSourceSnapshot[]) {
  // JSONB does not retain object-key insertion order. Compare a fixed field
  // sequence rather than serializing objects from different storage boundaries.
  const values = (items: VideoEditorSourceSnapshot[]) =>
    items.map((asset) => [
      asset.id,
      asset.projectId,
      asset.objectKey,
      asset.mimeType,
      asset.byteSize,
      asset.checksumSha256,
      asset.width,
      asset.height,
      asset.durationSeconds,
    ]);
  return JSON.stringify(values(current)) === JSON.stringify(values(snapshot));
}

function access(database: Database, subject: string) {
  return exists(
    database
      .select({ one: sql`1` })
      .from(projects)
      .where(and(eq(projects.id, processingJobs.projectId), projectEditability(database, subject))),
  );
}
async function project(database: Database, subject: string, projectId: string, lock = false) {
  const query = database
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(database, subject)))
    .limit(1);
  const [row] = await (lock ? query.for("update") : query);
  if (!row) throw denied();
}
function projection(row: Row): VideoRenderJob {
  const asset = row.output;
  const outputAsset =
    asset && asset.status === "ready"
      ? AssetSummarySchema.parse({
          id: asset.id,
          projectId: asset.projectId,
          mimeType: asset.mimeType,
          byteSize: asset.byteSize,
          width: asset.width,
          height: asset.height,
          durationSeconds: asset.durationSeconds,
          createdAt: asset.createdAt.toISOString(),
          contentUrl: previewSupported(asset.mimeType, asset.byteSize)
            ? `/api/v1/assets/${asset.id}/content`
            : null,
          nativeContentUrl: null,
        })
      : null;
  return VideoRenderJobSchema.parse({
    id: row.job.id,
    projectId: row.job.projectId,
    draftRevision: row.request.draftRevision,
    status: row.job.status,
    environment: row.request.environment,
    failureCode: row.job.failureCode,
    errorMessage: row.request.errorMessage,
    outputAsset,
    createdAt: row.job.createdAt.toISOString(),
    updatedAt: row.job.updatedAt.toISOString(),
  });
}
async function owned(database: Database, subject: string, projectId: string, jobId: string) {
  const [row] = await database
    .select(joins)
    .from(processingJobs)
    .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
    .leftJoin(assets, eq(assets.id, videoRenderRequests.outputAssetId))
    .where(
      and(
        eq(processingJobs.id, jobId),
        eq(processingJobs.projectId, projectId),
        eq(processingJobs.kind, "render"),
        eq(videoRenderRequests.ownerClerkId, subject),
        access(database, subject),
      ),
    )
    .limit(1);
  if (!row) throw denied();
  return row;
}
async function budget(database: Database, key: string, limit: number, window: "minute" | "hour") {
  const interval = window === "minute" ? sql`interval '1 minute'` : sql`interval '1 hour'`;
  const [allowed] = await database
    .insert(rateLimitBuckets)
    .values({
      keyHash: hash(key),
      count: 1,
      windowStart: sql`now()`,
      expiresAt: sql`now() + ${interval}`,
    })
    .onConflictDoUpdate({
      target: rateLimitBuckets.keyHash,
      set: {
        count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
        expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + ${interval} ELSE ${rateLimitBuckets.expiresAt} END`,
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
      "The video editor request limit was reached. Try again later.",
    );
}
async function sources(
  database: Database,
  projectId: string,
  document: VideoEditorDocument,
  lock = false,
): Promise<VideoEditorSourceSnapshot[]> {
  const ids = [...new Set(document.clips.map((clip) => clip.assetId))];
  const query = database
    .select()
    .from(assets)
    .where(
      and(eq(assets.projectId, projectId), inArray(assets.id, ids), eq(assets.status, "ready")),
    );
  const rows = await (lock ? query.for("key share") : query);
  if (
    rows.length !== ids.length ||
    rows.some(
      (asset) =>
        !["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"].includes(
          asset.mimeType,
        ) ||
        asset.byteSize <= 0 ||
        asset.byteSize > videoEditorSourceMaxBytes ||
        !asset.checksumSha256 ||
        !/^[a-f0-9]{64}$/.test(asset.checksumSha256),
    )
  )
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Choose verified ready PNG, JPEG, WebP, MP4 or WebM assets up to 20 MiB in this project.",
    );
  for (const clip of document.clips) {
    const asset = rows.find((item) => item.id === clip.assetId)!;
    if (
      asset.mimeType.startsWith("image/")
        ? clip.trimStartSeconds !== 0
        : asset.durationSeconds !== null &&
          clip.trimStartSeconds + clip.durationSeconds > asset.durationSeconds
    )
      throw new BoundaryError(
        400,
        "INVALID_INPUT",
        "The clip trim exceeds its verified source duration.",
      );
  }
  return rows
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((asset) => ({
      id: asset.id,
      projectId: asset.projectId,
      objectKey: asset.objectKey,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      checksumSha256: asset.checksumSha256!,
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds,
    }));
}
async function draft(database: Database, subject: string, projectId: string) {
  // Authorization belongs to the private-row read, including empty drafts.
  const [result] = await database
    .select({ projectId: projects.id, draft: videoEditorDrafts })
    .from(projects)
    .leftJoin(
      videoEditorDrafts,
      and(
        eq(videoEditorDrafts.projectId, projects.id),
        eq(videoEditorDrafts.ownerClerkId, subject),
      ),
    )
    .where(and(eq(projects.id, projectId), projectEditability(database, subject)))
    .limit(1);
  if (!result) throw denied();
  const row = result.draft;
  return VideoEditorDraftSchema.parse({
    projectId,
    revision: row?.revision ?? 0,
    document: row?.document ?? null,
    updatedAt: row?.updatedAt.toISOString() ?? null,
    canEdit: true,
  });
}
export async function readVideoEditorDraft(subject: string, projectId: string) {
  return withDatabase((database) => draft(database, subject, projectId));
}
export async function saveVideoEditorDraft(
  subject: string,
  projectId: string,
  untrusted: SaveVideoEditorDraft,
) {
  const input = SaveVideoEditorDraftSchema.parse(untrusted);
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      await project(transaction, subject, projectId, true);
      await sources(transaction, projectId, input.document);
      await budget(transaction, `video-draft:${subject}`, 60, "minute");
      if (input.expectedRevision === 0) {
        const [created] = await transaction
          .insert(videoEditorDrafts)
          .values({ projectId, ownerClerkId: subject, revision: 1, document: input.document })
          .onConflictDoNothing()
          .returning();
        if (!created) throw conflict();
      } else {
        const [updated] = await transaction
          .update(videoEditorDrafts)
          .set({
            revision: input.expectedRevision + 1,
            document: input.document,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(videoEditorDrafts.projectId, projectId),
              eq(videoEditorDrafts.ownerClerkId, subject),
              eq(videoEditorDrafts.revision, input.expectedRevision),
              exists(
                transaction
                  .select({ one: sql`1` })
                  .from(projects)
                  .where(and(eq(projects.id, projectId), projectEditability(transaction, subject))),
              ),
            ),
          )
          .returning();
        if (!updated) throw conflict();
      }
      return draft(transaction, subject, projectId);
    }),
  );
}
/** Idempotent retries are private reads and do not depend on current provider configuration. */
export async function findVideoRenderRequest(
  subject: string,
  projectId: string,
  untrusted: CreateVideoRender,
): Promise<VideoRenderJob | null> {
  const input = CreateVideoRenderSchema.parse(untrusted);
  const requestHash = hash(JSON.stringify(input)),
    idempotencyKey = hash(`video:${subject}:${input.idempotencyKey}`);
  return withDatabase(async (database) => {
    await project(database, subject, projectId);
    const [row] = await database
      .select(joins)
      .from(processingJobs)
      .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
      .leftJoin(assets, eq(assets.id, videoRenderRequests.outputAssetId))
      .where(
        and(
          eq(processingJobs.projectId, projectId),
          eq(processingJobs.kind, "render"),
          eq(processingJobs.idempotencyKey, idempotencyKey),
          eq(videoRenderRequests.ownerClerkId, subject),
          access(database, subject),
        ),
      )
      .limit(1);
    if (!row) return null;
    if (row.request.requestHash !== requestHash) throw conflict();
    return projection(row);
  });
}
export async function createVideoRender(
  subject: string,
  projectId: string,
  untrusted: CreateVideoRender,
  environment: "sandbox" | "production",
) {
  const input = CreateVideoRenderSchema.parse(untrusted),
    requestHash = hash(JSON.stringify(input)),
    idempotencyKey = hash(`video:${subject}:${input.idempotencyKey}`);
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      await project(transaction, subject, projectId, true);
      const [existing] = await transaction
        .select({ id: processingJobs.id, requestHash: videoRenderRequests.requestHash })
        .from(processingJobs)
        .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
        .where(
          and(
            eq(processingJobs.projectId, projectId),
            eq(processingJobs.kind, "render"),
            eq(processingJobs.idempotencyKey, idempotencyKey),
          ),
        )
        .limit(1);
      if (existing) {
        if (existing.requestHash !== requestHash) throw conflict();
        return projection(await owned(transaction, subject, projectId, existing.id));
      }
      const saved = await draft(transaction, subject, projectId);
      if (!saved.document || saved.revision !== input.draftRevision) throw conflict();
      const snapshot = await sources(transaction, projectId, saved.document);
      const [{ count }] = await transaction
        .select({ count: sql<number>`count(*)::int` })
        .from(processingJobs)
        .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
        .where(
          and(
            eq(processingJobs.projectId, projectId),
            sql`${processingJobs.status} IN ('queued','processing')`,
          ),
        );
      if (count >= 2)
        throw new BoundaryError(
          429,
          "RATE_LIMITED",
          "This project already has two active video renders.",
        );
      await budget(transaction, `video-render-actor:${subject}`, 5, "hour");
      await budget(transaction, `video-render-project:${projectId}`, 5, "hour");
      const [job] = await transaction
        .insert(processingJobs)
        .values({ projectId, kind: "render", idempotencyKey })
        .returning();
      await transaction.insert(videoRenderRequests).values({
        jobId: job.id,
        projectId,
        ownerClerkId: subject,
        draftRevision: saved.revision,
        document: saved.document,
        sourceSnapshot: snapshot,
        requestHash,
        environment,
        consent: input.consent,
      });
      return projection(await owned(transaction, subject, projectId, job.id));
    }),
  );
}
export async function listVideoRenders(subject: string, projectId: string) {
  return withDatabase(async (database) => {
    await project(database, subject, projectId);
    return (
      await database
        .select(joins)
        .from(processingJobs)
        .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
        .leftJoin(assets, eq(assets.id, videoRenderRequests.outputAssetId))
        .where(
          and(
            eq(processingJobs.projectId, projectId),
            eq(processingJobs.kind, "render"),
            eq(videoRenderRequests.ownerClerkId, subject),
            access(database, subject),
          ),
        )
        .orderBy(desc(processingJobs.createdAt), desc(processingJobs.id))
        .limit(50)
    ).map(projection);
  });
}
export async function readVideoRender(subject: string, projectId: string, jobId: string) {
  return withDatabase(async (database) =>
    projection(await owned(database, subject, projectId, jobId)),
  );
}
function leaseMatches(database: Database, claim: VideoRenderClaim, checkAccess = true) {
  return and(
    eq(processingJobs.id, claim.job.id),
    eq(processingJobs.projectId, claim.job.projectId),
    eq(processingJobs.kind, "render"),
    eq(processingJobs.status, "processing"),
    eq(processingJobs.leaseExpiresAt, claim.lease),
    sql`${processingJobs.leaseExpiresAt} > now()`,
    checkAccess ? access(database, claim.subject) : undefined,
  );
}
export async function claimVideoRender(
  subject: string,
  projectId: string,
  jobId: string,
  mode: "submit" | "refresh",
): Promise<VideoRenderClaim | null> {
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      await project(transaction, subject, projectId, true);
      const row = await owned(transaction, subject, projectId, jobId);
      if (["ready", "failed", "cancelled"].includes(row.job.status)) return null;
      if (row.job.leaseExpiresAt && row.job.leaseExpiresAt > new Date()) return null;
      if (row.request.providerStartedAt && !row.job.providerJobId) {
        await transaction
          .update(processingJobs)
          .set({
            status: "failed",
            failureCode: "SHOTSTACK_DISPATCH_UNCERTAIN",
            leaseExpiresAt: null,
            updatedAt: sql`now()`,
          })
          .where(eq(processingJobs.id, jobId));
        await transaction
          .update(videoRenderRequests)
          .set({
            errorMessage:
              "The submission outcome is uncertain. It will not be sent again automatically. A new render may incur another charge.",
          })
          .where(eq(videoRenderRequests.jobId, jobId));
        return null;
      }
      if (
        mode === "submit"
          ? Boolean(row.job.providerJobId || row.request.providerStartedAt)
          : !row.job.providerJobId
      )
        return null;
      await budget(transaction, `video-render-poll:${subject}:${projectId}`, 60, "minute");
      const [job] = await transaction
        .update(processingJobs)
        .set({
          status: "processing",
          attempts: sql`${processingJobs.attempts} + 1`,
          leaseExpiresAt: sql`date_trunc('milliseconds', now()) + interval '5 minutes'`,
          updatedAt: sql`now()`,
        })
        .where(and(eq(processingJobs.id, jobId), access(transaction, subject)))
        .returning();
      if (!job?.leaseExpiresAt) return null;
      return { ...row, job, subject, lease: job.leaseExpiresAt };
    }),
  );
}
export async function readVideoRenderClaim(
  claim: VideoRenderClaim,
): Promise<VideoRenderClaim | null> {
  return withDatabase(async (database) => {
    const [row] = await database
      .select(joins)
      .from(processingJobs)
      .innerJoin(videoRenderRequests, eq(videoRenderRequests.jobId, processingJobs.id))
      .leftJoin(assets, eq(assets.id, videoRenderRequests.outputAssetId))
      .where(
        and(leaseMatches(database, claim), eq(videoRenderRequests.ownerClerkId, claim.subject)),
      )
      .limit(1);
    if (!row) return null;
    try {
      const current = await sources(database, claim.job.projectId, row.request.document);
      if (!sameSources(current, row.request.sourceSnapshot)) return null;
    } catch {
      return null;
    }
    // Asset reads may await; check current permission again at the final SQL boundary.
    const [authorized] = await database
      .select({ id: processingJobs.id })
      .from(processingJobs)
      .where(leaseMatches(database, claim))
      .limit(1);
    return authorized ? { ...row, subject: claim.subject, lease: claim.lease } : null;
  });
}
export async function markVideoRenderDispatch(claim: VideoRenderClaim): Promise<boolean> {
  return withDatabase(
    async (database) =>
      (
        await database
          .update(videoRenderRequests)
          .set({ providerStartedAt: sql`now()` })
          .where(
            and(
              eq(videoRenderRequests.jobId, claim.job.id),
              eq(videoRenderRequests.ownerClerkId, claim.subject),
              isNull(videoRenderRequests.providerStartedAt),
              exists(
                database
                  .select({ one: sql`1` })
                  .from(processingJobs)
                  .where(leaseMatches(database, claim)),
              ),
            ),
          )
          .returning()
      ).length === 1,
  );
}
export async function recordVideoProviderJob(
  claim: VideoRenderClaim,
  providerJobId: string,
): Promise<boolean> {
  return withDatabase(
    async (database) =>
      (
        await database
          .update(processingJobs)
          .set({ providerJobId, updatedAt: sql`now()` })
          .where(and(leaseMatches(database, claim), isNull(processingJobs.providerJobId)))
          .returning()
      ).length === 1,
  );
}
export async function releaseVideoRenderLease(claim: VideoRenderClaim): Promise<void> {
  await withDatabase((database) =>
    database
      .update(processingJobs)
      .set({ leaseExpiresAt: null, updatedAt: sql`now()` })
      .where(leaseMatches(database, claim)),
  );
}
export async function failVideoRender(
  claim: VideoRenderClaim,
  code: string,
  message: string,
): Promise<boolean> {
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      const [job] = await transaction
        .update(processingJobs)
        .set({
          status: "failed",
          failureCode: code.slice(0, 80),
          leaseExpiresAt: null,
          updatedAt: sql`now()`,
        })
        .where(leaseMatches(transaction, claim, false))
        .returning();
      if (!job) return false;
      await transaction
        .update(videoRenderRequests)
        .set({ errorMessage: message.slice(0, 500) })
        .where(eq(videoRenderRequests.jobId, job.id));
      return true;
    }),
  );
}
export async function completeVideoRender(
  claim: VideoRenderClaim,
  output: VideoRenderOutput,
): Promise<VideoRenderJob | null> {
  if (
    output.mimeType !== "video/mp4" ||
    output.byteSize <= 0 ||
    output.byteSize > videoEditorSourceMaxBytes ||
    !/^[a-f0-9]{64}$/.test(output.checksumSha256)
  )
    throw new Error("Invalid verified video output.");
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      try {
        await project(transaction, claim.subject, claim.job.projectId, true);
        // Lock the immutable source rows through publication so deletion cannot
        // race the last ready/checksum check after storage latency.
        const current = await sources(
          transaction,
          claim.job.projectId,
          claim.request.document,
          true,
        );
        if (!sameSources(current, claim.request.sourceSnapshot)) return null;
      } catch (error) {
        if (error instanceof BoundaryError) return null;
        throw error;
      }
      const [job] = await transaction
        .update(processingJobs)
        .set({
          status: "ready",
          result: { assetId: claim.job.id },
          leaseExpiresAt: null,
          updatedAt: sql`now()`,
        })
        .where(leaseMatches(transaction, claim))
        .returning();
      if (!job) return null;
      await transaction.insert(assets).values({
        id: job.id,
        projectId: job.projectId,
        ownerClerkId: claim.subject,
        ...output,
        status: "ready",
      });
      await transaction
        .update(videoRenderRequests)
        .set({ outputAssetId: job.id, errorMessage: null })
        .where(eq(videoRenderRequests.jobId, job.id));
      // A failed final authorization throws and rolls back the new asset and ready state.
      return projection(await owned(transaction, claim.subject, job.projectId, job.id));
    }),
  );
}
