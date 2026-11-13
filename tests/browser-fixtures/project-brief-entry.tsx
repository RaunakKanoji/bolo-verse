import React from "react";
import { createRoot } from "react-dom/client";
import ProjectBrief from "../../apps/web/src/features/projects/ProjectBrief";
import "../../packages/design-tokens/generated/tokens.css";

createRoot(document.getElementById("root")!).render(
  <>
    <a href="/another-page">Leave project</a>
    <ProjectBrief
      projectId="b2000000-0000-4000-8000-000000000001"
      objective="Launch this collection"
    />
  </>,
);
