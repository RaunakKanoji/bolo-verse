import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { SaveVideoEditorDraftSchema, videoEditorMaxBytes } from "@/lib/contracts/video-editor";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { readVideoEditorDraft, saveVideoEditorDraft } from "@/server/db/video-editor";
import { getVideoEditorCapabilities } from "@/server/providers/shotstack";
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
      {
        draft: await readVideoEditorDraft(subject, await projectId(context)),
        capabilities: getVideoEditorCapabilities(),
      },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function PUT(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const id = await projectId(context);
    const input = await readMutationJson(request, SaveVideoEditorDraftSchema, {
      maxBytes: videoEditorMaxBytes,
    });
    return successResponse(
      {
        draft: await saveVideoEditorDraft(subject, id, input),
        capabilities: getVideoEditorCapabilities(),
      },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
