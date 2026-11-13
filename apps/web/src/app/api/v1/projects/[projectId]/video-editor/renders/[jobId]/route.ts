import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readVideoRender } from "@/server/db/video-editor";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string; jobId: string }> };
export async function GET(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request),
      params = await context.params;
    const projectId = ResourceIdSchema.safeParse(params.projectId),
      jobId = ResourceIdSchema.safeParse(params.jobId);
    if (!projectId.success || !jobId.success)
      throw new BoundaryError(400, "INVALID_INPUT", "Valid project and render IDs are required.");
    return successResponse(
      { job: await readVideoRender(subject, projectId.data, jobId.data) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
