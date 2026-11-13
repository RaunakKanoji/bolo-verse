import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewCreatorIds } from "@/server/auth/review-boundary";
import { readMutationJson } from "@/server/auth/mutations";
import { ShareReviewSchema } from "@/lib/contracts/reviews";
import { readCreatorReviewFeedback } from "@/server/db/reviews";
import { shareForReview } from "@/server/services/reviews";
type Context = { params: Promise<{ projectId: string; deliverableId: string }> };
export async function GET(request: Request, context: Context) {
  const requestId = crypto.randomUUID();
  try {
    const subject = await getV1Subject(request);
    const ids = await reviewCreatorIds(context.params);
    return successResponse(
      { feedback: await readCreatorReviewFeedback(subject, ids.projectId, ids.deliverableId) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function POST(request: Request, context: Context) {
  const requestId = crypto.randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const ids = await reviewCreatorIds(context.params);
    const input = await readMutationJson(request, ShareReviewSchema);
    return successResponse(
      { grant: await shareForReview(subject, ids.projectId, ids.deliverableId, input) },
      requestId,
      201,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
