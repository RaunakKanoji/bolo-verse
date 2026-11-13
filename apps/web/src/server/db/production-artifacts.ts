import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  ProductionVersionSchema,
  SaveProductionArtifactSchema,
  type ProductionPayload,
  type SaveProductionArtifact,
  type ProductionLibrary,
} from "@/lib/contracts/production-artifacts";
import { BriefPayloadSchema } from "@/lib/contracts/documents";
import { BoundaryError } from "@/server/auth/errors";
import { brainstormIdeas, brainstormSessions } from "./brainstorm-schema";
import { withDatabase, type Database } from "./client";
import { projectEditability } from "./projects";
import {
  artifactVersions,
  briefVersions,
  projects,
  projectMembers,
  workspaceMembers,
  assets,
} from "./schema";
const forbidden = () =>
  new BoundaryError(
    403,
    "FORBIDDEN",
    "This project's internal production artifacts are unavailable to your account.",
  );
const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "The saved version changed or this request ID was already used. Your local edits are kept; load saved history before saving again.",
  );
const invalidSource = () =>
  new BoundaryError(
    400,
    "INVALID_INPUT",
    "Select saved source versions from this project with the required artifact kind.",
  );
const kinds = ["direction", "script", "storyboard", "note"] as const;
const dto = (row: typeof artifactVersions.$inferSelect) =>
  ProductionVersionSchema.parse({
    id: row.id,
    projectId: row.projectId,
    kind: row.kind,
    version: row.version,
    artifact: row.payload,
    savedAt: row.createdAt.toISOString(),
  });

async function lockAccess(db: Database, subject: string, projectId: string, write: boolean) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(db, subject)))
    .for(write ? "update" : "share");
  if (!project) throw forbidden();
  // Lock the persisted grants through the transaction, then recheck after waits.
  await db
    .select()
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.clerkUserId, subject)))
    .for("share");
  await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.clerkUserId, subject),
      ),
    )
    .for("share");
  const [current] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), projectEditability(db, subject)));
  if (!current) throw forbidden();
}
async function source(db: Database, projectId: string, id: string, kind?: string) {
  const [row] = await db
    .select()
    .from(artifactVersions)
    .where(and(eq(artifactVersions.id, id), eq(artifactVersions.projectId, projectId)))
    .limit(1);
  if (!row || (kind && row.kind !== kind)) throw invalidSource();
  return row;
}
async function sources(db: Database, projectId: string, payload: ProductionPayload) {
  let briefId: string | null = null,
    artifactId: string | null = null;
  if (payload.kind === "direction" || payload.kind === "script") briefId = payload.briefVersionId;
  if (payload.kind === "script") {
    artifactId = payload.directionVersionId;
    const direction = await source(db, projectId, artifactId, "direction");
    if (direction.payload.kind !== "direction" || direction.payload.briefVersionId !== briefId)
      throw invalidSource();
  }
  if (payload.kind === "storyboard") {
    artifactId = payload.scriptVersionId;
    const script = await source(db, projectId, artifactId, "script");
    if (script.payload.kind !== "script") throw invalidSource();
    briefId = script.payload.briefVersionId;
    const assetIds = [...new Set(payload.shots.flatMap((shot) => shot.assetIds))];
    if (assetIds.length) {
      const available = await db
        .select({ id: assets.id })
        .from(assets)
        .where(
          and(
            eq(assets.projectId, projectId),
            eq(assets.status, "ready"),
            inArray(assets.id, assetIds),
          ),
        );
      if (available.length !== assetIds.length) throw invalidSource();
    }
  }
  if (payload.kind === "note") {
    if (payload.linkedArtifactVersionId) {
      artifactId = payload.linkedArtifactVersionId;
      const linked = await source(db, projectId, artifactId);
      briefId = linked.sourceBriefVersionId;
      if (
        payload.shotId &&
        (linked.payload.kind !== "storyboard" ||
          !linked.payload.shots.some((shot) => shot.id === payload.shotId))
      )
        throw invalidSource();
    } else if (payload.shotId || payload.timecodeSeconds !== undefined) throw invalidSource();
  }
  if (briefId) {
    const [brief] = await db
      .select({ id: briefVersions.id })
      .from(briefVersions)
      .where(and(eq(briefVersions.id, briefId), eq(briefVersions.projectId, projectId)))
      .limit(1);
    if (!brief) throw invalidSource();
  }
  return { sourceBriefVersionId: briefId, sourceArtifactVersionId: artifactId };
}
export async function readProductionLibrary(
  subject: string,
  projectId: string,
): Promise<ProductionLibrary> {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await lockAccess(tx, subject, projectId, false);
      const versions = await tx
        .select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.projectId, projectId),
            inArray(artifactVersions.kind, [...kinds]),
          ),
        )
        .orderBy(desc(artifactVersions.version), desc(artifactVersions.createdAt))
        .limit(200);
      const briefs = await tx
        .select()
        .from(briefVersions)
        .where(eq(briefVersions.projectId, projectId))
        .orderBy(desc(briefVersions.version))
        .limit(200);
      const ideas = await tx
        .select({
          id: brainstormIdeas.id,
          title: brainstormIdeas.title,
          description: brainstormIdeas.description,
        })
        .from(brainstormIdeas)
        .innerJoin(brainstormSessions, eq(brainstormSessions.id, brainstormIdeas.sessionId))
        .where(
          and(
            eq(brainstormSessions.projectId, projectId),
            eq(brainstormSessions.ownerClerkId, subject),
          ),
        )
        .orderBy(desc(brainstormIdeas.createdAt))
        .limit(100);
      return {
        ideas,
        versions: versions.map(dto),
        briefs: briefs.map((row) => ({
          id: row.id,
          version: row.version,
          brief: BriefPayloadSchema.parse(row.payload),
        })),
        generation: "unavailable",
      };
    }),
  );
}
export async function saveProductionArtifact(
  subject: string,
  projectId: string,
  input: SaveProductionArtifact,
) {
  const { artifact, idempotencyKey, expectedVersion } = SaveProductionArtifactSchema.parse(input);
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await lockAccess(tx, subject, projectId, true);
      const [retry] = await tx
        .select()
        .from(artifactVersions)
        .where(eq(artifactVersions.id, idempotencyKey))
        .limit(1);
      if (retry) {
        const parsed = SaveProductionArtifactSchema.safeParse({
          artifact: retry.payload,
          expectedVersion: retry.version - 1,
          idempotencyKey: retry.id,
        });
        if (
          retry.projectId !== projectId ||
          retry.authorClerkId !== subject ||
          !parsed.success ||
          JSON.stringify(parsed.data) !==
            JSON.stringify({ idempotencyKey, expectedVersion, artifact })
        )
          throw conflict();
        return dto(retry);
      }
      const [latest] = await tx
        .select({ version: artifactVersions.version })
        .from(artifactVersions)
        .where(
          and(eq(artifactVersions.projectId, projectId), eq(artifactVersions.kind, artifact.kind)),
        )
        .orderBy(desc(artifactVersions.version))
        .limit(1);
      if ((latest?.version ?? 0) !== expectedVersion) throw conflict();
      const [count] = await tx
        .select({ total: sql<number>`count(*)::integer` })
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.projectId, projectId),
            inArray(artifactVersions.kind, [...kinds]),
          ),
        );
      if (count.total >= 200)
        throw new BoundaryError(
          429,
          "RATE_LIMITED",
          "This project has reached the 200 saved production-version limit.",
        );
      const refs = await sources(tx, projectId, artifact);
      const [saved] = await tx
        .insert(artifactVersions)
        .values({
          id: idempotencyKey,
          projectId,
          kind: artifact.kind,
          version: expectedVersion + 1,
          payload: artifact,
          ...refs,
          authorClerkId: subject,
        })
        .onConflictDoNothing()
        .returning();
      if (!saved) throw conflict();
      return dto(saved);
    }),
  );
}
