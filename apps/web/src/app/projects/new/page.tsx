import StudioShell from "@/features/workspace/StudioShell";
import ProjectSubmission from "@/features/platform/ProjectSubmission";
export default function Page() {
  return (
    <StudioShell title="Submit project">
      <ProjectSubmission />
    </StudioShell>
  );
}
