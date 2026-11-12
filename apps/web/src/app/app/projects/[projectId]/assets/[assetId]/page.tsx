import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentSubject } from "@/server/auth/identity";
import { readXRAsset } from "@/server/db/xr-assets";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import { projectAccessState } from "@/features/projects/access-state";
import AssetViewer from "@/xr/AssetViewer";
import ImageCanvas from "@/features/workspace/ImageCanvas";

export const dynamic = "force-dynamic";
export default async function AssetWorkspace({ params }: { params: Promise<{ projectId: string; assetId: string }> }) {
  const ids = z.object({ projectId: z.uuid(), assetId: z.uuid() }).safeParse(await params);
  if (!ids.success) notFound();
  let asset: Awaited<ReturnType<typeof readXRAsset>>;
  try { asset = await readXRAsset(await getCurrentSubject(), ids.data.assetId); }
  catch (error) { return <ProjectAccessNotice state={projectAccessState(error)} />; }
  if (asset.projectId !== ids.data.projectId) notFound();
  if (["image/png", "image/jpeg", "image/webp"].includes(asset.mimeType)) return <ImageCanvas assetId={asset.id} projectId={asset.projectId} />;
  return <><Link href={`/app/projects/${asset.projectId}`}>Back to project</Link><div className="page-heading"><h1>Asset workspace</h1><p>Preview and download the original project file. Full media editing tools are not configured.</p></div><section className="setup-panel"><h2>File details</h2><p>{asset.mimeType} · {Math.ceil(asset.byteSize / 1024)} KB{asset.width && asset.height ? ` · ${asset.width} × ${asset.height}` : ""}</p><AssetViewer assetId={asset.id} mimeType={asset.mimeType} /></section><Link href={`/studio/xr/${asset.projectId}`}>Open Spatial Studio</Link></>;
}
