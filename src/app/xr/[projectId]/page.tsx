import { notFound } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { getCurrentSubject } from "@/server/auth/identity";
import { readProjectAccess } from "@/server/db/projects";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import { projectAccessState } from "@/features/projects/access-state";
import XRWorkspace from "@/xr/XRWorkspace";

export const dynamic = "force-dynamic";

export default async function ProjectXRPage({ params }: { params: Promise<{ projectId: string }> }) {
  const parsed = z.uuid().safeParse((await params).projectId);
  if (!parsed.success) notFound();
  let access: Awaited<ReturnType<typeof readProjectAccess>>;
  try { access = await readProjectAccess(await getCurrentSubject(), parsed.data); }
  catch (error) { return <ProjectAccessNotice state={projectAccessState(error)} />; }
  const { project } = access;
  return <>
    <Link className="muted" href={`/app/projects/${project.id}`}>Back to project</Link>
    <div className="page-heading"><h1>{project.name}</h1><p>Project studio foundation. View and inspect the spatial samples; scene editing and persistence are not active yet.</p></div>
    <XRWorkspace project={{ id: project.id, name: project.name, objective: project.objective }} />
  </>;
}
