import { randomUUID } from "node:crypto";
import { z } from "zod";
import { SaveXRWorkspaceSchema } from "@/lib/contracts/xr-workspace";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { readXRWorkspace, saveXRWorkspace } from "@/server/db/xr-workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string }> };
async function projectId(context: Context): Promise<string> {
  const parsed = z.uuid().safeParse((await context.params).projectId);
  if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
  return parsed.data;
}
export async function GET(_request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    return successResponse(await readXRWorkspace(subject, await projectId(context)), requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
export async function PUT(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const id = await projectId(context);
    const input = await readMutationJson(request, SaveXRWorkspaceSchema);
    return successResponse({ workspace: await saveXRWorkspace(subject, id, input) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
