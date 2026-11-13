import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewVersionId } from "@/server/auth/review-boundary";
import { readClientReview } from "@/server/db/reviews";
export async function GET(request: Request, context: { params: Promise<{ versionId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    return successResponse(
      {
        review: await readClientReview(
          await getV1Subject(request),
          await reviewVersionId(context.params),
        ),
      },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
