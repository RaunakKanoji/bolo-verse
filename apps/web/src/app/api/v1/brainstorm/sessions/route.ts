import { randomUUID } from "node:crypto";
import { CreateBrainstormSessionSchema } from "@/lib/contracts/brainstorm-studio";
import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { createBrainstormSession, listBrainstormSessions } from "@/server/db/brainstorm-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    return successResponse(await listBrainstormSessions(await getV1Subject(request)), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, CreateBrainstormSessionSchema);
    return successResponse(
      { session: await createBrainstormSession(subject, input) },
      requestId,
      201,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
