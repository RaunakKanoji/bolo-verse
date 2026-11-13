import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession } from "./creation-auth";
import { WorkspaceSessionProvider } from "../../apps/web/src/features/platform/WorkspaceSession";
import CreationWorkspace from "../../apps/web/src/features/platform/CreationWorkspace";
import SettingsWorkspace from "../../apps/web/src/features/platform/SettingsWorkspace";
import ProfileWorkspace from "../../apps/web/src/features/platform/ProfileWorkspace";
import Dashboard from "../../apps/web/src/features/platform/Dashboard";
import ProjectsWorkspace from "../../apps/web/src/features/platform/ProjectsWorkspace";
import ProjectWorkspace from "../../apps/web/src/features/platform/ProjectWorkspace";
import ClientsWorkspace from "../../apps/web/src/features/platform/ClientsWorkspace";
import ClientWorkspace from "../../apps/web/src/features/platform/ClientWorkspace";
import AssetsWorkspace from "../../apps/web/src/features/platform/AssetsWorkspace";
import SpatialEntry from "../../apps/web/src/features/platform/SpatialEntry";
import ReviewWorkspace from "../../apps/web/src/features/platform/ReviewWorkspace";
import DeviceRecorder from "../../apps/web/src/features/platform/DeviceRecorder";
import "../../packages/design-tokens/generated/tokens.css";
window.addEventListener("fixture-session-switch", () => setFixtureSession("fixture-session-2"));
function Fixture() {
  const [screen, setScreen] = useState("projects");
  return (
    <>
      <p>HTTP component fixture; no production authentication bypass or provider calls.</p>
      <nav aria-label="Fixture screens">
        {[
          "dashboard",
          "projects",
          "detail",
          "clients",
          "client detail",
          "assets",
          "creation",
          "settings",
          "profile",
          "spatial",
          "review",
          "recording",
        ].map((s) => (
          <button key={s} onClick={() => setScreen(s)}>
            {s}
          </button>
        ))}
        <button onClick={() => setFixtureSession("fixture-session-2")}>
          Switch fixture session
        </button>
        <button onClick={() => setFixtureSession(null)}>Sign out fixture session</button>
      </nav>
      <WorkspaceSessionProvider configured>
        {screen === "dashboard" ? (
          <Dashboard />
        ) : screen === "projects" ? (
          <ProjectsWorkspace />
        ) : screen === "detail" ? (
          <ProjectWorkspace
            projectId="e67ea056-e196-445c-8c9b-55b2058a5d58"
            initialTab={new URLSearchParams(location.search).get("tab") ?? undefined}
          />
        ) : screen === "clients" ? (
          <ClientsWorkspace />
        ) : screen === "client detail" ? (
          <ClientWorkspace clientId="a046df5a-e5e4-4727-a191-2266e031bba9" />
        ) : screen === "creation" ? (
          <CreationWorkspace />
        ) : screen === "settings" ? (
          <SettingsWorkspace />
        ) : screen === "profile" ? (
          <ProfileWorkspace />
        ) : screen === "recording" ? (
          <DeviceRecorder />
        ) : screen === "spatial" ? (
          <SpatialEntry />
        ) : screen === "review" ? (
          <ReviewWorkspace />
        ) : (
          <AssetsWorkspace />
        )}
      </WorkspaceSessionProvider>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
