import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewCreatorIds } from "@/server/auth/review-boundary";
import { readMutationJson } from "@/server/auth/mutations";
import { RevokeReviewSchema } from "@/lib/contracts/reviews";
import { revokeReviewGrant } from "@/server/db/reviews";
export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string; deliverableId: string; grantId: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const ids = await reviewCreatorIds(context.params);
    await readMutationJson(request, RevokeReviewSchema);
    return successResponse(
      { grant: await revokeReviewGrant(subject, ids.projectId, ids.deliverableId, ids.grantId!) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
