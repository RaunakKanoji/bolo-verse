import { redirect, notFound } from "next/navigation";
import { z } from "zod";
export default async function ReviewAlias({ params }: { params: Promise<{ versionId: string }> }) {
  const id = z.uuid().safeParse((await params).versionId);
  if (!id.success) notFound();
  redirect(`/review/${id.data}`);
}
