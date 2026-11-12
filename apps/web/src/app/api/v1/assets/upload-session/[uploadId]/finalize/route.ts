import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { FinalizeImageUploadSchema } from "@/lib/contracts/creation";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { finalizeImageUpload } from "@/server/services/image-ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ uploadId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const parsed = ResourceIdSchema.safeParse((await context.params).uploadId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid upload session ID is required.");
    await readMutationJson(request, FinalizeImageUploadSchema);
    return successResponse(await finalizeImageUpload(subject, parsed.data, request.signal), requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
