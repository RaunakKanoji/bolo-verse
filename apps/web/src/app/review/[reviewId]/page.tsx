import { notFound } from "next/navigation";
import { z } from "zod";
import StudioShell from "@/features/workspace/StudioShell";
import { ReviewDetail } from "@/features/platform/ReviewWorkspace";
export default async function Page({ params }: { params: Promise<{ reviewId: string }> }) {
  const id = z.uuid().safeParse((await params).reviewId);
  if (!id.success) notFound();
  return (
    <StudioShell title="Review">
      <ReviewDetail reviewId={id.data} />
    </StudioShell>
  );
}
