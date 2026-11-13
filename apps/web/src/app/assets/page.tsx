import { z } from "zod";
import StudioShell from "@/features/workspace/StudioShell";
import AssetsWorkspace from "@/features/platform/AssetsWorkspace";
export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; upload?: string }>;
}) {
  const query = await searchParams;
  const id = z.uuid().safeParse(query.projectId);
  return (
    <StudioShell title="Assets">
      <AssetsWorkspace
        initialProjectId={id.success ? id.data : ""}
        initialUpload={query.upload === "true"}
      />
    </StudioShell>
  );
}
