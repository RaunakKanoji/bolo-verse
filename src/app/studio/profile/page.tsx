import { UserProfile } from "@clerk/nextjs";
import StudioShell from "@/features/workspace/StudioShell";
import { getCurrentSubject } from "@/server/auth/identity";
import { projectAccessState } from "@/features/projects/access-state";
import ProjectAccessNotice from "@/features/projects/ProjectAccessNotice";

export const dynamic = "force-dynamic";
export default async function ProfilePage() {
  try { await getCurrentSubject(); }
  catch (error) { return <StudioShell title="Profile"><ProjectAccessNotice state={projectAccessState(error)} /></StudioShell>; }
  return <StudioShell title="Profile"><div className="page-heading"><h1>Your profile</h1></div><UserProfile routing="hash" /></StudioShell>;
}
