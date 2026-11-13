"use client";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { StudioProjectListSchema } from "@/lib/contracts/workspace";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState, ProjectCards } from "./WorkspaceComponents";
import { EmptyState, PageHeader, ServiceNotice } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export default function ProfileWorkspace() {
  const session = useWorkspaceSession();
  return session.configured ? (
    <ConnectedProfile key={session.sessionKey} />
  ) : (
    <div className={styles.page}>
      <PageHeader title="Your Profile" description="Your identity and creative workspace." />
      <ServiceNotice message="Connect authentication and sign in to view your profile. Clerk remains the source of your account identity." />
      <EmptyState
        title="Make room for your next creation"
        description="Your authorized projects and account details will appear here when you sign in."
      >
        <Link href="/create" className={styles.button}>
          Explore creation tools
        </Link>
      </EmptyState>
    </div>
  );
}
function ConnectedProfile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const projects = useWorkspaceData("projects?limit=6", StudioProjectListSchema);
  if (!isLoaded) return <p role="status">Loading your profile…</p>;
  if (!isSignedIn || !user)
    return (
      <div className={styles.page}>
        <PageHeader
          title="Your Profile"
          description="Sign in to see your account and private projects."
        />
        <ServiceNotice message="Use the account menu to sign in. Your account details are provided by Clerk." />
      </div>
    );
  return (
    <div className={styles.page}>
      <PageHeader title="Your Profile" description="Your identity and creative workspace.">
        <Link className={styles.secondary} href="/settings">
          Account settings
        </Link>
      </PageHeader>
      <section className={styles.card}>
        <div className={own.identity}>
          {user.imageUrl && (
            <>
              {/* Clerk provides the authenticated identity image; no private asset URL or image optimizer cache. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={own.profilePortrait}
                src={user.imageUrl}
                alt="Profile"
                referrerPolicy="no-referrer"
              />
            </>
          )}
          <div>
            <h2>{user.fullName || user.firstName || "Creator"}</h2>
            <p>{user.primaryEmailAddress?.emailAddress || "No primary email"}</p>
            <span className={styles.badge}>Clerk account</span>
          </div>
        </div>
        <h3>Creator information</h3>
        <p>
          Your name, photo and email are managed through Clerk. Additional creator biography fields
          are not connected.
        </p>
        <h3>Workspace membership</h3>
        <p>
          Personal workspace · project access is determined by authorized project membership.
          Organization membership management remains unavailable.
        </p>
      </section>
      <section>
        <h2>Recent projects</h2>
        <DataState {...projects} />
        {projects.data?.projects.length ? (
          <ProjectCards projects={projects.data.projects} />
        ) : (
          <EmptyState
            title="No recent projects"
            description="Create a project to organize your creative work."
          >
            <Link href="/projects" className={styles.button}>
              Open projects
            </Link>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
