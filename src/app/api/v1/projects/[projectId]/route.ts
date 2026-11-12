import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { UpdateProjectSchema } from "@/lib/contracts/projects";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { projectSummary } from "@/server/db/project-assets";
import { readAuthorizedProject, updateAuthorizedProject } from "@/server/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const project = projectSummary(await readAuthorizedProject(subject, parsed.data));
    return successResponse({ project }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const input = await readMutationJson(request, UpdateProjectSchema);
    const project = projectSummary(await updateAuthorizedProject(subject, parsed.data, input));
    return successResponse({ project }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
