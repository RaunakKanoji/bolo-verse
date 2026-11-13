import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { CreateVideoRenderSchema } from "@/lib/contracts/video-editor";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { listVideoRenders } from "@/server/db/video-editor";
import { submitVideoRender } from "@/server/services/video-editor";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string }> };
async function projectId(context: Context) {
  const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
  if (!parsed.success)
    throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
  return parsed.data;
}
export async function GET(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    return successResponse(
      { jobs: await listVideoRenders(subject, await projectId(context)) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function POST(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true }),
      id = await projectId(context);
    const input = await readMutationJson(request, CreateVideoRenderSchema, { maxBytes: 2048 });
    return successResponse({ job: await submitVideoRender(subject, id, input) }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
