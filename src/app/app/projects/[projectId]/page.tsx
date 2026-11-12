import StudioShell from "@/features/workspace/StudioShell";
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
    return (
      <StudioShell title="Your projects">
        <ProjectAccessNotice state={projectAccessState(error)} />
      </StudioShell>
    );
  }
  const { project, canEdit } = access;
  return (
    <StudioShell title="Your projects">
      <Link href="/app/projects" className="muted">
        Back to your projects
      </Link>
      <div className="page-heading">
        <h1>{project.name}</h1>
        <p className={styles.objective}>{project.objective}</p>
      </div>
      <div className={styles.toolbar}>
        <Button asChild size="lg">
          <Link href={`/studio/xr/${project.id}`}>
            <Glasses aria-hidden="true" />
            Open Spatial Studio
          </Link>
        </Button>
        <span className="muted">{canEdit ? "Project editor" : "Read-only project access"}</span>
      </div>
      <section className="setup-panel">
        <h2>Your project in space</h2>
        <p>
          Explore the brief, creative artifacts, available assets and client feedback. Arrange the
          workspace and save its layout, or enter immersive VR on a supported headset.
        </p>
      </section>
      {canEdit && (
        <details className={styles.details}>
          <summary>Edit project details</summary>
          <ProjectForm
            project={{ id: project.id, name: project.name, objective: project.objective }}
          />
        </details>
      )}
    </StudioShell>
  );
}
