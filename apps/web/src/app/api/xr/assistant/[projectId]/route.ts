import { XRAssistantRequestSchema, validateAssistantCommands } from "@/lib/contracts/xr-assistant";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import {
  createXRAssistantProvider,
  getXRAssistantReadiness,
} from "@/server/providers/xr-assistant";
import { assistantRouteContext, type AssistantRoute } from "@/server/xr-assistant/route-context";
import { authorizedAssistantContext, consumeAssistantBudget } from "@/server/xr-assistant/service";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, route: AssistantRoute) {
  const requestId = crypto.randomUUID();
  try {
    await assistantRouteContext(route);
    return successResponse(getXRAssistantReadiness(), requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
export async function POST(request: Request, route: AssistantRoute) {
  const requestId = crypto.randomUUID();
  try {
    requireMutationOrigin(request);
    const { subject, context } = await assistantRouteContext(route);
    const input = await readMutationJson(request, XRAssistantRequestSchema);
    if (!getXRAssistantReadiness().textAvailable)
      throw new BoundaryError(
        503,
        "PROVIDER_UNCONFIGURED",
        "Gemini is not configured for this workspace.",
      );
    await consumeAssistantBudget(subject);
    const result = await createXRAssistantProvider().respond({
      ...input,
      context,
      signal: request.signal,
    });
    // Provider latency may outlast a membership or asset change. Reauthorize
    // before exposing the reply or an actionable proposal to the browser.
    const current = await authorizedAssistantContext(subject, context.projectId);
    validateAssistantCommands(result.commands, current);
    return successResponse(result, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
