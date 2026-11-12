import StudioShell from "@/features/workspace/StudioShell";
import Link from "next/link";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import { projectAccessState } from "@/features/projects/access-state";
import { getCurrentSubject } from "@/server/auth/identity";
import { listAuthorizedProjects } from "@/server/db/projects";
import CapabilityPanel from "@/xr/CapabilityPanel";

export const dynamic = "force-dynamic";
export default async function SpatialStudioLanding() {
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
      <div className="page-heading">
        <h1>Spatial Studio</h1>
        <p>Explore in desktop 3D, or enter immersive VR on a supported device.</p>
      </div>
      <CapabilityPanel />
      <section className="setup-panel">
        <h2>Open a project</h2>
        {projects.length ? (
          <ul>
            {projects
              .slice(-6)
              .reverse()
              .map((project) => (
                <li key={project.id}>
                  <Link href={`/studio/xr/${project.id}`}>{project.name}</Link>
                </li>
              ))}
          </ul>
        ) : (
          <p>
            <Link href="/app/projects">Create a project</Link> to save your workspace.
          </p>
        )}
      </section>
      <section className="setup-panel">
        <h2>Explore the studio first</h2>
        <p>Try an unsaved sample scene to explore selection and desktop 3D navigation.</p>
        <Link href="/xr/preview">Open public XR preview</Link>
      </section>
    </StudioShell>
  );
}
