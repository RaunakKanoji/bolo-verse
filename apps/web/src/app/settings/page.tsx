import StudioShell from "@/features/workspace/StudioShell";
import SettingsWorkspace from "@/features/platform/SettingsWorkspace";
export default function SettingsPage() {
  return (
    <StudioShell title="Settings">
      <SettingsWorkspace />
    </StudioShell>
  );
}
