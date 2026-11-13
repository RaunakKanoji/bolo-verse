import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewVersionId } from "@/server/auth/review-boundary";
import { readMutationJson } from "@/server/auth/mutations";
import { ReviewCommentInputSchema } from "@/lib/contracts/reviews";
import { appendReviewAction } from "@/server/db/reviews";
export async function POST(request: Request, context: { params: Promise<{ versionId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const versionId = await reviewVersionId(context.params);
    const input = await readMutationJson(request, ReviewCommentInputSchema);
    return successResponse(
      { review: await appendReviewAction(subject, versionId, input) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
