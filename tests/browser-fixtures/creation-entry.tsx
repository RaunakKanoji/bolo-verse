import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession } from "./creation-auth";
import CreativePlayground from "../../apps/web/src/features/playground/CreativePlayground";
import "../../packages/design-tokens/generated/tokens.css";
function Fixture() {
  const [projectId, setProjectId] = useState("e67ea056-e196-445c-8c9b-55b2058a5d58");
  return (
    <>
      <button onClick={() => setProjectId("6b6632c9-ff53-4113-9a62-2a55254f0bfd")}>
        Switch fixture project
      </button>
      <button onClick={() => setFixtureSession(null)}>Sign out fixture account</button>
      <button onClick={() => setFixtureSession("fixture-session-2")}>
        Sign in other fixture account
      </button>
      <CreativePlayground authConfigured key={projectId} projectId={projectId} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
