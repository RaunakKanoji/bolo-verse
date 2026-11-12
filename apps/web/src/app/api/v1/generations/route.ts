import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { CreateImageGenerationSchema } from "@/lib/contracts/creation";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import { getV1Subject } from "@/server/auth/api-identity";
import { readMutationJson } from "@/server/auth/mutations";
import { createImageGeneration } from "@/server/db/image-generations";
import { getImageGenerationCapabilities } from "@/server/providers/gemini-image";
import { processImageGeneration } from "@/server/services/image-generation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;
export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const input = await readMutationJson(request, CreateImageGenerationSchema);
    const capabilities = getImageGenerationCapabilities();
    if (capabilities.availability !== "configured" || !capabilities.models.some((model) => model.id === input.modelId)) {
      throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Image generation is not configured for this model.");
    }
    const job = await createImageGeneration(subject, input);
    if (job.status === "queued") after(async () => {
      // The durable SQL queue remains recoverable by jobs:run if this process dies.
      try { await processImageGeneration(job.id); } catch { /* No secrets/payloads in logs; worker recovery marks expired leases. */ }
    });
    return successResponse({ job }, requestId, 202);
  } catch (error) { return errorResponse(error, requestId); }
}
