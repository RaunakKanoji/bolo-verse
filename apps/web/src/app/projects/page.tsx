import StudioShell from "@/features/workspace/StudioShell";
import ProjectsWorkspace from "@/features/platform/ProjectsWorkspace";
export default function Page() {
  return (
    <StudioShell title="Projects">
      <ProjectsWorkspace />
    </StudioShell>
  );
}
