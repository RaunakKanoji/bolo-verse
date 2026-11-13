import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { BrainstormRequestSchema } from "@/lib/contracts/brainstorm";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { brainstormFromBrief } from "@/server/brainstorm/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const project = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!project.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const input = await readMutationJson(request, BrainstormRequestSchema);
    return successResponse(await brainstormFromBrief(subject, project.data, input, request.signal), requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
