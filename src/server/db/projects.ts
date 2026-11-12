import "server-only";
import { and, eq, exists, or, sql } from "drizzle-orm";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase, type Database } from "./client";
import { projectMembers, projects, workspaceMembers, workspaces } from "./schema";

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
