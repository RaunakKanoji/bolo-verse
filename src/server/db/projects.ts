import "server-only";
import { createHash } from "node:crypto";
import { and, eq, exists, inArray, or, sql } from "drizzle-orm";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/contracts/projects";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectMembers, projects, rateLimitBuckets, workspaceMembers, workspaces } from "./schema";

/** Call only with a Clerk-validated server subject, never a request-provided user ID. */
export async function bootstrapPersonalWorkspace(database: Database, subject: string) {
  return database.transaction(async (transaction) => {
    await transaction.insert(workspaces).values({
      name: "My workspace",
      personalOwnerClerkId: subject,
    }).onConflictDoNothing({ target: workspaces.personalOwnerClerkId });

    const [workspace] = await transaction.select().from(workspaces)
      .where(eq(workspaces.personalOwnerClerkId, subject)).limit(1);
    if (!workspace) throw new Error("Workspace bootstrap did not produce a workspace.");
    await transaction.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      clerkUserId: subject,
      role: "owner",
    }).onConflictDoNothing();
    return workspace;
  });
}

function projectVisibility(database: Database, subject: string) {
  return or(
    exists(database.select({ one: sql`1` }).from(projectMembers).where(and(
      eq(projectMembers.projectId, projects.id), eq(projectMembers.clerkUserId, subject),
    ))),
    exists(database.select({ one: sql`1` }).from(workspaceMembers).where(and(
      eq(workspaceMembers.workspaceId, projects.workspaceId),
      eq(workspaceMembers.clerkUserId, subject), eq(workspaceMembers.role, "owner"),
    ))),
  );
}

function projectEditability(database: Database, subject: string) {
  return or(
    exists(database.select({ one: sql`1` }).from(projectMembers).where(and(
      eq(projectMembers.projectId, projects.id), eq(projectMembers.clerkUserId, subject),
      inArray(projectMembers.role, ["creator", "editor"]),
    ))),
    exists(database.select({ one: sql`1` }).from(workspaceMembers).where(and(
      eq(workspaceMembers.workspaceId, projects.workspaceId),
      eq(workspaceMembers.clerkUserId, subject), eq(workspaceMembers.role, "owner"),
    ))),
  );
}

export async function listAuthorizedProjects(subject: string) {
  return withDatabase(async (database) => {
    await bootstrapPersonalWorkspace(database, subject);
    return database.select().from(projects).where(projectVisibility(database, subject)).orderBy(projects.createdAt);
  });
}

export async function readAuthorizedProject(subject: string, projectId: string) {
  return withDatabase(async (database) => {
    const [project] = await database.select().from(projects).where(and(
      eq(projects.id, projectId), projectVisibility(database, subject),
    )).limit(1);
    // Missing and unauthorized IDs deliberately have the same response.
    if (!project) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
    return project;
  });
}

/** Permissions are resolved from persisted membership, never browser-provided roles. */
export async function readProjectAccess(subject: string, projectId: string) {
  return withDatabase(async (database) => {
    const [access] = await database.select({
      project: projects,
      canEdit: sql<boolean>`(${projectEditability(database, subject)})`,
    }).from(projects).where(and(
      eq(projects.id, projectId), projectVisibility(database, subject),
    )).limit(1);
    if (!access) throw new BoundaryError(403, "FORBIDDEN", "You do not have access to this project.");
    return access;
  });
}

async function consumeProjectCreationBudget(database: Database, subject: string) {
  const keyHash = createHash("sha256").update(`project-create:${subject}`).digest("hex");
  // One durable bucket per account/action; PostgreSQL serializes competing upserts.
  // Database time avoids disagreement between serverless instances.
  const [allowed] = await database.insert(rateLimitBuckets).values({
    keyHash, count: 1, windowStart: sql`now()`, expiresAt: sql`now() + interval '1 hour'`,
  }).onConflictDoUpdate({
    target: rateLimitBuckets.keyHash,
    set: {
      count: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
      windowStart: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() ELSE ${rateLimitBuckets.windowStart} END`,
      expiresAt: sql`CASE WHEN ${rateLimitBuckets.expiresAt} <= now() THEN now() + interval '1 hour' ELSE ${rateLimitBuckets.expiresAt} END`,
    },
    setWhere: or(sql`${rateLimitBuckets.expiresAt} <= now()`, sql`${rateLimitBuckets.count} < 10`),
  }).returning({ keyHash: rateLimitBuckets.keyHash });
  if (!allowed) throw new BoundaryError(429, "RATE_LIMITED", "Project creation is limited to 10 projects per hour. Try again later.");
}

export async function createAuthorizedProject(subject: string, input: CreateProjectInput) {
  return withDatabase((database) => database.transaction(async (transaction) => {
    await consumeProjectCreationBudget(transaction, subject);
    const workspace = await bootstrapPersonalWorkspace(transaction, subject);
    const [project] = await transaction.insert(projects).values({
      workspaceId: workspace.id, createdByClerkId: subject, name: input.name, objective: input.objective,
    }).returning();
    if (!project) throw new Error("Project creation did not produce a project.");
    await transaction.insert(projectMembers).values({ projectId: project.id, clerkUserId: subject, role: "creator" });
    return project;
  }));
}

export async function updateAuthorizedProject(subject: string, projectId: string, input: UpdateProjectInput) {
  return withDatabase(async (database) => {
    // Keep the permission predicate in the write, so authorization and update are one statement.
    const [project] = await database.update(projects).set(input).where(and(
      eq(projects.id, projectId), projectEditability(database, subject),
    )).returning();
    if (!project) throw new BoundaryError(403, "FORBIDDEN", "You do not have permission to edit this project.");
    return project;
  });
}
