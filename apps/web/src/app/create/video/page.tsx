import { z } from "zod";
import StudioShell from "@/features/workspace/StudioShell";
import VideoEditorWorkspace from "@/features/video/VideoEditorWorkspace";
export default async function VideoCreationPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const query = await searchParams,
    id = z.uuid().safeParse(query.projectId);
  return (
    <StudioShell title="Create / Video">
      <VideoEditorWorkspace
        initialProjectId={id.success ? id.data : ""}
        invalidProject={query.projectId !== undefined && !id.success}
      />
    </StudioShell>
  );
}
