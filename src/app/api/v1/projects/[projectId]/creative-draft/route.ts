import { randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { SaveCreativeDraftSchema } from "@/lib/contracts/shape";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { readCreativeDraft, saveCreativeDraft } from "@/server/db/creative-drafts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const draft = await readCreativeDraft(subject, parsed.data);
    return successResponse({ draft }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const parsed = ResourceIdSchema.safeParse((await context.params).projectId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const input = await readMutationJson(request, SaveCreativeDraftSchema, { maxBytes: 32_768 });
    const draft = await saveCreativeDraft(subject, parsed.data, input);
    return successResponse({ draft }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
