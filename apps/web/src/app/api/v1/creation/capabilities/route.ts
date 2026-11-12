import { randomUUID } from "node:crypto";
import { errorResponse, successResponse } from "@/server/auth/errors";
import { getImageGenerationCapabilities } from "@/server/providers/gemini-image";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const requestId = randomUUID();
  try { return successResponse(getImageGenerationCapabilities(), requestId); }
  catch (error) { return errorResponse(error, requestId); }
}
