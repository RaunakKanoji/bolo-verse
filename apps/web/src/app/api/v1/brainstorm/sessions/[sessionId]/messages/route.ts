import { randomUUID } from "node:crypto";
import { SendBrainstormMessageSchema } from "@/lib/contracts/brainstorm-studio";
import { getV1Subject } from "@/server/auth/api-identity";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson } from "@/server/auth/mutations";
import { sendBrainstormMessage } from "@/server/services/brainstorm-studio";
import { brainstormId, type BrainstormRoute } from "@/server/services/brainstorm-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, route: BrainstormRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, SendBrainstormMessageSchema);
    const result = await sendBrainstormMessage(
      subject,
      await brainstormId(route),
      input,
      request.signal,
    );
    return successResponse(result, requestId, result.message.status === "pending" ? 202 : 200);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
