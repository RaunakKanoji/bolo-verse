import { randomUUID } from "node:crypto";
import { LanguageSchema } from "@/lib/contracts/api";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { readBrainstormSession } from "@/server/db/brainstorm-studio";
import { createXRSpeechProvider } from "@/server/providers/xr-speech";
import { getXRAssistantReadiness } from "@/server/providers/xr-assistant";
import { readSpeechAudio } from "@/server/xr-assistant/audio";
import { consumeAssistantBudget } from "@/server/xr-assistant/service";
import { brainstormId, type BrainstormRoute } from "@/server/services/brainstorm-studio";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, route: BrainstormRoute) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true }),
      id = await brainstormId(route);
    await readBrainstormSession(subject, id);
    const language = LanguageSchema.safeParse(request.headers.get("x-speech-language"));
    if (!language.success)
      throw new BoundaryError(400, "INVALID_INPUT", "Choose a supported speech language.");
    if (!getXRAssistantReadiness().sttAvailable)
      throw new BoundaryError(
        503,
        "PROVIDER_UNCONFIGURED",
        "Sarvam speech recognition is not connected. You can type your message.",
      );
    const audio = await readSpeechAudio(request);
    await consumeAssistantBudget(subject);
    const result = await createXRSpeechProvider().stt.transcribe({
      ...audio,
      language: language.data,
      signal: request.signal,
    });
    await readBrainstormSession(subject, id);
    request.signal.throwIfAborted();
    return successResponse(
      { text: result.text, language: result.language, mode: "live" as const },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
