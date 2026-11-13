import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession } from "./creation-auth";
import ProjectImageLibrary from "../../apps/web/src/features/projects/ProjectImageLibrary";
import "../../packages/design-tokens/generated/tokens.css";

function Fixture() {
  const [open, setOpen] = useState(true);
  const [canEdit, setCanEdit] = useState(true);
  return <>
    <button onClick={() => setOpen((value) => !value)}>{open ? "Close fixture images" : "Reopen fixture images"}</button>
    <button onClick={() => setCanEdit(false)}>Use read-only fixture role</button>
    <button onClick={() => setFixtureSession(null)}>Sign out fixture session</button>
    <button onClick={() => setFixtureSession("fixture-session-2")}>Switch fixture session</button>
    {open && <ProjectImageLibrary projectId="e67ea056-e196-445c-8c9b-55b2058a5d58" canEdit={canEdit} />}
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
