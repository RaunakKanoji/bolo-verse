import { XRSpeakRequestSchema } from "@/lib/contracts/xr-assistant";
import { BoundaryError, errorResponse } from "@/server/auth/errors";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { getXRAssistantReadiness } from "@/server/providers/xr-assistant";
import { createXRSpeechProvider } from "@/server/providers/xr-speech";
import { assistantRouteContext, type AssistantRoute } from "@/server/xr-assistant/route-context";
import { authorizedAssistantContext, consumeAssistantBudget } from "@/server/xr-assistant/service";

export const dynamic = "force-dynamic";
export async function POST(request: Request, route: AssistantRoute) {
  const requestId = crypto.randomUUID();
  try {
    requireMutationOrigin(request);
    const { subject, context } = await assistantRouteContext(route);
    const input = await readMutationJson(request, XRSpeakRequestSchema);
    if (!getXRAssistantReadiness().ttsAvailable)
      throw new BoundaryError(
        503,
        "PROVIDER_UNCONFIGURED",
        "Sarvam speech playback is not configured.",
      );
    await consumeAssistantBudget(subject);
    const result = await createXRSpeechProvider().tts.synthesize({
      ...input,
      signal: request.signal,
    });
    await authorizedAssistantContext(subject, context.projectId);
    return new Response(new Uint8Array(result.audio).buffer, {
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
