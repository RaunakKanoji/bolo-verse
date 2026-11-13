import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { readReviewInbox } from "@/server/db/reviews";
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    return successResponse(await readReviewInbox(await getV1Subject(request)), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
