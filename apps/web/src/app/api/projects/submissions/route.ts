import { randomUUID } from "node:crypto";
import { ProjectSubmissionSchema } from "@/lib/contracts/project-submissions";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getCurrentSubject } from "@/server/auth/identity";
import { readMutationJson, requireMutationOrigin } from "@/server/auth/mutations";
import { submitProject } from "@/server/services/project-submissions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Web cookie transport only. Native v1 contracts remain unchanged. */
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    if (request.headers.has("authorization"))
      throw new BoundaryError(
        401,
        "UNAUTHORIZED",
        "Use your signed-in browser session to submit a project.",
      );
    const subject = await getCurrentSubject();
    requireMutationOrigin(request);
    const input = await readMutationJson(request, ProjectSubmissionSchema, { maxBytes: 32768 });
    return successResponse(await submitProject(subject, input), requestId, 201);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
