import { GET as readValidatedAsset } from "@/app/api/xr/assets/[assetId]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Keep the existing bounded, MIME-validated R2 reader and post-read reauthorization. */
export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  return readValidatedAsset(request, context);
}
