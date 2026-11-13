import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import CreationVoice from "../../apps/web/src/features/platform/CreationVoice";
import ProjectWorkspace from "../../apps/web/src/features/platform/ProjectWorkspace";
import { WorkspaceSessionProvider } from "../../apps/web/src/features/platform/WorkspaceSession";
import { setFixtureSession } from "./creation-auth";
import "../../packages/design-tokens/generated/tokens.css";
function Fixture() {
  const [project, setProject] = useState<string | undefined>(
    "e67ea056-e196-445c-8c9b-55b2058a5d58",
  );
  return (
    <>
      <p>Explicit HTTP and identity fixture. No real provider or private account is used.</p>
      <nav aria-label="Fixture controls">
        <button onClick={() => setProject("a046df5a-e5e4-4727-a191-2266e031bba9")}>
          Change fixture project
        </button>
        <button onClick={() => setProject(undefined)}>Remove fixture project</button>
        <button onClick={() => setFixtureSession("fixture-session-2")}>
          Switch fixture identity
        </button>
        <button onClick={() => setFixtureSession(null)}>Sign out fixture identity</button>
      </nav>
      <WorkspaceSessionProvider configured>
        {window.location.pathname.startsWith("/projects/") && project ? (
          <ProjectWorkspace
            projectId={project}
            initialTab={new URLSearchParams(window.location.search).get("tab") ?? undefined}
          />
        ) : (
          <CreationVoice projectId={project} />
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
