import { randomUUID } from "node:crypto";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { ResourceIdSchema } from "@/lib/contracts/api";
import * as contracts from "@/lib/contracts/workspace";
import * as repository from "@/server/db/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const ids = await context.params;
    if (!ResourceIdSchema.safeParse(ids.assetId).success)
      throw new BoundaryError(400, "INVALID_INPUT", "A valid resource ID is required.");
    const input = await readMutationJson(request, contracts.UpdateStudioAssetSchema);
    const result = await repository.updateStudioAsset(subject, ids.assetId, input);
    return successResponse({ asset: result }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
