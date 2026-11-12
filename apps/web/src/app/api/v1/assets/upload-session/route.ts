import { randomUUID } from "node:crypto";
import { CreateImageUploadSchema } from "@/lib/contracts/creation";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { beginImageUpload } from "@/server/services/image-ingestion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, CreateImageUploadSchema);
    return successResponse(await beginImageUpload(subject, input, request.signal), requestId, 201);
  } catch (error) { return errorResponse(error, requestId); }
}
