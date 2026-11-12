import { randomUUID } from "node:crypto";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { listAuthorizedProjects } from "@/server/db/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    const subject = await getCurrentSubject();
    const projects = await listAuthorizedProjects(subject);
    return successResponse({ projects }, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
