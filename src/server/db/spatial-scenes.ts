import "server-only";
import { createHash } from "node:crypto";
import { and, eq, exists, inArray, or, sql } from "drizzle-orm";
import { SaveSpatialSceneSchema, SpatialSceneSnapshotSchema, type CanonicalSpatialScene, type SaveSpatialScene, type SpatialSceneSnapshot } from "@/lib/contracts/spatial-scene";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectEditability, projectVisibility } from "./projects";
import { assets, projects, rateLimitBuckets, spatialScenes } from "./schema";

async function readScene(database: Database, subject: string, projectId: string): Promise<SpatialSceneSnapshot> {
  const [row] = await database.select({
    projectId: projects.id, canEdit: sql<boolean>`(${projectEditability(database, subject)})`,
    scene: { sceneId: spatialScenes.sceneId, revision: spatialScenes.revision, document: spatialScenes.document, updatedAt: spatialScenes.updatedAt },
  }).from(projects).leftJoin(spatialScenes, eq(spatialScenes.projectId, projects.id))
    .where(and(eq(projects.id, projectId), projectVisibility(database, subject))).limit(1);
  if (!row) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
  return SpatialSceneSnapshotSchema.parse({
    projectId: row.projectId, sceneId: row.scene?.sceneId ?? row.projectId,
    revision: row.scene?.revision ?? 0, document: row.scene?.document ?? { sceneId: row.projectId, version: 1, objects: [] },
    updatedAt: row.scene?.updatedAt.toISOString() ?? null, canEdit: row.canEdit,
  });
}

const referencedAssetIds = (document: CanonicalSpatialScene) => [...new Set(document.objects.map(({ assetId }) => assetId))];
async function validateAssets(database: Database, projectId: string, document: CanonicalSpatialScene) {
  const ids = referencedAssetIds(document);
  if (!ids.length) return;
  const found = await database.select({ id: assets.id }).from(assets).where(and(eq(assets.projectId, projectId), eq(assets.status, "ready"), inArray(assets.id, ids)));
  if (found.length !== ids.length) throw new BoundaryError(400, "INVALID_INPUT", "The scene references assets that are not available in this project.");
}
function authorizedAssets(database: Database, projectId: string, document: CanonicalSpatialScene) {
  return and(...referencedAssetIds(document).map((assetId) => exists(database.select({ one: sql`1` }).from(assets).where(and(
    eq(assets.id, assetId), eq(assets.projectId, projectId), eq(assets.status, "ready"),
  )))));
}
async function consumeWriteBudget(database: Database, subject: string) {
  const keyHash = createHash("sha256").update(`spatial-scene-save:${subject}`).digest("hex");
  const [allowed] = await database.insert(rateLimitBuckets).values({
    keyHash, count: 1, windowStart: sql`now()`, expiresAt: sql`now() + interval '1 minute'`,
  }).onConflictDoUpdate({
    target: rateLimitBuckets.keyHash,
    set: {
      count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 minute' ELSE ${rateLimitBuckets.expiresAt} END`,
    },
    setWhere: or(sql`${rateLimitBuckets.expiresAt} <= now()`, sql`${rateLimitBuckets.count} < 60`),
  }).returning({ keyHash: rateLimitBuckets.keyHash });
  if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Scenes can be saved up to 60 times per minute. Try again shortly.");
}
function snapshot(row: typeof spatialScenes.$inferSelect): SpatialSceneSnapshot {
  return SpatialSceneSnapshotSchema.parse({ projectId: row.projectId, sceneId: row.sceneId, revision: row.revision, document: row.document, updatedAt: row.updatedAt.toISOString(), canEdit: true });
}
export async function readSpatialScene(subject: string, projectId: string) {
  return withDatabase((database) => readScene(database, subject, projectId));
}
export async function saveSpatialScene(subject: string, projectId: string, input: SaveSpatialScene) {
  const { expectedRevision, document } = SaveSpatialSceneSchema.parse(input);
  return withDatabase((database) => database.transaction(async (transaction) => {
    const access = await readScene(transaction, subject, projectId);
    if (!access.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this project.");
    if (document.sceneId !== projectId) throw new BoundaryError(400, "INVALID_INPUT", "The scene identity must match this project's canonical scene.");
    await validateAssets(transaction, projectId, document);
    await consumeWriteBudget(transaction, subject);
    // Recheck role and every ready asset in the write, not only diagnostic reads.
    if (expectedRevision === 0) {
      const [created] = await transaction.insert(spatialScenes).select(transaction.select({
        projectId: projects.id, sceneId: projects.id,
        revision: sql<number>`1`.as("revision"), document: sql<CanonicalSpatialScene>`${JSON.stringify(document)}::jsonb`.as("document"),
        createdAt: sql<Date>`now()`.as("created_at"), updatedAt: sql<Date>`now()`.as("updated_at"),
      }).from(projects).where(and(eq(projects.id, projectId), projectEditability(transaction, subject), authorizedAssets(transaction, projectId, document))))
        .onConflictDoNothing({ target: spatialScenes.projectId }).returning();
      if (created) return snapshot(created);
    } else {
      const [updated] = await transaction.update(spatialScenes).set({ document, revision: expectedRevision + 1, updatedAt: sql`now()` }).where(and(
        eq(spatialScenes.projectId, projectId), eq(spatialScenes.revision, expectedRevision),
        exists(transaction.select({ one: sql`1` }).from(projects).where(and(eq(projects.id, projectId), projectEditability(transaction, subject)))),
        authorizedAssets(transaction, projectId, document),
      )).returning();
      if (updated) return snapshot(updated);
    }
    const current = await readScene(transaction, subject, projectId);
    if (!current.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this project.");
    await validateAssets(transaction, projectId, document);
    throw new BoundaryError(409, "CONFLICT", "The scene changed in another session. Keep your local changes or reload the saved scene before saving again.");
  }));
}
