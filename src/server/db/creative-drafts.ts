import "server-only";
import { createHash } from "node:crypto";
import { and, eq, exists, or, sql } from "drizzle-orm";
import {
  createEmptyCreativeDraftDocument, CreativeDraftSnapshotSchema, SaveCreativeDraftSchema,
  type CreativeDraftDocument, type CreativeDraftSnapshot, type SaveCreativeDraft,
} from "@/lib/contracts/shape";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectEditability, projectVisibility } from "./projects";
import { creativeDrafts, projects, rateLimitBuckets } from "./schema";

async function readDraft(database: Database, subject: string, projectId: string): Promise<CreativeDraftSnapshot> {
  // The authorization and private-author predicates are part of the same read.
  const [row] = await database.select({
    projectId: projects.id,
    canEdit: sql<boolean>`(${projectEditability(database, subject)})`,
    draft: { revision: creativeDrafts.revision, document: creativeDrafts.document, updatedAt: creativeDrafts.updatedAt },
  }).from(projects).leftJoin(creativeDrafts, and(eq(creativeDrafts.projectId, projects.id), eq(creativeDrafts.ownerClerkId, subject)))
    .where(and(eq(projects.id, projectId), projectVisibility(database, subject))).limit(1);
  if (!row) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
  return CreativeDraftSnapshotSchema.parse({
    projectId: row.projectId, canEdit: row.canEdit,
    revision: row.draft?.revision ?? 0,
    document: row.draft?.document ?? createEmptyCreativeDraftDocument(),
    updatedAt: row.draft?.updatedAt.toISOString() ?? null,
  });
}

function snapshot(row: typeof creativeDrafts.$inferSelect): CreativeDraftSnapshot {
  return CreativeDraftSnapshotSchema.parse({ projectId: row.projectId, revision: row.revision, document: row.document, updatedAt: row.updatedAt.toISOString(), canEdit: true });
}

async function consumeDraftWriteBudget(database: Database, subject: string) {
  const keyHash = createHash("sha256").update(`creative-draft-save:${subject}`).digest("hex");
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
  if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Prompt drafts can be saved up to 60 times per minute. Try again shortly.");
}

export async function readCreativeDraft(subject: string, projectId: string): Promise<CreativeDraftSnapshot> {
  return withDatabase((database) => readDraft(database, subject, projectId));
}

export async function saveCreativeDraft(subject: string, projectId: string, input: SaveCreativeDraft): Promise<CreativeDraftSnapshot> {
  const { expectedRevision, document } = SaveCreativeDraftSchema.parse(input);
  return withDatabase((database) => database.transaction(async (transaction) => {
    const access = await readDraft(transaction, subject, projectId);
    if (!access.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this project.");
    await consumeDraftWriteBudget(transaction, subject);
    // Membership is checked again inside each write statement; the initial read
    // is only for diagnostics. SQL CAS prevents concurrent tabs overwriting text.
    if (expectedRevision === 0) {
      const [created] = await transaction.insert(creativeDrafts).select(transaction.select({
        id: sql<string>`gen_random_uuid()`.as("id"), projectId: projects.id,
        ownerClerkId: sql<string>`${subject}`.as("owner_clerk_id"), revision: sql<number>`1`.as("revision"),
        document: sql<CreativeDraftDocument>`${JSON.stringify(document)}::jsonb`.as("document"),
        createdAt: sql<Date>`now()`.as("created_at"), updatedAt: sql<Date>`now()`.as("updated_at"),
      }).from(projects).where(and(eq(projects.id, projectId), projectEditability(transaction, subject))))
        .onConflictDoNothing({ target: [creativeDrafts.projectId, creativeDrafts.ownerClerkId] }).returning();
      if (created) return snapshot(created);
    } else {
      const [updated] = await transaction.update(creativeDrafts).set({ document, revision: expectedRevision + 1, updatedAt: sql`now()` }).where(and(
        eq(creativeDrafts.projectId, projectId), eq(creativeDrafts.ownerClerkId, subject), eq(creativeDrafts.revision, expectedRevision),
        exists(transaction.select({ one: sql`1` }).from(projects).where(and(eq(projects.id, projectId), projectEditability(transaction, subject)))),
      )).returning();
      if (updated) return snapshot(updated);
    }
    const current = await readDraft(transaction, subject, projectId);
    if (!current.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this project.");
    throw new BoundaryError(409, "CONFLICT", "This draft changed in another session. Keep your local text or reload the saved draft before saving again.");
  }));
}
