import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ResetXRWorkspaceSchema } from "@/lib/contracts/xr-workspace";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { resetXRWorkspace } from "@/server/db/xr-workspaces";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const parsed = z.uuid().safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const input = await readMutationJson(request, ResetXRWorkspaceSchema);
    return successResponse({ workspace: await resetXRWorkspace(subject, parsed.data, input.expectedVersion) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
