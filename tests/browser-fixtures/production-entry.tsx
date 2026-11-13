import { createRoot } from "react-dom/client";
import ProjectProduction from "../../apps/web/src/features/projects/ProjectProduction";
import "../../packages/design-tokens/generated/tokens.css";
createRoot(document.getElementById("root")!).render(
  <ProjectProduction projectId="a7000000-0000-4000-8000-000000000001" />,
);
