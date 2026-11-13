import { randomUUID } from "node:crypto";
import { UpdateBrainstormSessionSchema } from "@/lib/contracts/brainstorm-studio";
import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { readBrainstormSession, updateBrainstormSession } from "@/server/db/brainstorm-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { brainstormId, type BrainstormRoute } from "@/server/services/brainstorm-studio";
export async function GET(request: Request, route: BrainstormRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    return successResponse(
      await readBrainstormSession(subject, await brainstormId(route)),
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function PATCH(request: Request, route: BrainstormRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, UpdateBrainstormSessionSchema);
    return successResponse(
      { session: await updateBrainstormSession(subject, await brainstormId(route), input) },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
