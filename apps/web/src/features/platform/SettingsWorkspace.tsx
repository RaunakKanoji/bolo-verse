"use client";
import Link from "next/link";
import { useState } from "react";
import { UserProfile } from "@clerk/nextjs";
import { AppearanceControl } from "@/features/workspace/Appearance";
import { useWorkspaceSession } from "./WorkspaceSession";
import { PageHeader, ServiceNotice } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
const sections = [
  "General",
  "Appearance",
  "Notifications",
  "Integrations",
  "Workspace",
  "Privacy",
  "Account",
];
export default function SettingsWorkspace() {
  const { sessionKey } = useWorkspaceSession();
  return <SettingsSession key={sessionKey} />;
}
function SettingsSession() {
  const [section, setSection] = useState("General");
  const session = useWorkspaceSession();
  const signedIn =
    session.configured &&
    session.isLoaded &&
    !["signed-out", "checking-session"].includes(session.sessionKey);
  return (
    <div className={styles.page}>
      <PageHeader title="Workspace Settings" description="Make Shape Studio work the way you do." />
      <div className={`${styles.tabs} ${own.tabBar}`} aria-label="Settings sections">
        {sections.map((s) => (
          <button key={s} aria-pressed={s === section} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
      </div>
      <section className={styles.card}>
        <h2>{section}</h2>
        {section === "General" && (
          <>
            <p>
              Shape Studio brings project planning, creative work, private assets and review into
              one personal workspace.
            </p>
            <h3>Keyboard navigation</h3>
            <p>
              Use Alt + 1 for Workspace, Alt + 2 for Create, Alt + 3 for Brainstorm, and Alt + 4 for
              Projects. Shortcuts pause while typing.
            </p>
            <Link className={styles.secondary} href="/profile">
              View your profile
            </Link>
          </>
        )}
        {section === "Appearance" && (
          <>
            <AppearanceControl />
            <p>
              Your appearance preference is saved on this browser. Choose dark, light or your device
              preference.
            </p>
            <p className={styles.muted}>
              This is a local browser preference; it is not synchronized across devices.
            </p>
          </>
        )}
        {section === "Notifications" && (
          <>
            <p>Review and project changes remain visible in their activity and review screens.</p>
            <ServiceNotice message="Email, push and notification preference controls are not connected. No preference changes have been saved." />
            <Link href="/review" className={styles.secondary}>
              Open reviews
            </Link>
          </>
        )}
        {section === "Integrations" && (
          <>
            <p>
              Provider availability is checked when you use its feature. Credentials are managed
              securely on the server.
            </p>
            <div className={styles.grid}>
              {[
                ["Gemini", "Brainstorm ideas and image generation"],
                ["Sarvam", "Voice transcription in supported workflows"],
                ["Private storage", "Authorized asset uploads and downloads"],
                [
                  "Shotstack",
                  "Embedded video editing; cloud render availability checked in the project editor",
                ],
                ["Other external editors", "No additional editor integration connected"],
              ].map(([name, description]) => (
                <div className={styles.card} key={name}>
                  <h3>{name}</h3>
                  <p>{description}</p>
                  <span className={styles.badge}>
                    {name === "Other external editors" ? "Not connected" : "Checked when used"}
                  </span>
                </div>
              ))}
            </div>
            <Link className={styles.secondary} href="/create">
              Open creation tools
            </Link>
            <Link className={styles.secondary} href="/create/video">
              Open Shotstack video editor
            </Link>
          </>
        )}
        {section === "Workspace" && (
          <>
            <h3>Personal workspace</h3>
            <p>Project membership and explicit reviewer grants control access to private work.</p>
            <ServiceNotice message="Organization administration, workspace invitations and team-wide preferences are not available in this release." />
            <Link className={styles.secondary} href="/projects">
              Manage projects
            </Link>
          </>
        )}
        {section === "Privacy" && (
          <>
            <p>
              Private assets and project records require authorized access. Published versions and
              review decisions keep immutable history.
            </p>
            <p>
              Creative prompts and unsaved drafts are not stored in browser storage. Raw command
              audio is not persisted. Appearance is the browser preference stored locally.
            </p>
            <p>
              Camera and microphone access begins only after your action in a supported feature.
              Manage device permission in your browser settings.
            </p>
            <ServiceNotice message="Workspace export and deletion controls are not connected. No deletion request is submitted from this screen." />
          </>
        )}
        {section === "Account" &&
          (signedIn ? (
            <>
              <p>Manage your authentication identity through Clerk.</p>
              <div className={own.accountProfile}>
                <UserProfile routing="hash" />
              </div>
            </>
          ) : (
            <ServiceNotice
              message={
                session.configured
                  ? "Sign in using the account menu to manage your account."
                  : "Account authentication is not connected. Your workspace screens remain available to explore."
              }
            />
          ))}
      </section>
    </div>
  );
}
