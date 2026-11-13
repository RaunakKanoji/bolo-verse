import { createRoot } from "react-dom/client";
import ProjectBrief from "../../apps/web/src/features/projects/ProjectBrief";
import "../../packages/design-tokens/generated/tokens.css";

createRoot(document.getElementById("root")!).render(
  <ProjectBrief
    projectId="b3000000-0000-4000-8000-000000000001"
    objective="Launch the collection"
  />,
);
