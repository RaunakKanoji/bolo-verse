import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { CancelImageGenerationSchema } from "@/lib/contracts/creation";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { cancelImageGeneration } from "@/server/db/image-generations";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const id = ResourceIdSchema.safeParse((await context.params).jobId);
    if (!id.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid job ID is required.");
    await readMutationJson(request, CancelImageGenerationSchema);
    return successResponse({ job: await cancelImageGeneration(subject, id.data) }, requestId);
  } catch (error) { return errorResponse(error, requestId); }
}
