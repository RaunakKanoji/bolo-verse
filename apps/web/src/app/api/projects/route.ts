import { randomUUID } from "node:crypto";
import { CreateProjectSchema } from "@/lib/contracts/projects";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { projectSummary } from "@/server/db/project-assets";
import { createAuthorizedProject, listAuthorizedProjects } from "@/server/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    const projects = (await listAuthorizedProjects(subject)).map(projectSummary);
    return successResponse({ projects }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const input = await readMutationJson(request, CreateProjectSchema);
    const project = projectSummary(await createAuthorizedProject(subject, input));
    return successResponse({ project }, requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
