import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession } from "./creation-auth";
import { WorkspaceSessionProvider } from "../../apps/web/src/features/platform/WorkspaceSession";
import ProjectSubmission from "../../apps/web/src/features/platform/ProjectSubmission";
import "../../packages/design-tokens/generated/tokens.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <button onClick={() => setFixtureSession("different-session")}>Switch fixture session</button>
    <WorkspaceSessionProvider configured>
      <ProjectSubmission />
    </WorkspaceSessionProvider>
  </StrictMode>,
);
