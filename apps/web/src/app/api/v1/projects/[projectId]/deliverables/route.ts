import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { PublishDeliverableSchema } from "@/lib/contracts/deliverables";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, successResponse, errorResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { readDeliverables } from "@/server/db/deliverables";
import { publishDeliverable } from "@/server/services/deliverables";
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
  try { return successResponse(await readDeliverables(await getV1Subject(request), await projectId(context)), requestId); }
  catch (error) { return errorResponse(error, requestId); }
}
export async function POST(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const id = await projectId(context);
    const input = await readMutationJson(request, PublishDeliverableSchema);
    return successResponse({ deliverable: await publishDeliverable(subject, id, input, request.signal) }, requestId, 201);
  } catch (error) { return errorResponse(error, requestId); }
}
