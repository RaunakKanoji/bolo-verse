"use client";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useWorkspaceSession } from "@/features/platform/WorkspaceSession";

export default function AuthControls() {
  const session = useWorkspaceSession();
  if (!session.configured) return null;
  return (
    <div className="auth-controls" role="group" aria-label="Account controls">
      {!session.isLoaded ? (
        <span role="status">Loading account…</span>
      ) : session.sessionKey === "signed-out" ? (
        <>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up">Create account</Link>
        </>
      ) : (
        <UserButton />
      )}
    </div>
  );
}
