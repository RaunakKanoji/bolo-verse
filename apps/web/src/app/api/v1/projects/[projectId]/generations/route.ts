import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { listImageGenerations } from "@/server/db/image-generations";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    const id = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!id.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    return successResponse({ jobs: await listImageGenerations(subject, id.data) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
