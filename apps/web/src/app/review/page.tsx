import StudioShell from "@/features/workspace/StudioShell";
import ReviewWorkspace from "@/features/platform/ReviewWorkspace";
import { z } from "zod";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string | string[] }>;
}) {
  const value = z.uuid().safeParse((await searchParams).projectId);
  return (
    <StudioShell title="Review">
      <ReviewWorkspace projectId={value.success ? value.data : undefined} />
    </StudioShell>
  );
}
