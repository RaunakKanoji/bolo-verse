import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Glasses } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import ProjectForm from "@/features/projects/ProjectForm";
import { projectAccessState } from "@/features/projects/access-state";
import { getCurrentSubject } from "@/server/auth/identity";
import { readProjectAccess } from "@/server/db/projects";
import styles from "@/features/projects/projects.module.css";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const parsed = z.uuid().safeParse((await params).projectId);
  if (!parsed.success) notFound();
  let access: Awaited<ReturnType<typeof readProjectAccess>>;
  try {
    access = await readProjectAccess(await getCurrentSubject(), parsed.data);
  } catch (error) {
    return <ProjectAccessNotice state={projectAccessState(error)} />;
  }
  const { project, canEdit } = access;
  return <>
    <Link href="/app/projects" className="muted">Back to your projects</Link>
    <div className="page-heading"><h1>{project.name}</h1><p className={styles.objective}>{project.objective}</p></div>
    <div className={styles.toolbar}><Button asChild size="lg"><Link href={`/xr/${project.id}`}><Glasses aria-hidden="true" />Open XR studio</Link></Button><span className="muted">{canEdit ? "Project editor" : "Read-only project access"}</span></div>
    <section className="setup-panel"><h2>Your project’s studio foundation</h2><p>Explore the desktop room or enter immersive VR on a supported headset. This phase loads your saved project details; spatial editing, scene saving, assets and client review arrive in later phases.</p></section>
    {canEdit && <details className={styles.details}><summary>Edit project details</summary><ProjectForm project={{ id: project.id, name: project.name, objective: project.objective }} /></details>}
  </>;
}
