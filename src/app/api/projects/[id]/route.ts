import { randomUUID } from "node:crypto";
import { z } from "zod";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readAuthorizedProject } from "@/server/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    const parsed = z.uuid().safeParse((await context.params).id);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid project ID is required.");
    const project = await readAuthorizedProject(subject, parsed.data);
    return successResponse({ project }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
