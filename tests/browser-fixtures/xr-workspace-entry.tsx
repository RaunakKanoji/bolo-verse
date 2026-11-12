import { createRoot } from "react-dom/client";
import XRWorkspaceClient from "../../src/xr/XRWorkspaceClient";
import { XRWorkspaceDataSchema } from "../../src/lib/contracts/xr-workspace";

// This entry is bundled by a test-only localhost server. It is not a Next route
// and cannot bypass authentication or load private application data.
async function mount() {
  const data = XRWorkspaceDataSchema.parse(await (await fetch("/__fixture/workspace")).json());
  createRoot(document.getElementById("root")!).render(<XRWorkspaceClient project={data.project} initialData={data} />);
}
void mount().catch(error => {
  const target = document.getElementById("root")!;
  target.setAttribute("role", "alert");
  target.textContent = error instanceof Error ? error.message : "The component fixture could not mount.";
});
