import { randomUUID } from "node:crypto";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import * as contracts from "@/lib/contracts/workspace";
import * as repository from "@/server/db/workspace";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function query(request: Request) {
  const params = new URL(request.url).searchParams;
  const values: Record<string, string> = {};
  for (const [key, value] of params) {
    if (key in values)
      throw new BoundaryError(400, "INVALID_INPUT", "Duplicate query fields are not allowed.");
    values[key] = value;
  }
  const result = contracts.StudioListQuerySchema.safeParse(values);
  if (!result.success)
    throw new BoundaryError(400, "INVALID_INPUT", "Provide valid workspace filters.");
  return result.data;
}
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    const result = await repository.listStudioAssets(subject, query(request));
    return successResponse(result, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
