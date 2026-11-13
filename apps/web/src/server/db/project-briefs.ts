import "server-only";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { BriefPayloadSchema } from "@/lib/contracts/documents";
import { SaveProjectBriefSchema, serializeBriefForAI, type ProjectBriefResult, type SaveProjectBrief } from "@/lib/contracts/project-briefs";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase } from "./client";
import { projectEditability, projectIntakeSubmitter, projectVisibility } from "./projects";
import { briefVersions, projects } from "./schema";

const forbidden = () => new BoundaryError(403, "FORBIDDEN", "You do not have access to this project brief.");
const conflict = () => new BoundaryError(409, "CONFLICT", "This brief changed or this request was already used. Your local text is safe; load the latest saved brief before saving again.");
function result(row: typeof briefVersions.$inferSelect | undefined, canEdit: boolean): ProjectBriefResult {
  return { brief: row ? BriefPayloadSchema.parse(row.payload) : null, version: row?.version ?? 0, savedAt: row?.createdAt.toISOString() ?? null, canEdit };
}

export async function readProjectBrief(subject: string, projectId: string): Promise<ProjectBriefResult> {
  return withDatabase(async (database) => {
    // The authorized project remains the left side even when there is no visible brief.
    // Intake clients can read their own submitted v1 brief; later proposed creator revisions stay private.
    const canEdit = projectEditability(database, subject);
    const [row] = await database.select({ canEdit: sql<boolean>`(${canEdit})`, brief: briefVersions })
      .from(projects).leftJoin(briefVersions, and(eq(briefVersions.projectId, projects.id), or(canEdit, eq(briefVersions.status, "approved"), and(projectIntakeSubmitter(database, subject), eq(briefVersions.version, 1), eq(briefVersions.authorClerkId, subject)))))
      .where(and(eq(projects.id, projectId), projectVisibility(database, subject)))
      .orderBy(desc(briefVersions.version)).limit(1);
    if (!row) throw forbidden();
    return result(row.brief ?? undefined, row.canEdit);
  });
}

export async function saveProjectBrief(subject: string, projectId: string, input: SaveProjectBrief): Promise<ProjectBriefResult> {
  const { brief, expectedVersion, idempotencyKey } = SaveProjectBriefSchema.parse(input);
  return withDatabase((database) => database.transaction(async (transaction) => {
    // Every brief writer takes the same persisted project lock, including first writes.
    // The existing project/version unique constraint provides an additional DB backstop.
    const [project] = await transaction.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, projectId), projectEditability(transaction, subject))).for("update");
    if (!project) throw forbidden();
    const [retry] = await transaction.select().from(briefVersions).where(eq(briefVersions.id, idempotencyKey)).limit(1);
    if (retry) {
      if (retry.projectId !== projectId || retry.authorClerkId !== subject || retry.version !== expectedVersion + 1 || serializeBriefForAI(retry.payload) !== serializeBriefForAI(brief)) throw conflict();
      return result(retry, true);
    }
    const [latest] = await transaction.select({ version: briefVersions.version }).from(briefVersions)
      .where(eq(briefVersions.projectId, projectId)).orderBy(desc(briefVersions.version)).limit(1);
    if ((latest?.version ?? 0) !== expectedVersion) throw conflict();
    // Permission is also part of the insert statement, not a client-provided claim.
    const [saved] = await transaction.insert(briefVersions).select(transaction.select({
      id: sql<string>`${idempotencyKey}::uuid`.as("id"), projectId: projects.id,
      version: sql<number>`${expectedVersion + 1}::integer`.as("version"),
      payload: sql<typeof brief>`${JSON.stringify(brief)}::jsonb`.as("payload"),
      authorClerkId: sql<string>`${subject}`.as("author_clerk_id"), status: sql<"proposed">`'proposed'::brief_status`.as("status"),
      createdAt: sql<Date>`now()`.as("created_at"),
    }).from(projects).where(and(eq(projects.id, projectId), projectEditability(transaction, subject))))
      .onConflictDoNothing().returning();
    if (!saved) throw conflict();
    return result(saved, true);
  }));
}
