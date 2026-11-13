import StudioShell from "@/features/workspace/StudioShell";
import AnalyticsWorkspace from "@/features/platform/AnalyticsWorkspace";
export default function Page() {
  return (
    <StudioShell title="Analytics">
      <AnalyticsWorkspace />
    </StudioShell>
  );
}
