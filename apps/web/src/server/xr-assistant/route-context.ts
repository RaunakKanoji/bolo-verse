import "server-only";
import { ResourceIdSchema } from "@/lib/contracts";
import { BoundaryError } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { authorizedAssistantContext } from "./service";

export type AssistantRoute = { params: Promise<{ projectId: string }> };
export async function assistantRouteContext(route: AssistantRoute) {
  const subject = await getCurrentSubject();
  const parsed = ResourceIdSchema.safeParse((await route.params).projectId);
  if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "Choose a valid project.");
  const context = await authorizedAssistantContext(subject, parsed.data);
  return { subject, context };
}
