import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { SaveSpatialSceneSchema } from "@/lib/contracts/spatial-scene";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { readSpatialScene, saveSpatialScene } from "@/server/db/spatial-scenes";

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
  try {
    const subject = await getV1Subject(request);
    return successResponse({ scene: await readSpatialScene(subject, await projectId(context)) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
export async function PUT(request: Request, context: Context) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const id = await projectId(context);
    const input = await readMutationJson(request, SaveSpatialSceneSchema, { maxBytes: 32_768 });
    return successResponse({ scene: await saveSpatialScene(subject, id, input) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
