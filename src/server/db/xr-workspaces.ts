import "server-only";
import { and, desc, eq, exists, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { ArtifactPayloadSchema, BriefPayloadSchema, type ArtifactPayload } from "@/lib/contracts/documents";
import {
  createDefaultXRLayout, XRLayoutSchema, XRProjectContentSchema, XRWorkspaceDataSchema, XRWorkspaceSnapshotSchema,
  type XRLayout, type XRProjectContent, type XRWorkspaceData, type XRWorkspaceSnapshot,
} from "@/lib/contracts/xr-workspace";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectEditability, projectVisibility } from "./projects";
import { artifactVersions, assets, briefVersions, projects, reviewComments, reviewDecisions, xrWorkspaces } from "./schema";

function artifactSummary(payload: ArtifactPayload): { title: string; body: string } {
  switch (payload.kind) {
    case "direction": return { title: payload.title, body: [payload.hook, payload.concept, payload.visualTreatment, payload.rationale].join("\n\n") };
    case "script": return { title: "Campaign script", body: [...payload.sections.map((section) => [section.spokenText, section.onScreenText].filter(Boolean).join("\n")), payload.callToAction].filter(Boolean).join("\n\n") };
    case "storyboard": return { title: "Campaign storyboard", body: payload.shots.map((shot, index) => `${index + 1}. ${shot.description}\n${shot.framing}\n${shot.narration}`).join("\n\n") };
    case "note": return { title: "Project note", body: payload.text };
    case "media_edit": return { title: "Media edit", body: `${payload.document.aspectRatio} edit with ${payload.document.clips.length} clips.\n${payload.document.overlays.map((overlay) => overlay.text).join("\n")}` };
  }
}

async function readAccess(database: Database, subject: string, projectId: string) {
  const [access] = await database.select({
    project: { id: projects.id, name: projects.name, objective: projects.objective },
    canEdit: sql<boolean>`(${projectEditability(database, subject)})`,
  }).from(projects).where(and(eq(projects.id, projectId), projectVisibility(database, subject))).limit(1);
  if (!access) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
  return access;
}

async function readContent(database: Database, projectId: string, retained?: XRLayout): Promise<XRProjectContent> {
  const retainedIds = (prefix: string) => (retained?.objects ?? []).filter((object) => object.id.startsWith(prefix)).map((object) => object.id.slice(prefix.length)).filter((id) => z.uuid().safeParse(id).success);
  // A saved version remains an intentional reference, even when new revisions or
  // assets arrive. Reset omits these preferences and selects the latest catalog.
  const briefPreference = sql`CASE WHEN ${inArray(briefVersions.id, retainedIds("brief-"))} THEN 0 ELSE 1 END`;
  const artifactPreference = sql`CASE WHEN ${inArray(artifactVersions.id, retainedIds("artifact-"))} THEN 0 ELSE 1 END`;
  const assetPreference = sql`CASE WHEN ${inArray(assets.id, retainedIds("asset-"))} THEN 0 ELSE 1 END`;
  const [briefRows, artifactRows, assetRows, commentRows, decisionRows] = await Promise.all([
    database.select().from(briefVersions).where(eq(briefVersions.projectId, projectId)).orderBy(briefPreference, desc(briefVersions.version)).limit(1),
    database.selectDistinctOn([artifactVersions.kind]).from(artifactVersions).where(eq(artifactVersions.projectId, projectId)).orderBy(artifactVersions.kind, artifactPreference, desc(artifactVersions.version), desc(artifactVersions.createdAt), artifactVersions.id).limit(5),
    database.select({ id: assets.id, mimeType: assets.mimeType, byteSize: assets.byteSize, width: assets.width, height: assets.height, durationSeconds: assets.durationSeconds }).from(assets).where(and(eq(assets.projectId, projectId), eq(assets.status, "ready"))).orderBy(assetPreference, desc(assets.createdAt), assets.id).limit(40),
    database.select({ id: reviewComments.id, body: reviewComments.comment, contentVersionId: reviewComments.contentVersionId, createdAt: reviewComments.createdAt }).from(reviewComments).where(eq(reviewComments.projectId, projectId)).orderBy(desc(reviewComments.createdAt)).limit(10),
    database.select({ id: reviewDecisions.id, body: reviewDecisions.reason, decision: reviewDecisions.decision, contentVersionId: reviewDecisions.contentVersionId, createdAt: reviewDecisions.createdAt }).from(reviewDecisions).where(eq(reviewDecisions.projectId, projectId)).orderBy(desc(reviewDecisions.createdAt)).limit(10),
  ]);
  const briefRow = briefRows[0];
  const brief = briefRow ? BriefPayloadSchema.parse(briefRow.payload) : null;
  return XRProjectContentSchema.parse({
    brief: brief && briefRow ? {
      id: briefRow.id, title: `${brief.product} brief`, status: briefRow.status,
      body: [brief.objective, `Audience: ${brief.audience}`, `Tone: ${brief.tone}`, ...brief.facts.map((fact) => fact.text), ...brief.prohibitedClaims.map((claim) => `Do not claim: ${claim}`), ...brief.constraints].join("\n\n").slice(0, 6000),
    } : null,
    artifacts: artifactRows.map((row) => {
      const summary = artifactSummary(ArtifactPayloadSchema.parse(row.payload));
      return { id: row.id, kind: row.kind, title: summary.title.slice(0, 160), body: summary.body.slice(0, 6000) };
    }),
    assets: assetRows,
    reviews: [
      ...commentRows.map((row) => ({ ...row, body: row.body.slice(0, 6000), kind: "comment" as const, decision: null, createdAt: row.createdAt.toISOString() })),
      ...decisionRows.map((row) => ({ ...row, body: (row.body ?? "").slice(0, 6000), kind: "decision" as const, createdAt: row.createdAt.toISOString() })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
  });
}

function snapshot(row: typeof xrWorkspaces.$inferSelect): XRWorkspaceSnapshot {
  return XRWorkspaceSnapshotSchema.parse({ id: row.id, projectId: row.projectId, version: row.version, layout: row.layout, updatedAt: row.updatedAt.toISOString() });
}

export async function readXRWorkspace(subject: string, projectId: string): Promise<XRWorkspaceData> {
  return withDatabase(async (database) => {
    const access = await readAccess(database, subject, projectId);
    const rows = await database.select().from(xrWorkspaces).where(eq(xrWorkspaces.projectId, projectId)).limit(1);
    const saved = rows[0] ? snapshot(rows[0]) : undefined;
    const content = await readContent(database, projectId, saved?.layout);
    const workspace = saved ?? { id: null, projectId, version: 0, layout: createDefaultXRLayout(content), updatedAt: null };
    return XRWorkspaceDataSchema.parse({ ...access, workspace, content });
  });
}

function validateCanonicalLayout(layout: XRLayout, content: XRProjectContent): void {
  const known = new Map(createDefaultXRLayout(content).objects.map((object) => [object.id, object]));
  for (const object of layout.objects) {
    const canonical = known.get(object.id);
    if (!canonical || canonical.type !== object.type || canonical.assetId !== object.assetId) {
      throw new BoundaryError(400, "INVALID_INPUT", "The layout references content that is not available in this project. Reload the workspace.");
    }
  }
}

function authorizedAssets(database: Database, projectId: string, layout: XRLayout) {
  return and(...layout.objects.flatMap((object) => object.assetId ? [exists(
    database.select({ one: sql`1` }).from(assets).where(and(
      eq(assets.id, object.assetId), eq(assets.projectId, projectId), eq(assets.status, "ready"),
      object.type === "model" ? inArray(assets.mimeType, ["model/gltf-binary", "model/gltf+json"]) : undefined,
    )),
  )] : []));
}

async function writeLayout(database: Database, subject: string, projectId: string, expectedVersion: number, layout: XRLayout): Promise<XRWorkspaceSnapshot> {
  // Both creation and update evaluate membership and asset readiness in the write
  // statement. A preceding read is only for validation and conflict diagnostics.
  if (expectedVersion === 0) {
    const [created] = await database.insert(xrWorkspaces).select(database.select({
      id: sql<string>`gen_random_uuid()`.as("id"), projectId: projects.id,
      version: sql<number>`1`.as("version"), layout: sql<XRLayout>`${JSON.stringify(layout)}::jsonb`.as("layout"),
      createdAt: sql<Date>`now()`.as("created_at"), updatedAt: sql<Date>`now()`.as("updated_at"),
    }).from(projects).where(and(eq(projects.id, projectId), projectEditability(database, subject), authorizedAssets(database, projectId, layout))))
      .onConflictDoNothing({ target: xrWorkspaces.projectId }).returning();
    if (created) return snapshot(created);
  } else {
    const [updated] = await database.update(xrWorkspaces).set({ layout, version: expectedVersion + 1, updatedAt: sql`now()` }).where(and(
      eq(xrWorkspaces.projectId, projectId), eq(xrWorkspaces.version, expectedVersion),
      exists(database.select({ one: sql`1` }).from(projects).where(and(eq(projects.id, projectId), projectEditability(database, subject)))),
      authorizedAssets(database, projectId, layout),
    )).returning();
    if (updated) return snapshot(updated);
  }
  const access = await readAccess(database, subject, projectId);
  if (!access.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this workspace.");
  validateCanonicalLayout(layout, await readContent(database, projectId, layout));
  throw new BoundaryError(409, "CONFLICT", "The workspace changed since you loaded it. Reload the saved layout before saving again.");
}

export async function saveXRWorkspace(subject: string, projectId: string, input: { expectedVersion: number; layout: XRLayout }): Promise<XRWorkspaceSnapshot> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const access = await readAccess(transaction, subject, projectId);
    if (!access.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this workspace.");
    const layout = XRLayoutSchema.parse(input.layout);
    validateCanonicalLayout(layout, await readContent(transaction, projectId, layout));
    return writeLayout(transaction, subject, projectId, input.expectedVersion, layout);
  }));
}

export async function resetXRWorkspace(subject: string, projectId: string, expectedVersion: number): Promise<XRWorkspaceSnapshot> {
  return withDatabase((database) => database.transaction(async (transaction) => {
    const access = await readAccess(transaction, subject, projectId);
    if (!access.canEdit) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this workspace.");
    const layout = createDefaultXRLayout(await readContent(transaction, projectId));
    return writeLayout(transaction, subject, projectId, expectedVersion, layout);
  }));
}
