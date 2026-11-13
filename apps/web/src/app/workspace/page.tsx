import StudioShell from "@/features/workspace/StudioShell";
import Dashboard from "@/features/platform/Dashboard";
export default function Page() {
  return (
    <StudioShell title="Workspace">
      <Dashboard />
    </StudioShell>
  );
}
