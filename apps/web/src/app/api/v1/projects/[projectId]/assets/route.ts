import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { listAuthorizedProjectAssets } from "@/server/db/project-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    return successResponse(await listAuthorizedProjectAssets(subject, parsed.data), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
