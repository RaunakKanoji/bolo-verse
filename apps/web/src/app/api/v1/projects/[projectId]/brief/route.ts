import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { projectBriefMaxBytes, SaveProjectBriefSchema } from "@/lib/contracts/project-briefs";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { readProjectBrief, saveProjectBrief } from "@/server/db/project-briefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string }> };
async function projectId(context: Context) {
  const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
  if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
  return parsed.data;
}
export async function GET(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    return successResponse(await readProjectBrief(subject, await projectId(context)), requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
export async function PUT(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const id = await projectId(context);
    const input = await readMutationJson(request, SaveProjectBriefSchema, { maxBytes: projectBriefMaxBytes });
    return successResponse(await saveProjectBrief(subject, id, input), requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
