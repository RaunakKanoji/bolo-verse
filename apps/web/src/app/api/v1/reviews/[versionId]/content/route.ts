import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewVersionId } from "@/server/auth/review-boundary";
import { readReviewMedia } from "@/server/services/reviews";
export async function GET(request: Request, context: { params: Promise<{ versionId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    return await readReviewMedia(
      await getV1Subject(request),
      await reviewVersionId(context.params),
      request,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
