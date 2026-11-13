import { randomUUID } from "node:crypto";
import { SaveBrainstormIdeaSchema } from "@/lib/contracts/brainstorm-studio";
import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { saveBrainstormIdea } from "@/server/db/brainstorm-studio";
import { brainstormId, type BrainstormRoute } from "@/server/services/brainstorm-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, route: BrainstormRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, SaveBrainstormIdeaSchema);
    return successResponse(
      await saveBrainstormIdea(subject, await brainstormId(route), input),
      requestId,
      201,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
