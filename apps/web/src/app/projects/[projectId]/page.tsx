import { z } from "zod";
import { notFound } from "next/navigation";
import StudioShell from "@/features/workspace/StudioShell";
import ProjectWorkspace from "@/features/platform/ProjectWorkspace";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const parsed = z.uuid().safeParse((await params).projectId);
  if (!parsed.success) notFound();
  const tab = (await searchParams).tab;
  return (
    <StudioShell title="Project">
      <ProjectWorkspace
        projectId={parsed.data}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </StudioShell>
  );
}
