import { uploadWorkspaceAsset } from "@/server/services/workspace-uploads";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return uploadWorkspaceAsset(request, "recordings");
}
