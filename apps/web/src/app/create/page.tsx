import { z } from "zod";
import StudioShell from "@/features/workspace/StudioShell";
import CreationWorkspace from "@/features/platform/CreationWorkspace";
export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const query = await searchParams;
  const id = z.uuid().safeParse(query.projectId);
  return (
    <StudioShell title="Create">
      <CreationWorkspace initialProjectId={id.success ? id.data : ""} />
    </StudioShell>
  );
}
