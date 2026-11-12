import StudioShell from "@/features/workspace/StudioShell";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getCurrentSubject } from "@/server/auth/identity";
import { listAuthorizedProjects } from "@/server/db/projects";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import ProjectForm from "@/features/projects/ProjectForm";
import { projectAccessState } from "@/features/projects/access-state";
import styles from "@/features/projects/projects.module.css";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof listAuthorizedProjects>>;
  try {
    projects = await listAuthorizedProjects(await getCurrentSubject());
  } catch (error) {
    return (
      <StudioShell title="Your projects">
        <ProjectAccessNotice state={projectAccessState(error)} />
      </StudioShell>
    );
  }

  return (
    <StudioShell title="Your projects">
      <div className="section-heading">
        <div className="page-heading">
          <h1>Your projects</h1>
          <p>Open a campaign, shape its objective, then step into the studio.</p>
        </div>
        <UserButton />
      </div>
      {projects.length ? (
        <div className="project-list">
          {projects.map((project) => (
            <Link key={project.id} href={`/app/projects/${project.id}`} className={styles.card}>
              <span className="status-pill">{project.sample ? "Fictional sample" : "Project"}</span>
              <h2>{project.name}</h2>
              <p>{project.objective}</p>
              <span>Open project</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="setup-panel">
          <h2>A place for your next project.</h2>
          <p>
            Create a project below. Its name and objective are saved privately in your workspace.
          </p>
        </div>
      )}
      <section className="setup-panel" aria-labelledby="new-project-heading">
        <h2 id="new-project-heading">Create a project</h2>
        <p>A clear name and a single objective are enough to begin.</p>
        <ProjectForm />
      </section>
      <div className="actions">
        <Button asChild variant="outline">
          <Link href="/xr/preview">Try the public XR preview</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/studio/feasibility">Test local recording</Link>
        </Button>
      </div>
    </StudioShell>
  );
}
