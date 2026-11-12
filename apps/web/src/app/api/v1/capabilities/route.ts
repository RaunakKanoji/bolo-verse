import { randomUUID } from "node:crypto";
import { successResponse } from "@/server/auth/errors";
import { getCreativeCapabilities } from "@/server/providers/creative-capabilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return successResponse(getCreativeCapabilities(), randomUUID());
}
