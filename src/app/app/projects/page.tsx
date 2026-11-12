import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { getCurrentSubject } from "@/server/auth/identity";
import { BoundaryError } from "@/server/auth/errors";
import { listAuthorizedProjects } from "@/server/db/projects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  let projects: Awaited<ReturnType<typeof listAuthorizedProjects>> = [];
  let state: "connected" | "sign-in" | "unconfigured" | "unavailable" = "connected";
  try {
    const subject = await getCurrentSubject();
    projects = await listAuthorizedProjects(subject);
  } catch (error) {
    if (error instanceof BoundaryError && error.status === 401) state = "sign-in";
    else if (error instanceof BoundaryError && error.status === 503) state = "unconfigured";
    else state = "unavailable";
  }

  if (state === "sign-in") return <section className="empty-state"><h1>Your workspace starts here.</h1><p>Sign in to view the projects assigned to your account.</p><SignInButton mode="modal"><Button>Sign in</Button></SignInButton></section>;

  if (state !== "connected") return <section className="empty-state">
    <h1>{state === "unconfigured" ? "Connect your workspace" : "Workspace temporarily unavailable"}</h1>
    <p>{state === "unconfigured" ? "Account and database setup is needed before private projects can open. You can use the local recording lab while this is being configured." : "We could not read your projects. Check the database connection and try again."}</p>
    <div className="setup-panel"><h2>Setup for the project owner</h2><p>Follow the repository README to configure Clerk and Neon, then apply the checked-in database migration. No sample account is signed in automatically.</p></div>
    <Button asChild><Link href="/studio/feasibility">Open recording lab</Link></Button>
  </section>;

  return <><div className="section-heading"><div className="page-heading"><h1>Your projects</h1><p>Only projects assigned to your account appear here.</p></div><UserButton /></div>
    {projects.length ? <div className="project-list">{projects.map(project => <article key={project.id} className="project-card"><span className="status-pill">{project.sample ? "Fictional sample" : "Project"}</span><h2>{project.name}</h2><p>{project.objective}</p><p className="muted">Artifact editing opens in later milestones.</p></article>)}</div> : <div className="setup-panel"><h2>Your workspace is ready.</h2><p>You have no assigned projects yet. This milestone establishes private access; project creation and editing are not active.</p></div>}
    <div className="actions"><Button asChild variant="outline"><Link href="/studio/feasibility">Test local recording</Link></Button></div>
  </>;
}
