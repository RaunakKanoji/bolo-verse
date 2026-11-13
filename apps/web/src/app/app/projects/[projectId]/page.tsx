import { redirect, notFound } from "next/navigation";
import { z } from "zod";
export default async function ProjectAlias({ params }: { params: Promise<{ projectId: string }> }) {
  const id = z.uuid().safeParse((await params).projectId);
  if (!id.success) notFound();
  redirect(`/projects/${id.data}`);
}
