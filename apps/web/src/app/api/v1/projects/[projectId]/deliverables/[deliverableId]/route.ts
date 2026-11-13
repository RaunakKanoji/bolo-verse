import { z } from "zod";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, successResponse, errorResponse } from "@/server/auth/errors";
import { readDeliverables } from "@/server/db/deliverables";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ projectId: string; deliverableId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const subject = await getV1Subject(request);
    const ids = z.strictObject({ projectId: z.uuid(), deliverableId: z.uuid() }).safeParse(await context.params);
    if (!ids.success) throw new BoundaryError(400, "INVALID_INPUT", "Valid project and version IDs are required.");
    const result = await readDeliverables(subject, ids.data.projectId, ids.data.deliverableId);
    return successResponse({ deliverable: result.deliverables[0] }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
