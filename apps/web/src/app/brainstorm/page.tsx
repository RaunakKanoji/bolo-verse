import { z } from "zod";
import StudioShell from "@/features/workspace/StudioShell";
import BrainstormStudio from "@/features/brainstorm/BrainstormStudio";
export default async function BrainstormPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; sessionId?: string }>;
}) {
  const query = await searchParams;
  const project = z.uuid().safeParse(query.projectId);
  const session = z.uuid().safeParse(query.sessionId);
  return (
    <StudioShell title="Brainstorm">
      <BrainstormStudio
        initialProject={project.success ? project.data : null}
        initialSession={session.success ? session.data : null}
      />
    </StudioShell>
  );
}
