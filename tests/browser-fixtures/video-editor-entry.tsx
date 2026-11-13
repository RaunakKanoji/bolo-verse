import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import VideoEditorWorkspace from "../../apps/web/src/features/video/VideoEditorWorkspace";
import { WorkspaceSessionProvider } from "../../apps/web/src/features/platform/WorkspaceSession";
import { setFixtureSession } from "./creation-auth";
import "../../packages/design-tokens/generated/tokens.css";
function Fixture() {
  const [mounted, setMounted] = useState(true);
  return (
    <>
      <p>Explicit HTTP/identity fixture. Actual Shotstack browser SDK; no live provider calls.</p>
      <nav>
        <button onClick={() => setFixtureSession("fixture-video-session-2")}>
          Switch fixture identity
        </button>
        <button onClick={() => setMounted((value) => !value)}>Toggle video editor</button>
        <a href="/other">Leave editor fixture</a>
      </nav>
      <WorkspaceSessionProvider configured>
        {mounted && (
          <VideoEditorWorkspace initialProjectId="e67ea056-e196-445c-8c9b-55b2058a5d58" />
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
