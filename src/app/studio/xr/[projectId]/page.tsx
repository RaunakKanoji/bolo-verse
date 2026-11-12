import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentSubject } from "@/server/auth/identity";
import { readXRWorkspace } from "@/server/db/xr-workspaces";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import { projectAccessState } from "@/features/projects/access-state";
import XRWorkspace from "@/xr/XRWorkspace";

export const dynamic = "force-dynamic";
export default async function ProjectXRPage({ params }: { params: Promise<{ projectId: string }> }) {
  const parsed = z.uuid().safeParse((await params).projectId);
  if (!parsed.success) notFound();
  let data: Awaited<ReturnType<typeof readXRWorkspace>>;
  try { data = await readXRWorkspace(await getCurrentSubject(), parsed.data); }
  catch (error) { return <ProjectAccessNotice state={projectAccessState(error)} />; }
  return <XRWorkspace project={data.project} initialData={data} />;
}
