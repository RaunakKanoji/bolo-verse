import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, exists, isNull, lte, or, sql } from "drizzle-orm";
import { CreateImageGenerationSchema, ImageGenerationJobSchema, imageGenerationReferenceMaxBytes, type CreateImageGeneration, type ImageGenerationJob, type CreationImageMime } from "@/lib/contracts/creation";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { imageGenerationRequests } from "./creation-schema";
import { projectEditability, projectVisibility } from "./projects";
import { assets, processingJobs, projects, projectMembers, rateLimitBuckets, workspaceMembers } from "./schema";

const kind = "image_generation";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const forbidden = () => new BoundaryError(403, "FORBIDDEN", "This generation is not available to your account.");
const joins = { job: processingJobs, request: imageGenerationRequests, reference: assets };
export type ImageGenerationClaim = { job: typeof processingJobs.$inferSelect; request: typeof imageGenerationRequests.$inferSelect; reference: typeof assets.$inferSelect | null };
export type ImageGenerationOutput = { objectKey: string; mimeType: CreationImageMime; byteSize: number; width: number; height: number; checksumSha256: string };
function projection({ job, request }: Pick<ImageGenerationClaim, "job" | "request">): ImageGenerationJob {
  return ImageGenerationJobSchema.parse({ id: job.id, projectId: job.projectId, status: job.status, prompt: request.prompt, modelId: request.modelId, aspectRatio: request.aspectRatio, referenceAssetId: request.referenceAssetId, outputAssetId: request.outputAssetId, errorCode: job.failureCode, errorMessage: request.errorMessage, createdAt: job.createdAt.toISOString(), updatedAt: job.updatedAt.toISOString() });
}
function authorized(database: Database, subject: string, edit = true) {
  return exists(database.select({ one: sql`1` }).from(projects).where(and(eq(projects.id, processingJobs.projectId), edit ? projectEditability(database, subject) : projectVisibility(database, subject))));
}
function workerAuthorized(database: Database) {
  const editor = exists(database.select({ one: sql`1` }).from(projectMembers).where(and(eq(projectMembers.projectId, projects.id), eq(projectMembers.clerkUserId, imageGenerationRequests.ownerClerkId), sql`${projectMembers.role} IN ('creator','editor')`)));
  const owner = exists(database.select({ one: sql`1` }).from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, projects.workspaceId), eq(workspaceMembers.clerkUserId, imageGenerationRequests.ownerClerkId), eq(workspaceMembers.role, "owner"))));
  return exists(database.select({ one: sql`1` }).from(imageGenerationRequests).innerJoin(projects, eq(projects.id, imageGenerationRequests.projectId)).where(and(eq(imageGenerationRequests.jobId, processingJobs.id), or(editor, owner))));
}
function leaseMatches(database: Database, jobId: string, lease: Date, checkAccess = true) {
  return and(eq(processingJobs.id, jobId), eq(processingJobs.kind, kind), eq(processingJobs.status, "processing"), eq(processingJobs.leaseExpiresAt, lease), sql`${processingJobs.leaseExpiresAt} > now()`, checkAccess ? workerAuthorized(database) : undefined);
}
async function readOwned(database: Database, subject: string, jobId: string) {
  const [row] = await database.select({ job: processingJobs, request: imageGenerationRequests }).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).where(and(eq(processingJobs.id, jobId), eq(processingJobs.kind, kind), eq(imageGenerationRequests.ownerClerkId, subject), authorized(database, subject, false))).limit(1);
  if (!row) throw forbidden();
  return row;
}
async function quota(database: Database, subject: string) {
  const keyHash = hash(`image-generation:${subject}`);
  const [allowed] = await database.insert(rateLimitBuckets).values({ keyHash, count: 1, windowStart: sql`now()`, expiresAt: sql`now() + interval '1 hour'` }).onConflictDoUpdate({ target: rateLimitBuckets.keyHash, set: { count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`, windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`, expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 hour' ELSE ${rateLimitBuckets.expiresAt} END` }, setWhere: or(lte(rateLimitBuckets.expiresAt, sql`now()`), sql`${rateLimitBuckets.count} < 10`) }).returning({ keyHash: rateLimitBuckets.keyHash });
  if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Image generation is limited to 10 requests per hour.");
}
export async function createImageGeneration(subject: string, untrusted: CreateImageGeneration): Promise<ImageGenerationJob> {
  const input = CreateImageGenerationSchema.parse(untrusted);
  const requestHash = hash(JSON.stringify({ prompt: input.prompt, modelId: input.modelId, aspectRatio: input.aspectRatio, referenceAssetId: input.referenceAssetId }));
  const idempotencyKey = hash(`${input.projectId}:${subject}:${input.idempotencyKey}`);
  return withDatabase((database) => database.transaction(async (transaction) => {
    const [project] = await transaction.select({ id: projects.id }).from(projects).where(and(eq(projects.id, input.projectId), projectEditability(transaction, subject))).limit(1);
    if (!project) throw forbidden();
    const [existing] = await transaction.select({ job: processingJobs, request: imageGenerationRequests }).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).where(and(eq(processingJobs.projectId, input.projectId), eq(processingJobs.kind, kind), eq(processingJobs.idempotencyKey, idempotencyKey))).limit(1);
    if (existing) { if (existing.request.requestHash !== requestHash) throw new BoundaryError(409, "CONFLICT", "This request key has already been used for different settings."); return projection(existing); }
    if (input.referenceAssetId) {
      const [reference] = await transaction.select({ id: assets.id }).from(assets).where(and(eq(assets.id, input.referenceAssetId), eq(assets.projectId, input.projectId), eq(assets.status, "ready"), sql`${assets.mimeType} IN ('image/png','image/jpeg','image/webp')`, sql`${assets.byteSize} > 0 AND ${assets.byteSize} <= ${imageGenerationReferenceMaxBytes}`)).limit(1);
      if (!reference) throw new BoundaryError(400, "INVALID_INPUT", "Choose a ready image up to 10 MiB in this project.");
    }
    const [job] = await transaction.insert(processingJobs).values({ projectId: input.projectId, kind, idempotencyKey }).onConflictDoNothing({ target: [processingJobs.projectId, processingJobs.kind, processingJobs.idempotencyKey] }).returning();
    if (!job) {
      const [winner] = await transaction.select({ job: processingJobs, request: imageGenerationRequests }).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).where(and(eq(processingJobs.projectId, input.projectId), eq(processingJobs.kind, kind), eq(processingJobs.idempotencyKey, idempotencyKey))).limit(1);
      if (!winner || winner.request.requestHash !== requestHash) throw new BoundaryError(409, "CONFLICT", "This request key has already been used for different settings.");
      return projection(winner);
    }
    const [request] = await transaction.insert(imageGenerationRequests).values({ jobId: job.id, projectId: input.projectId, ownerClerkId: subject, prompt: input.prompt, modelId: input.modelId, aspectRatio: input.aspectRatio, referenceAssetId: input.referenceAssetId, requestHash }).returning();
    await quota(transaction, subject);
    const [confirmed] = await transaction.update(processingJobs).set({ updatedAt: sql`now()` }).where(and(eq(processingJobs.id, job.id), authorized(transaction, subject))).returning({ id: processingJobs.id });
    if (!confirmed) throw forbidden();
    return projection({ job, request });
  }));
}
export async function listImageGenerations(subject: string, projectId: string): Promise<ImageGenerationJob[]> {
  return withDatabase(async (database) => {
    const [project] = await database.select({ id: projects.id }).from(projects).where(and(eq(projects.id, projectId), projectVisibility(database, subject))).limit(1);
    if (!project) throw forbidden();
    return (await database.select({ job: processingJobs, request: imageGenerationRequests }).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).where(and(eq(processingJobs.projectId, projectId), eq(processingJobs.kind, kind), eq(imageGenerationRequests.ownerClerkId, subject), authorized(database, subject, false))).orderBy(desc(processingJobs.createdAt), desc(processingJobs.id)).limit(50)).map(projection);
  });
}
export async function readImageGeneration(subject: string, jobId: string): Promise<ImageGenerationJob> { return withDatabase(async (database) => projection(await readOwned(database, subject, jobId))); }
export async function cancelImageGeneration(subject: string, jobId: string): Promise<ImageGenerationJob> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    await readOwned(transaction, subject, jobId);
    const [editable] = await transaction.select({ id: processingJobs.id }).from(processingJobs).where(and(eq(processingJobs.id, jobId), authorized(transaction, subject))).limit(1);
    if (!editable) throw forbidden();
    const owner = exists(transaction.select({ one: sql`1` }).from(imageGenerationRequests).where(and(eq(imageGenerationRequests.jobId, processingJobs.id), eq(imageGenerationRequests.ownerClerkId, subject))));
    await transaction.update(processingJobs).set({ status: "cancelled", leaseExpiresAt: null, updatedAt: sql`now()` }).where(and(eq(processingJobs.id, jobId), eq(processingJobs.kind, kind), sql`${processingJobs.status} IN ('queued','processing')`, owner, authorized(transaction, subject)));
    return projection(await readOwned(transaction, subject, jobId));
  }));
}
export async function claimImageGeneration(jobId?: string): Promise<ImageGenerationClaim | null> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const [candidate] = await transaction.select({ id: processingJobs.id }).from(processingJobs).where(and(eq(processingJobs.kind, kind), eq(processingJobs.status, "queued"), jobId ? eq(processingJobs.id, jobId) : undefined, workerAuthorized(transaction))).orderBy(processingJobs.createdAt).limit(1).for("update", { skipLocked: true });
    if (!candidate) return null;
    // Match JavaScript Date precision exactly when this timestamp is used as the lease token.
    const [job] = await transaction.update(processingJobs).set({ status: "processing", attempts: sql`${processingJobs.attempts} + 1`, leaseExpiresAt: sql`date_trunc('milliseconds', now()) + interval '5 minutes'`, updatedAt: sql`now()` }).where(and(eq(processingJobs.id, candidate.id), eq(processingJobs.status, "queued"), workerAuthorized(transaction))).returning();
    if (!job) return null;
    const [row] = await transaction.select(joins).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).leftJoin(assets, eq(assets.id, imageGenerationRequests.referenceAssetId)).where(eq(processingJobs.id, job.id));
    return row ?? null;
  }));
}
export async function markImageProviderStarted(jobId: string, lease: Date): Promise<boolean> {
  return withDatabase(async (database) => {
    const valid = exists(database.select({ one: sql`1` }).from(processingJobs).where(and(eq(processingJobs.id, imageGenerationRequests.jobId), leaseMatches(database, jobId, lease))));
    return (await database.update(imageGenerationRequests).set({ providerStartedAt: sql`now()` }).where(and(eq(imageGenerationRequests.jobId, jobId), isNull(imageGenerationRequests.providerStartedAt), valid)).returning({ id: imageGenerationRequests.jobId })).length === 1;
  });
}
export async function readClaimedImageGeneration(jobId: string, lease: Date): Promise<ImageGenerationClaim | null> {
  return withDatabase(async (database) => (await database.select(joins).from(processingJobs).innerJoin(imageGenerationRequests, eq(imageGenerationRequests.jobId, processingJobs.id)).leftJoin(assets, eq(assets.id, imageGenerationRequests.referenceAssetId)).where(leaseMatches(database, jobId, lease)).limit(1))[0] ?? null);
}
export async function completeImageGeneration(jobId: string, lease: Date, image: ImageGenerationOutput): Promise<ImageGenerationJob | null> {
  const permissionChanged = new Error("Generation permission changed during completion.");
  return withDatabase(async (database) => {
    try { return await database.transaction(async (transaction) => {
    const assetId = randomUUID();
    const [job] = await transaction.update(processingJobs).set({ status: "ready", result: { assetId }, leaseExpiresAt: null, updatedAt: sql`now()` }).where(leaseMatches(transaction, jobId, lease)).returning();
    if (!job) return null;
    const [request] = await transaction.select().from(imageGenerationRequests).where(eq(imageGenerationRequests.jobId, jobId));
    await transaction.insert(assets).values({ id: assetId, projectId: request.projectId, ownerClerkId: request.ownerClerkId, ...image, status: "ready" });
    const [updated] = await transaction.update(imageGenerationRequests).set({ outputAssetId: assetId, errorMessage: null }).where(eq(imageGenerationRequests.jobId, jobId)).returning();
    // Recheck after the intervening database awaits. Roll back the asset and both
    // state changes if membership was revoked while completion was running.
    const [confirmed] = await transaction.update(processingJobs).set({ updatedAt: sql`now()` }).where(and(eq(processingJobs.id, jobId), workerAuthorized(transaction))).returning({ id: processingJobs.id });
    if (!confirmed) throw permissionChanged;
    return projection({ job, request: updated });
    }); } catch (error) { if (error === permissionChanged) return null; throw error; }
  });
}
export async function failImageGeneration(jobId: string, lease: Date, code: string, message: string): Promise<boolean> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const [job] = await transaction.update(processingJobs).set({ status: "failed", failureCode: code.slice(0, 80), leaseExpiresAt: null, updatedAt: sql`now()` }).where(leaseMatches(transaction, jobId, lease, false)).returning();
    if (!job) return false;
    await transaction.update(imageGenerationRequests).set({ errorMessage: message.slice(0, 500) }).where(eq(imageGenerationRequests.jobId, jobId));
    return true;
  }));
}
export async function recoverExpiredImageGenerations(): Promise<number> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const jobs = await transaction.update(processingJobs).set({ status: "failed", failureCode: "INTERRUPTED", leaseExpiresAt: null, updatedAt: sql`now()` }).where(and(eq(processingJobs.kind, kind), eq(processingJobs.status, "processing"), lte(processingJobs.leaseExpiresAt, sql`now()`))).returning({ id: processingJobs.id });
    for (const job of jobs) await transaction.update(imageGenerationRequests).set({ errorMessage: "This generation was interrupted. Submit a new request to try again." }).where(eq(imageGenerationRequests.jobId, job.id));
    return jobs.length;
  }));
}
