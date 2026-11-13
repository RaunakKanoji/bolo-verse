import { randomUUID } from "node:crypto";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import * as repository from "@/server/db/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    const result = await repository.studioOverview(subject);
    return successResponse(result, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
