import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, exists, inArray, or, sql } from "drizzle-orm";
import type { CreateImageUpload } from "@/lib/contracts/creation";
import { AssetSummarySchema } from "@/lib/contracts/shape";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { assetUploadSessions } from "./creation-schema";
import { projectUploadability } from "./projects";
import { assets, projects, rateLimitBuckets } from "./schema";

type Upload = typeof assetUploadSessions.$inferSelect;
function forbidden() { return new BoundaryError(403, "FORBIDDEN", "This image upload is unavailable or you do not have permission to use it."); }
function uploadable(database: Database, subject: string, projectId: string) {
  return exists(database.select({ one: sql`1` }).from(projects).where(and(eq(projects.id, projectId), projectUploadability(database, subject))));
}
function sameReservation(row: Upload, input: CreateImageUpload) {
  return row.fileName === input.fileName && row.mimeType === input.mimeType && row.byteSize === input.byteSize && row.checksumSha256 === input.checksumSha256;
}
async function consumeUploadBudget(database: Database, subject: string) {
  const keyHash = createHash("sha256").update(`image-upload:${subject}`).digest("hex");
  const [allowed] = await database.insert(rateLimitBuckets).values({ keyHash, count: 1, windowStart: sql`now()`, expiresAt: sql`now() + interval '1 minute'` })
    .onConflictDoUpdate({ target: rateLimitBuckets.keyHash, set: {
      count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 minute' ELSE ${rateLimitBuckets.expiresAt} END`,
    }, setWhere: or(sql`${rateLimitBuckets.expiresAt} <= now()`, sql`${rateLimitBuckets.count} < 20`) }).returning({ keyHash: rateLimitBuckets.keyHash });
  if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Create up to 20 image upload sessions per minute. Try again shortly.");
}
/** Resolve identity + project upload permission inside the same SQL statement as every private read. */
async function readOwnedUpload(database: Database, subject: string, uploadId: string) {
  const [row] = await database.select({ upload: assetUploadSessions, asset: assets,
    unexpired: sql<boolean>`${assetUploadSessions.expiresAt} > now()` }).from(assetUploadSessions)
    .innerJoin(projects, eq(projects.id, assetUploadSessions.projectId))
    .innerJoin(assets, and(eq(assets.id, assetUploadSessions.assetId), eq(assets.projectId, assetUploadSessions.projectId)))
    .where(and(eq(assetUploadSessions.id, uploadId), eq(assetUploadSessions.ownerClerkId, subject), projectUploadability(database, subject))).limit(1);
  if (!row) throw forbidden();
  if (row.upload.status === "ready" && row.asset.status === "ready") return row;
  if (!row.unexpired || !["pending", "verifying"].includes(row.upload.status) || !["staging", "verifying"].includes(row.asset.status)) {
    throw new BoundaryError(409, "CONFLICT", "This image upload session has expired or cannot be finalized. Create a new upload session.");
  }
  return row;
}
export function readOwnedImageUpload(subject: string, uploadId: string) {
  return withDatabase((database) => readOwnedUpload(database, subject, uploadId));
}
/** Reserve an asset identity first; staging URLs can never replace the final object. */
export async function createAssetUploadSession(subject: string, input: CreateImageUpload): Promise<Upload> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const [project] = await transaction.select({ id: projects.id }).from(projects).where(and(eq(projects.id, input.projectId), projectUploadability(transaction, subject))).limit(1);
    if (!project) throw forbidden();
    // Serialize this actor/idempotency scope before allocating either persistent identity.
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`image-upload:${input.projectId}:${subject}:${input.idempotencyKey}`}, 0))`);
    const [existing] = await transaction.select().from(assetUploadSessions).where(and(
      eq(assetUploadSessions.projectId, input.projectId), eq(assetUploadSessions.ownerClerkId, subject), eq(assetUploadSessions.idempotencyKey, input.idempotencyKey), uploadable(transaction, subject, input.projectId),
    )).limit(1);
    if (existing) {
      if (!sameReservation(existing, input)) throw new BoundaryError(409, "CONFLICT", "This upload request key has already been used for a different image.");
      const current = await readOwnedUpload(transaction, subject, existing.id);
      if (!current.unexpired) throw new BoundaryError(409, "CONFLICT", "This image upload session expired. Create a new upload session.");
      return current.upload;
    }
    await consumeUploadBudget(transaction, subject);
    const uploadId = randomUUID(), assetId = randomUUID();
    const stagingObjectKey = `staging/images/${input.projectId}/${uploadId}`;
    const finalObjectKey = `private/images/${input.projectId}/${assetId}`;
    const [asset] = await transaction.insert(assets).select(transaction.select({
      id: sql<string>`${assetId}::uuid`.as("id"), projectId: projects.id,
      ownerClerkId: sql<string>`${subject}`.as("owner_clerk_id"), uploadGrantId: sql<null>`NULL`.as("upload_grant_id"),
      objectKey: sql<string>`${finalObjectKey}`.as("object_key"), mimeType: sql<string>`${input.mimeType}`.as("mime_type"),
      byteSize: sql<number>`${input.byteSize}::bigint`.as("byte_size"), width: sql<null>`NULL::integer`.as("width"), height: sql<null>`NULL::integer`.as("height"),
      durationSeconds: sql<null>`NULL::double precision`.as("duration_seconds"), checksumSha256: sql<string>`${input.checksumSha256}`.as("checksum_sha256"),
      status: sql<"staging">`'staging'::asset_status`.as("status"), createdAt: sql<Date>`now()`.as("created_at"),
    }).from(projects).where(and(eq(projects.id, input.projectId), projectUploadability(transaction, subject)))).returning();
    if (!asset) throw forbidden();
    // The insert-select repeats authorization after the asset reservation await.
    const [upload] = await transaction.insert(assetUploadSessions).select(transaction.select({
      id: sql<string>`${uploadId}::uuid`.as("id"), projectId: projects.id, ownerClerkId: sql<string>`${subject}`.as("owner_clerk_id"),
      assetId: sql<string>`${assetId}::uuid`.as("asset_id"), idempotencyKey: sql<string>`${input.idempotencyKey}`.as("idempotency_key"),
      stagingObjectKey: sql<string>`${stagingObjectKey}`.as("staging_object_key"), finalObjectKey: sql<string>`${finalObjectKey}`.as("final_object_key"),
      fileName: sql<string>`${input.fileName}`.as("file_name"), mimeType: sql<string>`${input.mimeType}`.as("mime_type"),
      byteSize: sql<number>`${input.byteSize}::bigint`.as("byte_size"), checksumSha256: sql<string>`${input.checksumSha256}`.as("checksum_sha256"),
      status: sql<"pending">`'pending'`.as("status"), expiresAt: sql<Date>`now() + interval '10 minutes'`.as("expires_at"),
      createdAt: sql<Date>`now()`.as("created_at"), updatedAt: sql<Date>`now()`.as("updated_at"), finalizedAt: sql<null>`NULL::timestamptz`.as("finalized_at"), stagingDeletedAt: sql<null>`NULL::timestamptz`.as("staging_deleted_at"), finalDeletedAt: sql<null>`NULL::timestamptz`.as("final_deleted_at"),
    }).from(projects).where(and(eq(projects.id, input.projectId), projectUploadability(transaction, subject)))).returning();
    if (!upload) throw forbidden();
    return upload;
  }));
}
export function imageAssetSummary(asset: typeof assets.$inferSelect) {
  return AssetSummarySchema.parse({ id: asset.id, projectId: asset.projectId, mimeType: asset.mimeType,
    byteSize: asset.byteSize, width: asset.width, height: asset.height, durationSeconds: asset.durationSeconds,
    createdAt: asset.createdAt.toISOString(), contentUrl: `/api/v1/assets/${asset.id}/content`, nativeContentUrl: null });
}
/** Publish metadata only after the immutable final bytes exist and still-authorized SQL CAS succeeds. */
export async function completeImageUpload(subject: string, uploadId: string, dimensions: { width: number; height: number }) {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const { upload, asset } = await readOwnedUpload(transaction, subject, uploadId);
    if (upload.status === "ready") return imageAssetSummary(asset);
    const sessionPredicate = and(eq(assetUploadSessions.id, uploadId), eq(assetUploadSessions.ownerClerkId, subject),
      inArray(assetUploadSessions.status, ["pending", "verifying"]), sql`${assetUploadSessions.expiresAt} > now()`, uploadable(transaction, subject, upload.projectId));
    const [readyAsset] = await transaction.update(assets).set({ ...dimensions, status: "ready" }).where(and(
      eq(assets.id, upload.assetId), eq(assets.projectId, upload.projectId), eq(assets.ownerClerkId, subject),
      eq(assets.objectKey, upload.finalObjectKey), inArray(assets.status, ["staging", "verifying"]),
      exists(transaction.select({ one: sql`1` }).from(assetUploadSessions).where(sessionPredicate)),
    )).returning();
    if (!readyAsset) {
      const current = await readOwnedUpload(transaction, subject, uploadId);
      if (current.upload.status === "ready") return imageAssetSummary(current.asset);
      throw new BoundaryError(409, "CONFLICT", "This upload changed during finalization. Retry the request.");
    }
    const [readyUpload] = await transaction.update(assetUploadSessions).set({ status: "ready", updatedAt: sql`now()`, finalizedAt: sql`now()` }).where(sessionPredicate).returning();
    if (!readyUpload) throw forbidden();
    return imageAssetSummary(readyAsset);
  }));
}
