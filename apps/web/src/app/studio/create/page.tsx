import type { Metadata } from "next";
import ImageCanvas from "@/features/workspace/ImageCanvas";
import StudioShell from "@/features/workspace/StudioShell";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";
import { projectAccessState } from "@/features/projects/access-state";
import { getCurrentSubject } from "@/server/auth/identity";
import { readAuthorizedProject } from "@/server/db/projects";
import { notFound } from "next/navigation";
import { z } from "zod";

export const metadata: Metadata = { title: "Creative playground" };
export const dynamic = "force-dynamic";
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ projectId?: string | string[] }> }) {
  const { projectId } = await searchParams;
  if (projectId === undefined) return <ImageCanvas />;
  const id = z.uuid().safeParse(projectId);
  if (!id.success) notFound();
  try {
    await readAuthorizedProject(await getCurrentSubject(), id.data);
  } catch (error) {
    return <StudioShell title="Creative playground"><ProjectAccessNotice state={projectAccessState(error)} /></StudioShell>;
  }
  return <ImageCanvas projectId={id.data} />;
}
