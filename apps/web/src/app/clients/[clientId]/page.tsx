import { z } from "zod";
import { notFound } from "next/navigation";
import StudioShell from "@/features/workspace/StudioShell";
import ClientWorkspace from "@/features/platform/ClientWorkspace";
export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const parsed = z.uuid().safeParse((await params).clientId);
  if (!parsed.success) notFound();
  return (
    <StudioShell title="Client">
      <ClientWorkspace clientId={parsed.data} />
    </StudioShell>
  );
}
