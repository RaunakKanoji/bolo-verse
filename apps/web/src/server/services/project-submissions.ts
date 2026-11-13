import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import type { ProjectSubmission } from "@/lib/contracts/project-submissions";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv } from "@/server/config/env";
import { createProjectSubmission } from "@/server/db/project-submissions";

async function designatedCreator() {
  const id = getServerEnv().DEMO_CREATOR_CLERK_ID;
  const unavailable = () =>
    new BoundaryError(
      503,
      "PROVIDER_UNCONFIGURED",
      "The designated demo creator must be configured as an existing active Clerk user before submitting a new project.",
    );
  if (!id) throw unavailable();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const user = await Promise.race([
      clerkClient().then((client) => client.users.getUser(id)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(unavailable()), 8000);
      }),
    ]);
    if (user.id !== id || user.banned || user.locked) throw unavailable();
    return user.id;
  } catch {
    throw unavailable();
  } finally {
    clearTimeout(timer);
  }
}
export async function submitProject(subject: string, input: ProjectSubmission) {
  const project = await createProjectSubmission(subject, input, designatedCreator);
  return { projectId: project.id, href: `/projects/${project.id}` };
}
