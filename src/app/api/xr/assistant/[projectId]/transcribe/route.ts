import { LanguageSchema } from "@/lib/contracts";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { requireMutationOrigin } from "@/server/auth/mutations";
import { getXRAssistantReadiness } from "@/server/providers/xr-assistant";
import { createXRSpeechProvider } from "@/server/providers/xr-speech";
import { readSpeechAudio } from "@/server/xr-assistant/audio";
import { assistantRouteContext, type AssistantRoute } from "@/server/xr-assistant/route-context";
import { authorizedAssistantContext, consumeAssistantBudget } from "@/server/xr-assistant/service";

export const dynamic = "force-dynamic";
export async function POST(request: Request, route: AssistantRoute) {
  const requestId = crypto.randomUUID();
  try {
    requireMutationOrigin(request);
    const { subject, context } = await assistantRouteContext(route);
    const language = LanguageSchema.safeParse(request.headers.get("x-speech-language"));
    if (!language.success)
      throw new BoundaryError(400, "INVALID_INPUT", "Choose a supported speech language.");
    if (!getXRAssistantReadiness().sttAvailable)
      throw new BoundaryError(
        503,
        "PROVIDER_UNCONFIGURED",
        "Sarvam speech recognition is not configured.",
      );
    const audio = await readSpeechAudio(request);
    await consumeAssistantBudget(subject);
    const result = await createXRSpeechProvider().stt.transcribe({
      ...audio,
      language: language.data,
      signal: request.signal,
    });
    await authorizedAssistantContext(subject, context.projectId);
    return successResponse(
      { text: result.text, language: result.language, mode: "live" as const },
      requestId,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
