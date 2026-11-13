import StudioShell from "@/features/workspace/StudioShell";
import ClientsWorkspace from "@/features/platform/ClientsWorkspace";
export default function Page() {
  return (
    <StudioShell title="Clients">
      <ClientsWorkspace />
    </StudioShell>
  );
}
