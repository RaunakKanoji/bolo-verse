import "server-only";
import { and, eq, exists, isNull, not, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { withDatabase, type Database } from "./client";
import { assetUploadSessions, imageGenerationRequests } from "./creation-schema";
import { assets, processingJobs } from "./schema";

export type ImageCleanupCandidate = { kind: "upload-staging" | "upload-final" | "generated"; id: string; objectKey: string };
export function validateImageCleanupLimit(limit: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Cleanup batch size must be between 1 and 20.");
}
function unreferenced(database: Database, objectKey: ReturnType<typeof sql> | typeof assetUploadSessions.stagingObjectKey) {
  return not(exists(database.select({ one: sql`1` }).from(assets).where(eq(assets.objectKey, objectKey))));
}
function uploadEligible(database: Database) {
  return and(isNull(assetUploadSessions.stagingDeletedAt), sql`${assetUploadSessions.createdAt} < now() - interval '24 hours'`,
    sql`${assetUploadSessions.expiresAt} < now()`,
    or(eq(assetUploadSessions.status, "ready"), sql`${assetUploadSessions.expiresAt} < now() - interval '24 hours'`),
    eq(assetUploadSessions.stagingObjectKey, sql`'staging/images/' || ${assetUploadSessions.projectId}::text || '/' || ${assetUploadSessions.id}::text`),
    unreferenced(database, assetUploadSessions.stagingObjectKey));
}
function uploadFinalEligible(database: Database) {
  const otherAssets = alias(assets, "cleanup_other_assets");
  const ownedUnpublished = exists(database.select({ one: sql`1` }).from(assets).where(and(
    eq(assets.id, assetUploadSessions.assetId), eq(assets.projectId, assetUploadSessions.projectId),
    eq(assets.ownerClerkId, assetUploadSessions.ownerClerkId), eq(assets.objectKey, assetUploadSessions.finalObjectKey),
    sql`${assets.status} IN ('staging','verifying','failed')`)));
  const protectedObject = exists(database.select({ one: sql`1` }).from(otherAssets).where(and(
    eq(otherAssets.objectKey, assetUploadSessions.finalObjectKey), or(sql`${otherAssets.id} <> ${assetUploadSessions.assetId}`, eq(otherAssets.status, "ready")))));
  return and(isNull(assetUploadSessions.finalDeletedAt), isNull(assetUploadSessions.finalizedAt),
    sql`${assetUploadSessions.expiresAt} < now() - interval '24 hours'`,
    sql`${assetUploadSessions.status} IN ('pending','verifying','failed')`,
    eq(assetUploadSessions.finalObjectKey, sql`'private/images/' || ${assetUploadSessions.projectId}::text || '/' || ${assetUploadSessions.assetId}::text`),
    ownedUnpublished, not(protectedObject));
}
const generatedKey = () => sql<string>`'private/generated/' || ${processingJobs.projectId}::text || '/' || ${processingJobs.id}::text`;
function generationEligible(database: Database) {
  return and(eq(processingJobs.kind, "image_generation"), sql`${processingJobs.status} IN ('failed','cancelled')`,
    sql`${processingJobs.updatedAt} < now() - interval '24 hours'`,
    or(isNull(processingJobs.leaseExpiresAt), sql`${processingJobs.leaseExpiresAt} < now() - interval '24 hours'`),
    exists(database.select({ one: sql`1` }).from(imageGenerationRequests).where(and(eq(imageGenerationRequests.jobId, processingJobs.id), isNull(imageGenerationRequests.outputDeletedAt), isNull(imageGenerationRequests.outputAssetId)))),
    unreferenced(database, generatedKey()));
}
/** Only trusted metadata determines keys; this never enumerates an R2 bucket. */
export async function listImageCleanupCandidates(limit = 20): Promise<ImageCleanupCandidate[]> {
  validateImageCleanupLimit(limit);
  return withDatabase(async (database) => {
    const uploads = await database.select({ id: assetUploadSessions.id, objectKey: assetUploadSessions.stagingObjectKey, age: assetUploadSessions.createdAt }).from(assetUploadSessions).where(uploadEligible(database)).orderBy(assetUploadSessions.createdAt, assetUploadSessions.id).limit(limit);
    const finals = await database.select({ id: assetUploadSessions.id, objectKey: assetUploadSessions.finalObjectKey, age: assetUploadSessions.expiresAt }).from(assetUploadSessions).where(uploadFinalEligible(database)).orderBy(assetUploadSessions.expiresAt, assetUploadSessions.id).limit(limit);
    const generations = await database.select({ id: processingJobs.id, objectKey: generatedKey(), age: processingJobs.updatedAt }).from(processingJobs).where(generationEligible(database)).orderBy(processingJobs.updatedAt, processingJobs.id).limit(limit);
    return [...uploads.map((row) => ({ ...row, kind: "upload-staging" as const })), ...finals.map((row) => ({ ...row, kind: "upload-final" as const })), ...generations.map((row) => ({ ...row, kind: "generated" as const }))]
      .sort((a, b) => a.age.getTime() - b.age.getTime() || a.id.localeCompare(b.id)).slice(0, limit).map(({ kind, id, objectKey }) => ({ kind, id, objectKey }));
  });
}
/** Re-evaluate age, terminal state, exact key, deletion marker and every asset reference. */
export async function imageCleanupCandidateEligible(candidate: ImageCleanupCandidate): Promise<boolean> {
  return withDatabase(async (database) => {
    if (candidate.kind === "upload-staging") return (await database.select({ id: assetUploadSessions.id }).from(assetUploadSessions).where(and(eq(assetUploadSessions.id, candidate.id), eq(assetUploadSessions.stagingObjectKey, candidate.objectKey), uploadEligible(database))).limit(1)).length === 1;
    if (candidate.kind === "upload-final") return (await database.select({ id: assetUploadSessions.id }).from(assetUploadSessions).where(and(eq(assetUploadSessions.id, candidate.id), eq(assetUploadSessions.finalObjectKey, candidate.objectKey), uploadFinalEligible(database))).limit(1)).length === 1;
    if (candidate.kind !== "generated") return false;
    return (await database.select({ id: processingJobs.id }).from(processingJobs).where(and(eq(processingJobs.id, candidate.id), eq(generatedKey(), candidate.objectKey), generationEligible(database))).limit(1)).length === 1;
  });
}
/** Retire the reservation atomically before deleting a final copy. A crash can retry
 * the same failed reservation, while finalization can never publish it afterward. */
export async function prepareImageCleanupCandidate(candidate: ImageCleanupCandidate): Promise<boolean> {
  if (candidate.kind !== "upload-final") return imageCleanupCandidateEligible(candidate);
  const changed = new Error("Upload protection changed during cleanup.");
  return withDatabase(async (database) => {
    try { return await database.transaction(async (transaction) => {
      const predicate = and(eq(assetUploadSessions.id, candidate.id), eq(assetUploadSessions.finalObjectKey, candidate.objectKey), uploadFinalEligible(transaction));
      const [session] = await transaction.select().from(assetUploadSessions).where(predicate).limit(1).for("update");
      if (!session) return false;
      const stillEligible = exists(transaction.select({ one: sql`1` }).from(assetUploadSessions).where(predicate));
      const [asset] = await transaction.update(assets).set({ status: "failed" }).where(and(
        eq(assets.id, session.assetId), eq(assets.projectId, session.projectId), eq(assets.ownerClerkId, session.ownerClerkId),
        eq(assets.objectKey, candidate.objectKey), sql`${assets.status} IN ('staging','verifying','failed')`, stillEligible,
      )).returning({ id: assets.id });
      if (!asset) throw changed;
      const [retired] = await transaction.update(assetUploadSessions).set({ status: "failed" }).where(predicate).returning({ id: assetUploadSessions.id });
      if (!retired) throw changed;
      return true;
    }); } catch (error) { if (error === changed) return false; throw error; }
  });
}
/** A successful idempotent DeleteObject advances the cursor without changing job history. */
export async function markImageCleanupDeleted(candidate: ImageCleanupCandidate): Promise<boolean> {
  return withDatabase(async (database) => {
    if (candidate.kind === "upload-staging") return (await database.update(assetUploadSessions).set({ stagingDeletedAt: sql`now()` }).where(and(eq(assetUploadSessions.id, candidate.id), eq(assetUploadSessions.stagingObjectKey, candidate.objectKey), uploadEligible(database))).returning({ id: assetUploadSessions.id })).length === 1;
    if (candidate.kind === "upload-final") return (await database.update(assetUploadSessions).set({ finalDeletedAt: sql`now()` }).where(and(eq(assetUploadSessions.id, candidate.id), eq(assetUploadSessions.finalObjectKey, candidate.objectKey), eq(assetUploadSessions.status, "failed"), uploadFinalEligible(database))).returning({ id: assetUploadSessions.id })).length === 1;
    if (candidate.kind !== "generated") return false;
    const eligible = exists(database.select({ one: sql`1` }).from(processingJobs).where(and(eq(processingJobs.id, imageGenerationRequests.jobId), eq(processingJobs.id, candidate.id), eq(generatedKey(), candidate.objectKey), generationEligible(database))));
    return (await database.update(imageGenerationRequests).set({ outputDeletedAt: sql`now()` }).where(and(eq(imageGenerationRequests.jobId, candidate.id), isNull(imageGenerationRequests.outputDeletedAt), eligible)).returning({ id: imageGenerationRequests.jobId })).length === 1;
  });
}
