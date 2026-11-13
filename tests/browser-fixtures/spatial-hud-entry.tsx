import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession } from "./creation-auth";
import { WorkspaceSessionProvider } from "../../apps/web/src/features/platform/WorkspaceSession";
import SpatialHUDShell from "../../apps/web/src/xr/hud/SpatialHUDShell";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <nav aria-label="Fixture session">
      <button onClick={() => setFixtureSession("hud-session-b")}>Switch fixture session</button>
    </nav>
    <WorkspaceSessionProvider configured>
      <SpatialHUDShell />
    </WorkspaceSessionProvider>
  </StrictMode>,
);
