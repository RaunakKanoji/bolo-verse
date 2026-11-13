import "server-only";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  ProjectSubmissionSchema,
  submissionBrief,
  type ProjectSubmission,
} from "@/lib/contracts/project-submissions";
import { BoundaryError } from "@/server/auth/errors";
import { withDatabase } from "./client";
import { bootstrapPersonalWorkspace, consumeProjectCreationBudget, projectVisibility } from "./projects";
import { briefVersions, projectMembers, projects, workspaces } from "./schema";

const conflict = () =>
  new BoundaryError(
    409,
    "CONFLICT",
    "This submission ID was already used. Keep the original submission or start a new project.",
  );
/** Creator resolution is server-owned and read-only; never accept a creator ID from the browser. */
export async function createProjectSubmission(
  subject: string,
  raw: ProjectSubmission,
  resolveCreator: () => Promise<string>,
) {
  const input = ProjectSubmissionSchema.parse(raw);
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return withDatabase((database) =>
    database.transaction(async (transaction) => {
      const retry = async () => {
        const [prior] = await transaction
          .select()
          .from(projects)
          .where(eq(projects.id, input.idempotencyKey))
          .limit(1);
        if (!prior) return null;
        if (prior.createdByClerkId !== subject || prior.studioMetadata.creationFingerprint !== hash)
          throw conflict();
        const [authorized] = await transaction
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.id, prior.id), projectVisibility(transaction, subject)))
          .limit(1);
        if (!authorized)
          throw new BoundaryError(403, "FORBIDDEN", "You no longer have access to this submitted project.");
        return prior;
      };
      // Acknowledging an exact persisted retry never changes membership or requires current demo config.
      const prior = await retry();
      if (prior) return prior;
      const creator = await resolveCreator();
      if (creator === subject)
        throw new BoundaryError(403, "FORBIDDEN", "Submit using a client account distinct from the designated creator.");
      const workspace = await bootstrapPersonalWorkspace(transaction, creator);
      await transaction
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.id, workspace.id))
        .for("update");
      const serializedRetry = await retry();
      if (serializedRetry) return serializedRetry;
      await consumeProjectCreationBudget(transaction, subject);
      const [project] = await transaction
        .insert(projects)
        .values({
          id: input.idempotencyKey,
          workspaceId: workspace.id,
          createdByClerkId: subject,
          name: input.name,
          objective: input.description,
          studioMetadata: {
            intakeVersion: 1,
            status: "active",
            type: input.contentType,
            dueDate: input.deadline,
            creationFingerprint: hash,
          },
        })
        .onConflictDoNothing()
        .returning();
      if (!project) throw conflict();
      await transaction
        .insert(projectMembers)
        .values({ projectId: project.id, clerkUserId: subject, role: "client" });
      if (creator !== subject)
        await transaction
          .insert(projectMembers)
          .values({ projectId: project.id, clerkUserId: creator, role: "editor" });
      await transaction
        .insert(briefVersions)
        .values({
          projectId: project.id,
          version: 1,
          authorClerkId: subject,
          payload: submissionBrief(input),
          status: "proposed",
        });
      return project;
    }),
  );
}
