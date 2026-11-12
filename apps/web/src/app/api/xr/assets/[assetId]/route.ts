import { getCurrentSubject } from "@/server/auth/identity";
import { errorResponse } from "@/server/auth/errors";
import { readAuthorizedPreview } from "@/server/providers/authorized-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    return await readAuthorizedPreview(await getCurrentSubject(), request, context);
  } catch (error) { return errorResponse(error, requestId); }
}
