import "server-only";
import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, exists, ilike, or, sql, type SQL } from "drizzle-orm";
import type { z } from "zod";
import {
  CreateStudioClientSchema,
  CreateStudioProjectSchema,
  CreateStudioTaskSchema,
  DuplicateStudioProjectSchema,
  StudioAssetSchema,
  StudioClientSchema,
  StudioProjectSchema,
  StudioTaskSchema,
  UpdateStudioAssetSchema,
  UpdateStudioClientSchema,
  UpdateStudioProjectSchema,
  UpdateStudioTaskSchema,
  type StudioActivity,
  type StudioListQuery,
} from "@/lib/contracts/workspace";
import { workspaceDownloadSupported } from "@/lib/contracts/workspace-uploads";
import { nativeContentSupported } from "@/lib/contracts/native-assets";
import { previewSupported } from "@/lib/contracts/xr-assets";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import {
  bootstrapPersonalWorkspace,
  consumeProjectCreationBudget,
  projectEditability,
  projectVisibility,
  projectUploadability,
} from "./projects";
import {
  accessGrants,
  assets,
  artifactVersions,
  briefVersions,
  contentVersions,
  projectMembers,
  projects,
  reviewComments,
  reviewDecisions,
  workspaceMembers,
} from "./schema";
import { assetLibraryMetadata, projectTasks, workspaceClients } from "./workspace-schema";
import { brainstormIdeas, brainstormSessions } from "./brainstorm-schema";
const forbidden = () =>
  new BoundaryError(403, "FORBIDDEN", "You do not have access to this workspace resource.");
const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "This item changed or the operation key was already used. Refresh and try again.",
  );
const fingerprint = (input: unknown) =>
  createHash("sha256").update(JSON.stringify(input)).digest("hex");
const escapeSearch = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
function workspaceOwner(
  db: Database,
  subject: string,
  workspaceId: SQL | typeof workspaceClients.workspaceId,
) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.clerkUserId, subject),
          eq(workspaceMembers.role, "owner"),
        ),
      ),
  );
}
async function authorizedProject(db: Database, subject: string, id: string, edit = false) {
  const [row] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, id),
        edit ? projectEditability(db, subject) : projectVisibility(db, subject),
      ),
    )
    .limit(1);
  if (!row) throw forbidden();
  return row;
}
function projectSelect(db: Database, subject: string) {
  return db
    .select({
      project: projects,
      clientName: workspaceClients.name,
      canEdit: sql<boolean>`(${projectEditability(db, subject)})`,
      taskCount: sql<number>`(SELECT count(*)::int FROM project_tasks WHERE project_id=${projects.id})`,
      doneCount: sql<number>`(SELECT count(*)::int FROM project_tasks WHERE project_id=${projects.id} AND status='done')`,
    })
    .from(projects)
    .leftJoin(
      workspaceClients,
      and(
        sql`${projects.studioMetadata}->>'clientId' = ${workspaceClients.id}::text`,
        eq(workspaceClients.workspaceId, projects.workspaceId),
      ),
    );
}
function projectDto(row: Awaited<ReturnType<ReturnType<typeof projectSelect>["execute"]>>[number]) {
  const p = row.project,
    m = p.studioMetadata;
  return StudioProjectSchema.parse({
    id: p.id,
    name: p.name,
    objective: p.objective,
    clientId: m.clientId ?? null,
    clientName: row.clientName,
    type: m.type ?? "Custom",
    status: m.status ?? "active",
    priority: m.priority ?? "normal",
    startDate: m.startDate ?? null,
    dueDate: m.dueDate ?? null,
    revision: p.revision,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    progress:
      Number(row.taskCount) > 0
        ? Math.round((Number(row.doneCount) / Number(row.taskCount)) * 100)
        : null,
    canEdit: row.canEdit,
  });
}
function projectFilters(db: Database, subject: string, q: StudioListQuery) {
  return and(
    projectVisibility(db, subject),
    q.search
      ? or(
          ilike(projects.name, escapeSearch(q.search)),
          ilike(projects.objective, escapeSearch(q.search)),
        )
      : undefined,
    q.status
      ? sql`coalesce(${projects.studioMetadata}->>'status','active')=${q.status}`
      : undefined,
    q.clientId ? sql`${projects.studioMetadata}->>'clientId'=${q.clientId}` : undefined,
    q.type ? sql`coalesce(${projects.studioMetadata}->>'type','Custom')=${q.type}` : undefined,
  );
}
async function listProjects(db: Database, subject: string, q: StudioListQuery) {
  const predicate = projectFilters(db, subject, q);
  const rows = await projectSelect(db, subject)
    .where(predicate)
    .orderBy(
      q.sort === "name"
        ? asc(projects.name)
        : q.sort === "due"
          ? sql`${projects.studioMetadata}->>'dueDate' ASC NULLS LAST`
          : desc(projects.updatedAt),
      projects.id,
    )
    .limit(q.limit)
    .offset(q.offset);
  const [total] = await db.select({ value: count() }).from(projects).where(predicate);
  return { projects: rows.map(projectDto), total: Number(total.value) };
}
export function listStudioProjects(subject: string, q: StudioListQuery) {
  return withDatabase((db) => listProjects(db, subject, q));
}
async function readProject(db: Database, subject: string, id: string) {
  const [row] = await projectSelect(db, subject)
    .where(and(eq(projects.id, id), projectVisibility(db, subject)))
    .limit(1);
  if (!row) throw forbidden();
  return projectDto(row);
}
async function checkClient(
  db: Database,
  subject: string,
  workspaceId: string,
  clientId: string | null | undefined,
) {
  if (!clientId) return;
  const [row] = await db
    .select({ id: workspaceClients.id })
    .from(workspaceClients)
    .where(
      and(
        eq(workspaceClients.id, clientId),
        eq(workspaceClients.workspaceId, workspaceId),
        workspaceOwner(db, subject, workspaceClients.workspaceId),
      ),
    )
    .limit(1);
  if (!row) throw forbidden();
}
async function insertProject(
  db: Database,
  subject: string,
  input: z.infer<typeof CreateStudioProjectSchema>,
  operationHash?: string,
  sourceProjectId?: string,
) {
  const workspace = await bootstrapPersonalWorkspace(db, subject);
  await checkClient(db, subject, workspace.id, input.clientId);
  const hash = operationHash ?? fingerprint(input);
  // Account row serializes exact retries before consuming a durable creation budget.
  await db
    .select({ id: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspace.id),
        eq(workspaceMembers.clerkUserId, subject),
        eq(workspaceMembers.role, "owner"),
      ),
    )
    .for("update");
  const [prior] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, input.idempotencyKey))
    .limit(1);
  if (prior) {
    if (
      prior.workspaceId !== workspace.id ||
      prior.createdByClerkId !== subject ||
      prior.studioMetadata.creationFingerprint !== hash
    )
      throw conflict();
    return readProject(db, subject, prior.id);
  }
  await consumeProjectCreationBudget(db, subject);
  const { idempotencyKey, name, objective, ...metadata } = input;
  const [created] = await db
    .insert(projects)
    .select(
      db
        .select({
          id: sql<string>`${idempotencyKey}::uuid`.as("id"),
          workspaceId: sql<string>`${workspace.id}::uuid`.as("workspaceId"),
          name: sql<string>`${name}`.as("name"),
          objective: sql<string>`${objective}`.as("objective"),
          createdByClerkId: sql<string>`${subject}`.as("createdByClerkId"),
          sample: sql<boolean>`false`.as("sample"),
          studioMetadata: sql<
            typeof projects.$inferSelect.studioMetadata
          >`${JSON.stringify({ ...metadata, status: "active", creationFingerprint: hash })}::jsonb`.as(
            "studioMetadata",
          ),
          revision: sql<number>`1`.as("revision"),
          updatedAt: sql<Date>`now()`.as("updatedAt"),
          createdAt: sql<Date>`now()`.as("createdAt"),
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspace.id),
            eq(workspaceMembers.clerkUserId, subject),
            eq(workspaceMembers.role, "owner"),
            sourceProjectId
              ? exists(
                  db
                    .select({ one: sql`1` })
                    .from(projects)
                    .where(and(eq(projects.id, sourceProjectId), projectEditability(db, subject))),
                )
              : undefined,
          ),
        ),
    )
    .onConflictDoNothing()
    .returning({ id: projects.id });
  if (!created) {
    if (sourceProjectId) await authorizedProject(db, subject, sourceProjectId, true);
    throw conflict();
  }
  await db
    .insert(projectMembers)
    .values({ projectId: created.id, clerkUserId: subject, role: "creator" });
  return readProject(db, subject, created.id);
}
export function createStudioProject(
  subject: string,
  input: z.infer<typeof CreateStudioProjectSchema>,
) {
  return withDatabase((db) => db.transaction((tx) => insertProject(tx, subject, input)));
}
export function updateStudioProject(
  subject: string,
  id: string,
  input: z.infer<typeof UpdateStudioProjectSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const current = await authorizedProject(tx, subject, id, true);
      if (input.clientId !== current.studioMetadata.clientId)
        await checkClient(tx, subject, current.workspaceId, input.clientId);
      const { expectedRevision, name, objective, ...fields } = input;
      const metadata = { ...current.studioMetadata, ...fields };
      if (metadata.startDate && metadata.dueDate && metadata.startDate > metadata.dueDate)
        throw new BoundaryError(400, "INVALID_INPUT", "Due date must follow start date.");
      const [row] = await tx
        .update(projects)
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(objective !== undefined ? { objective } : {}),
          studioMetadata: metadata,
          revision: sql`${projects.revision}+1`,
          updatedAt: sql`now()`,
        })
        .where(
          and(
            eq(projects.id, id),
            eq(projects.revision, expectedRevision),
            projectEditability(tx, subject),
          ),
        )
        .returning({ id: projects.id });
      if (!row) {
        await authorizedProject(tx, subject, id, true);
        throw conflict();
      }
      return readProject(tx, subject, id);
    }),
  );
}
export function duplicateStudioProject(
  subject: string,
  id: string,
  input: z.infer<typeof DuplicateStudioProjectSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), projectEditability(tx, subject)))
        .for("share");
      if (!current) throw forbidden();
      const destination = await bootstrapPersonalWorkspace(tx, subject);
      const m = current.studioMetadata;
      const clone = await insertProject(
        tx,
        subject,
        CreateStudioProjectSchema.parse({
          idempotencyKey: input.idempotencyKey,
          name: input.name ?? `${current.name.slice(0, 113)} (copy)`,
          objective: current.objective,
          clientId: current.workspaceId === destination.id ? (m.clientId ?? null) : null,
          type: m.type ?? "Custom",
          priority: m.priority ?? "normal",
          startDate: m.startDate ?? null,
          dueDate: m.dueDate ?? null,
        }),
        fingerprint({ sourceProjectId: id, input }),
        id,
      );
      await authorizedProject(tx, subject, id, true);
      return clone;
    }),
  );
}
function taskDto(row: { task: typeof projectTasks.$inferSelect; projectName: string }) {
  const { createdByClerkId: _actor, creationFingerprint: _fingerprint, ...task } = row.task;
  void _actor;
  void _fingerprint;
  return StudioTaskSchema.parse({
    ...task,
    projectName: row.projectName,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  });
}
async function listTasks(db: Database, subject: string, projectId?: string) {
  return (
    await db
      .select({ task: projectTasks, projectName: projects.name })
      .from(projectTasks)
      .innerJoin(projects, eq(projects.id, projectTasks.projectId))
      .where(
        and(projectEditability(db, subject), projectId ? eq(projects.id, projectId) : undefined),
      )
      .orderBy(asc(projectTasks.dueDate), desc(projectTasks.createdAt), projectTasks.id)
      .limit(100)
  ).map(taskDto);
}
export function createStudioTask(
  subject: string,
  projectId: string,
  input: z.infer<typeof CreateStudioTaskSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await authorizedProject(tx, subject, projectId, true);
      const hash = fingerprint(input);
      const { idempotencyKey, ...fields } = input;
      await tx
        .insert(projectTasks)
        .select(
          tx
            .select({
              id: sql<string>`${idempotencyKey}::uuid`.as("id"),
              projectId: projects.id,
              title: sql<string>`${fields.title}`.as("title"),
              status: sql<"todo">`'todo'`.as("status"),
              priority: sql<"low" | "normal" | "high">`${fields.priority}`.as("priority"),
              dueDate: sql<string | null>`${fields.dueDate}::date`.as("dueDate"),
              ownerLabel: sql<string>`${fields.ownerLabel}`.as("ownerLabel"),
              createdByClerkId: sql<string>`${subject}`.as("createdByClerkId"),
              creationFingerprint: sql<string>`${hash}`.as("creationFingerprint"),
              revision: sql<number>`1`.as("revision"),
              createdAt: sql<Date>`now()`.as("createdAt"),
              updatedAt: sql<Date>`now()`.as("updatedAt"),
            })
            .from(projects)
            .where(and(eq(projects.id, projectId), projectEditability(tx, subject))),
        )
        .onConflictDoNothing();
      const [row] = await tx
        .select({ task: projectTasks, projectName: projects.name })
        .from(projectTasks)
        .innerJoin(projects, eq(projects.id, projectTasks.projectId))
        .where(
          and(
            eq(projectTasks.id, idempotencyKey),
            eq(projects.id, projectId),
            projectEditability(tx, subject),
          ),
        )
        .limit(1);
      if (!row || row.task.createdByClerkId !== subject || row.task.creationFingerprint !== hash)
        throw conflict();
      return taskDto(row);
    }),
  );
}
export function updateStudioTask(
  subject: string,
  projectId: string,
  taskId: string,
  input: z.infer<typeof UpdateStudioTaskSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const project = await authorizedProject(tx, subject, projectId, true);
      const { expectedRevision, ...fields } = input;
      const [row] = await tx
        .update(projectTasks)
        .set({ ...fields, revision: sql`${projectTasks.revision}+1`, updatedAt: sql`now()` })
        .where(
          and(
            eq(projectTasks.id, taskId),
            eq(projectTasks.projectId, projectId),
            eq(projectTasks.revision, expectedRevision),
            exists(
              tx
                .select({ one: sql`1` })
                .from(projects)
                .where(and(eq(projects.id, projectId), projectEditability(tx, subject))),
            ),
          ),
        )
        .returning();
      if (!row) {
        const [present] = await tx
          .select({ id: projectTasks.id })
          .from(projectTasks)
          .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, projectId)));
        if (!present) throw forbidden();
        throw conflict();
      }
      return taskDto({ task: row, projectName: project.name });
    }),
  );
}
function pendingReview() {
  return and(
    eq(accessGrants.scope, "review"),
    sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
    sql`${accessGrants.revokedAt} IS NULL`,
    sql`${accessGrants.expiresAt}>now()`,
    sql`NOT EXISTS (SELECT 1 FROM review_decisions WHERE content_version_id=${accessGrants.contentVersionId} AND reviewer_clerk_id=${accessGrants.reviewerClerkId})`,
  );
}
async function activity(
  db: Database,
  subject: string,
  projectId?: string,
  clientId?: string,
): Promise<StudioActivity[]> {
  // Only editorial actors receive cross-domain production activity. Reviewer grants
  // never grant a project membership or reveal internal brief/task history.
  const scope = and(
    projectEditability(db, subject),
    projectId ? eq(projects.id, projectId) : undefined,
    clientId ? sql`${projects.studioMetadata}->>'clientId'=${clientId}` : undefined,
  );
  const fields = { projectId: projects.id, projectName: projects.name };
  const groups = await Promise.all([
    db.select({ ...fields, id: artifactVersions.id, createdAt: artifactVersions.createdAt, kind: artifactVersions.kind, version: artifactVersions.version })
      .from(artifactVersions).innerJoin(projects, eq(projects.id, artifactVersions.projectId))
      .where(scope).orderBy(desc(artifactVersions.createdAt)).limit(30)
      .then(rows => rows.map(({kind, version, ...row}) => ({...row, kind: "artifact_saved" as const, title: `${kind} saved · version ${version}`}))),
    db.select({ ...fields, id: brainstormIdeas.id, createdAt: brainstormIdeas.createdAt })
      .from(brainstormIdeas).innerJoin(brainstormSessions, eq(brainstormSessions.id, brainstormIdeas.sessionId))
      .innerJoin(projects, eq(projects.id, brainstormSessions.projectId))
      .where(and(scope, eq(brainstormSessions.ownerClerkId, subject)))
      .orderBy(desc(brainstormIdeas.createdAt)).limit(30)
      .then(rows => rows.map(row => ({...row, kind: "concept_saved" as const, title: "Concept saved"}))),
    db
      .select({ ...fields, id: projects.id, createdAt: projects.createdAt })
      .from(projects)
      .where(scope)
      .orderBy(desc(projects.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({ ...r, kind: "project_created" as const, title: "Project created" })),
      ),
    db
      .select({ ...fields, id: briefVersions.id, createdAt: briefVersions.createdAt })
      .from(briefVersions)
      .innerJoin(projects, eq(projects.id, briefVersions.projectId))
      .where(scope)
      .orderBy(desc(briefVersions.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({ ...r, kind: "brief_updated" as const, title: "Brief updated" })),
      ),
    db
      .select({ ...fields, id: assets.id, createdAt: assets.createdAt })
      .from(assets)
      .innerJoin(projects, eq(projects.id, assets.projectId))
      .where(and(scope, eq(assets.status, "ready")))
      .orderBy(desc(assets.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({ ...r, kind: "asset_uploaded" as const, title: "Asset added" })),
      ),
    db
      .select({ ...fields, id: accessGrants.id, createdAt: accessGrants.createdAt })
      .from(accessGrants)
      .innerJoin(projects, eq(projects.id, accessGrants.projectId))
      .where(
        and(
          scope,
          eq(accessGrants.scope, "review"),
          sql`${accessGrants.reviewerClerkId} IS NOT NULL`,
        ),
      )
      .orderBy(desc(accessGrants.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({
          ...r,
          kind: "review_submitted" as const,
          title: "Submitted for review",
        })),
      ),
    db
      .select({ ...fields, id: reviewComments.id, createdAt: reviewComments.createdAt })
      .from(reviewComments)
      .innerJoin(projects, eq(projects.id, reviewComments.projectId))
      .where(scope)
      .orderBy(desc(reviewComments.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({ ...r, kind: "feedback" as const, title: "Client feedback received" })),
      ),
    db
      .select({
        ...fields,
        id: reviewDecisions.id,
        createdAt: reviewDecisions.createdAt,
        decision: reviewDecisions.decision,
      })
      .from(reviewDecisions)
      .innerJoin(projects, eq(projects.id, reviewDecisions.projectId))
      .where(scope)
      .orderBy(desc(reviewDecisions.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map(({ decision, ...r }) => ({
          ...r,
          kind: decision === "approved" ? ("approved" as const) : ("feedback" as const),
          title: decision === "approved" ? "Deliverable approved" : "Changes requested",
        })),
      ),
    db
      .select({ ...fields, id: projectTasks.id, createdAt: projectTasks.createdAt })
      .from(projectTasks)
      .innerJoin(projects, eq(projects.id, projectTasks.projectId))
      .where(scope)
      .orderBy(desc(projectTasks.createdAt))
      .limit(30)
      .then((rows) =>
        rows.map((r) => ({ ...r, kind: "task_created" as const, title: "Task created" })),
      ),
  ]);
  return groups
    .flat()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id))
    .slice(0, 30)
    .map((r) => ({ ...r, id: `${r.kind}:${r.id}`, createdAt: r.createdAt.toISOString() }));
}
export function readStudioProject(subject: string, id: string) {
  return withDatabase(async (db) => {
    const project = await readProject(db, subject, id);
    return {
      project,
      canEdit: project.canEdit,
      tasks: project.canEdit ? await listTasks(db, subject, id) : [],
      activity: await activity(db, subject, id),
    };
  });
}
function clientSelect(db: Database) {
  return db
    .select({
      client: workspaceClients,
      activeProjects: sql<number>`(SELECT count(*)::int FROM projects WHERE workspace_id="workspace_clients"."workspace_id" AND studio_metadata->>'clientId'="workspace_clients"."id"::text AND coalesce(studio_metadata->>'status','active') IN ('active','in_review'))`,
      pendingReviews: sql<number>`(SELECT count(*)::int FROM access_grants g JOIN projects p ON p.id=g.project_id WHERE p.workspace_id="workspace_clients"."workspace_id" AND p.studio_metadata->>'clientId'="workspace_clients"."id"::text AND g.scope='review' AND g.reviewer_clerk_id IS NOT NULL AND g.revoked_at IS NULL AND g.expires_at>now() AND NOT EXISTS (SELECT 1 FROM review_decisions d WHERE d.content_version_id=g.content_version_id AND d.reviewer_clerk_id=g.reviewer_clerk_id))`,
      lastActivityAt: sql<
        Date | string | null
      >`(SELECT max(updated_at) FROM projects WHERE workspace_id="workspace_clients"."workspace_id" AND studio_metadata->>'clientId'="workspace_clients"."id"::text)`,
    })
    .from(workspaceClients);
}
function clientDto(row: Awaited<ReturnType<ReturnType<typeof clientSelect>["execute"]>>[number]) {
  const {
    createdByClerkId: _actor,
    creationFingerprint: _hash,
    workspaceId: _workspace,
    ...client
  } = row.client;
  void _actor;
  void _hash;
  void _workspace;
  return StudioClientSchema.parse({
    ...client,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    activeProjects: Number(row.activeProjects),
    pendingReviews: Number(row.pendingReviews),
    lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : null,
  });
}
async function readClient(db: Database, subject: string, id: string) {
  const [row] = await clientSelect(db)
    .where(
      and(eq(workspaceClients.id, id), workspaceOwner(db, subject, workspaceClients.workspaceId)),
    )
    .limit(1);
  if (!row) throw forbidden();
  return clientDto(row);
}
export function listStudioClients(subject: string, q: StudioListQuery) {
  return withDatabase(async (db) => {
    const where = and(
      workspaceOwner(db, subject, workspaceClients.workspaceId),
      q.search
        ? or(
            ilike(workspaceClients.name, escapeSearch(q.search)),
            ilike(workspaceClients.organization, escapeSearch(q.search)),
          )
        : undefined,
    );
    const rows = await clientSelect(db)
      .where(where)
      .orderBy(asc(workspaceClients.name), workspaceClients.id)
      .limit(q.limit)
      .offset(q.offset);
    const [total] = await db.select({ value: count() }).from(workspaceClients).where(where);
    return { clients: rows.map(clientDto), total: Number(total.value) };
  });
}
export function readStudioClient(subject: string, id: string) {
  return withDatabase(async (db) => ({
    client: await readClient(db, subject, id),
    projects: (
      await listProjects(db, subject, { clientId: id, limit: 100, offset: 0, sort: "updated" })
    ).projects,
    activity: await activity(db, subject, undefined, id),
  }));
}
export function createStudioClient(
  subject: string,
  input: z.infer<typeof CreateStudioClientSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const workspace = await bootstrapPersonalWorkspace(tx, subject);
      const { idempotencyKey, ...fields } = input;
      const hash = fingerprint(input);
      await tx
        .insert(workspaceClients)
        .select(
          tx
            .select({
              id: sql<string>`${idempotencyKey}::uuid`.as("id"),
              workspaceId: sql<string>`${workspace.id}::uuid`.as("workspaceId"),
              name: sql<string>`${fields.name}`.as("name"),
              organization: sql<string>`${fields.organization}`.as("organization"),
              email: sql<string>`${fields.email}`.as("email"),
              phone: sql<string>`${fields.phone}`.as("phone"),
              notes: sql<string>`${fields.notes}`.as("notes"),
              createdByClerkId: sql<string>`${subject}`.as("createdByClerkId"),
              creationFingerprint: sql<string>`${hash}`.as("creationFingerprint"),
              revision: sql<number>`1`.as("revision"),
              createdAt: sql<Date>`now()`.as("createdAt"),
              updatedAt: sql<Date>`now()`.as("updatedAt"),
            })
            .from(workspaceMembers)
            .where(
              and(
                eq(workspaceMembers.workspaceId, workspace.id),
                eq(workspaceMembers.clerkUserId, subject),
                eq(workspaceMembers.role, "owner"),
              ),
            ),
        )
        .onConflictDoNothing();
      const [row] = await tx
        .select()
        .from(workspaceClients)
        .where(
          and(
            eq(workspaceClients.id, idempotencyKey),
            workspaceOwner(tx, subject, workspaceClients.workspaceId),
          ),
        )
        .limit(1);
      if (
        !row ||
        row.workspaceId !== workspace.id ||
        row.createdByClerkId !== subject ||
        row.creationFingerprint !== hash
      )
        throw conflict();
      return readClient(tx, subject, row.id);
    }),
  );
}
export function updateStudioClient(
  subject: string,
  id: string,
  input: z.infer<typeof UpdateStudioClientSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await readClient(tx, subject, id);
      const { expectedRevision, ...fields } = input;
      const [row] = await tx
        .update(workspaceClients)
        .set({ ...fields, revision: sql`${workspaceClients.revision}+1`, updatedAt: sql`now()` })
        .where(
          and(
            eq(workspaceClients.id, id),
            eq(workspaceClients.revision, expectedRevision),
            workspaceOwner(tx, subject, workspaceClients.workspaceId),
          ),
        )
        .returning({ id: workspaceClients.id });
      if (!row) {
        await readClient(tx, subject, id);
        throw conflict();
      }
      return readClient(tx, subject, id);
    }),
  );
}
const assetCategory = (mime: string) =>
  mime.startsWith("image/")
    ? "image"
    : mime.startsWith("video/")
      ? "video"
      : mime.startsWith("audio/")
        ? "audio"
        : mime.startsWith("model/")
          ? "3d"
          : "document";
function assetSelect(db: Database, subject: string) {
  return db
    .select({
      asset: assets,
      projectName: projects.name,
      metadata: assetLibraryMetadata,
      canEdit: sql<boolean>`(${projectEditability(db, subject)})`,
    })
    .from(assets)
    .innerJoin(projects, eq(projects.id, assets.projectId))
    .leftJoin(assetLibraryMetadata, eq(assetLibraryMetadata.assetId, assets.id));
}
function assetDto(row: Awaited<ReturnType<ReturnType<typeof assetSelect>["execute"]>>[number]) {
  const a = row.asset;
  return StudioAssetSchema.parse({
    id: a.id,
    projectId: a.projectId,
    projectName: row.projectName,
    name: `${assetCategory(a.mimeType)} ${a.id.slice(0, 8)}`,
    mimeType: a.mimeType,
    category: assetCategory(a.mimeType),
    byteSize: a.byteSize,
    width: a.width,
    height: a.height,
    createdAt: a.createdAt.toISOString(),
    contentUrl: previewSupported(a.mimeType, a.byteSize) ? `/api/v1/assets/${a.id}/content` : null,
    downloadUrl: workspaceDownloadSupported(a.mimeType, a.byteSize)
      ? `/api/v1/workspace/assets/${a.id}/download`
      : null,
    nativeContentUrl: nativeContentSupported(a.mimeType, a.byteSize)
      ? `/api/v1/assets/${a.id}/native-content`
      : null,
    collection: row.metadata?.collection ?? "",
    archived: row.metadata?.archived ?? false,
    revision: row.metadata?.revision ?? 0,
    canEdit: row.canEdit,
  });
}
export function listStudioAssets(subject: string, q: StudioListQuery) {
  return withDatabase(async (db) => {
    const category = sql`CASE WHEN ${assets.mimeType} LIKE 'image/%' THEN 'image' WHEN ${assets.mimeType} LIKE 'video/%' THEN 'video' WHEN ${assets.mimeType} LIKE 'audio/%' THEN 'audio' WHEN ${assets.mimeType} LIKE 'model/%' THEN '3d' ELSE 'document' END`;
    const where = and(
      projectEditability(db, subject),
      eq(assets.status, "ready"),
      q.projectId ? eq(projects.id, q.projectId) : undefined,
      q.category ? sql`${category}=${q.category}` : undefined,
      q.collection !== undefined
        ? sql`coalesce(${assetLibraryMetadata.collection},'')=${q.collection}`
        : undefined,
      q.archived
        ? sql`coalesce(${assetLibraryMetadata.archived},false)=${q.archived === "true"}`
        : undefined,
      q.search
        ? or(
            ilike(projects.name, escapeSearch(q.search)),
            ilike(assets.mimeType, escapeSearch(q.search)),
            sql`coalesce(${assetLibraryMetadata.collection},'') ILIKE ${escapeSearch(q.search)}`,
            sql`${assets.id}::text ILIKE ${escapeSearch(q.search)}`,
          )
        : undefined,
    );
    const rows = await assetSelect(db, subject)
      .where(where)
      .orderBy(desc(assets.createdAt), assets.id)
      .limit(q.limit)
      .offset(q.offset);
    const [total] = await db
      .select({ value: count() })
      .from(assets)
      .innerJoin(projects, eq(projects.id, assets.projectId))
      .leftJoin(assetLibraryMetadata, eq(assetLibraryMetadata.assetId, assets.id))
      .where(where);
    return { assets: rows.map(assetDto), total: Number(total.value) };
  });
}
export function updateStudioAsset(
  subject: string,
  id: string,
  input: z.infer<typeof UpdateStudioAssetSchema>,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      const predicate = and(
        eq(assets.id, id),
        eq(assets.status, "ready"),
        projectEditability(tx, subject),
      );
      const [source] = await assetSelect(tx, subject).where(predicate).limit(1);
      if (!source) throw forbidden();
      const { expectedRevision, ...fields } = input;
      const permission = exists(
        tx
          .select({ one: sql`1` })
          .from(assets)
          .innerJoin(projects, eq(projects.id, assets.projectId))
          .where(predicate),
      );
      if (expectedRevision === 0) {
        const [row] = await tx
          .insert(assetLibraryMetadata)
          .select(
            tx
              .select({
                assetId: assets.id,
                projectId: assets.projectId,
                collection: sql<string>`${fields.collection ?? ""}`.as("collection"),
                archived: sql<boolean>`${fields.archived ?? false}`.as("archived"),
                revision: sql<number>`1`.as("revision"),
                updatedAt: sql<Date>`now()`.as("updatedAt"),
              })
              .from(assets)
              .innerJoin(projects, eq(projects.id, assets.projectId))
              .where(predicate),
          )
          .onConflictDoNothing()
          .returning({ id: assetLibraryMetadata.assetId });
        if (!row) throw conflict();
      } else {
        const [row] = await tx
          .update(assetLibraryMetadata)
          .set({
            ...fields,
            revision: sql`${assetLibraryMetadata.revision}+1`,
            updatedAt: sql`now()`,
          })
          .where(
            and(
              eq(assetLibraryMetadata.assetId, id),
              eq(assetLibraryMetadata.revision, expectedRevision),
              permission,
            ),
          )
          .returning({ id: assetLibraryMetadata.assetId });
        if (!row) throw conflict();
      }
      const [result] = await assetSelect(tx, subject).where(predicate).limit(1);
      if (!result) throw forbidden();
      return assetDto(result);
    }),
  );
}
export function studioOverview(subject: string) {
  return withDatabase(async (db) => {
    const visibility = projectEditability(db, subject);
    const [active] = await db
      .select({ value: count() })
      .from(projects)
      .where(
        and(
          visibility,
          sql`coalesce(${projects.studioMetadata}->>'status','active') IN ('active','in_review')`,
        ),
      );
    const [pending] = await db
      .select({ value: count() })
      .from(accessGrants)
      .innerJoin(projects, eq(projects.id, accessGrants.projectId))
      .where(and(visibility, pendingReview()));
    const [completed] = await db
      .select({ value: sql<number>`count(DISTINCT ${contentVersions.id})::int` })
      .from(contentVersions)
      .innerJoin(projects, eq(projects.id, contentVersions.projectId))
      .innerJoin(reviewDecisions, eq(reviewDecisions.contentVersionId, contentVersions.id))
      .where(
        and(
          visibility,
          eq(contentVersions.status, "ready"),
          eq(reviewDecisions.decision, "approved"),
        ),
      );
    const [due] = await db
      .select({ value: count() })
      .from(projects)
      .where(
        and(
          visibility,
          sql`coalesce(${projects.studioMetadata}->>'status','active') IN ('active','in_review')`,
          sql`${projects.studioMetadata}->>'dueDate'>=to_char(current_date,'YYYY-MM-DD') AND ${projects.studioMetadata}->>'dueDate'<=to_char(current_date+7,'YYYY-MM-DD')`,
        ),
      );
    return {
      metrics: {
        activeProjects: Number(active.value),
        pendingReviews: Number(pending.value),
        completedDeliverables: Number(completed.value),
        upcomingDeadlines: Number(due.value),
      },
      projects: (await listProjects(db, subject, { limit: 6, offset: 0, sort: "updated" }))
        .projects,
      tasks: (await listTasks(db, subject)).filter((task) => task.status !== "done"),
      activity: await activity(db, subject),
    };
  });
}

async function authorizeUpload(db: Database, subject: string, projectId: string) {
  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), projectUploadability(db, subject))).limit(1);
  if (!project) throw forbidden();
}

/** Authorize before consuming an untrusted private asset stream. */
export function authorizeWorkspaceUpload(subject: string, projectId: string) {
  return withDatabase(async (db) => {
    await authorizeUpload(db, subject, projectId);
  });
}
export function reserveWorkspaceUpload(
  subject: string,
  input: {
    id: string;
    projectId: string;
    mimeType: string;
    byteSize: number;
    checksumSha256: string;
    objectKey: string;
  },
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await authorizeUpload(tx, subject, input.projectId);
      await tx
        .insert(assets)
        .select(
          tx
            .select({
              id: sql<string>`${input.id}::uuid`.as("id"),
              projectId: projects.id,
              ownerClerkId: sql<string>`${subject}`.as("ownerClerkId"),
              uploadGrantId: sql<string | null>`NULL::uuid`.as("uploadGrantId"),
              objectKey: sql<string>`${input.objectKey}`.as("objectKey"),
              mimeType: sql<string>`${input.mimeType}`.as("mimeType"),
              byteSize: sql<number>`${input.byteSize}::bigint`.as("byteSize"),
              width: sql<number | null>`NULL::int`.as("width"),
              height: sql<number | null>`NULL::int`.as("height"),
              durationSeconds: sql<number | null>`NULL::double precision`.as("durationSeconds"),
              checksumSha256: sql<string>`${input.checksumSha256}`.as("checksumSha256"),
              status: sql<"staging">`'staging'::asset_status`.as("status"),
              createdAt: sql<Date>`now()`.as("createdAt"),
            })
            .from(projects)
            .where(and(eq(projects.id, input.projectId), projectUploadability(tx, subject))),
        )
        .onConflictDoNothing();
      const [row] = await tx
        .select()
        .from(assets)
        .innerJoin(projects, eq(projects.id, assets.projectId))
        .where(
          and(
            eq(assets.id, input.id),
            eq(assets.projectId, input.projectId),
            projectUploadability(tx, subject),
          ),
        )
        .limit(1);
      const asset = row?.assets;
      if (
        !asset ||
        asset.ownerClerkId !== subject ||
        asset.objectKey !== input.objectKey ||
        asset.mimeType !== input.mimeType ||
        asset.byteSize !== input.byteSize ||
        asset.checksumSha256 !== input.checksumSha256 ||
        !["staging", "ready"].includes(asset.status)
      )
        throw conflict();
      return asset;
    }),
  );
}
export function finalizeWorkspaceUpload(
  subject: string,
  projectId: string,
  id: string,
  checksumSha256: string,
) {
  return withDatabase((db) =>
    db.transaction(async (tx) => {
      await authorizeUpload(tx, subject, projectId);
      const [asset] = await tx
        .update(assets)
        .set({ status: "ready" })
        .where(
          and(
            eq(assets.id, id),
            eq(assets.projectId, projectId),
            eq(assets.ownerClerkId, subject),
            eq(assets.checksumSha256, checksumSha256),
            eq(assets.status, "staging"),
            exists(
              tx
                .select({ one: sql`1` })
                .from(projects)
                .where(and(eq(projects.id, projectId), projectUploadability(tx, subject))),
            ),
          ),
        )
        .returning();
      if (asset) return asset;
      const [ready] = await tx
        .select()
        .from(assets)
        .innerJoin(projects, eq(projects.id, assets.projectId))
        .where(
          and(
            eq(assets.id, id),
            eq(assets.projectId, projectId),
            eq(assets.ownerClerkId, subject),
            eq(assets.checksumSha256, checksumSha256),
            eq(assets.status, "ready"),
            projectUploadability(tx, subject),
          ),
        )
        .limit(1);
      if (!ready) throw forbidden();
      return ready.assets;
    }),
  );
}
