import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { _roots } from "../../apps/spatial-web/node_modules/@react-three/fiber";
import type { Mesh } from "three";
import { SpatialEditor } from "@spatial/editor/SpatialEditor";
import { SessionWorkspace } from "@spatial/auth/AuthorizedSpatialWorkspace";
import type { SpatialWorkspaceFixture } from "./spatial-workspace-data";
import "../../apps/spatial-web/src/app/globals.css";

// Inspect real R3F stores from the test bundle only. Application routes neither
// import this entry nor publish renderer internals or test fixture controls.
function inspect() {
  return [..._roots.values()].map(({ store }) => {
    const { scene, gl } = store.getState();
    const objects: { name: string; type: string; position: number[]; rotation: number[]; scale: number[]; vertices: number; textureWidth: number; textureHeight: number }[] = [];
    scene.traverse((object) => {
      const mesh = object as typeof object & {
        geometry?: { getAttribute(name: string): { count: number } | undefined };
        material?: { map?: { image?: { width?: number; height?: number } } };
      };
      objects.push({
        name: object.name, type: object.type,
        position: object.position.toArray(), rotation: object.quaternion.toArray(), scale: object.scale.toArray(),
        vertices: mesh.geometry?.getAttribute("position")?.count ?? 0,
        textureWidth: mesh.material?.map?.image?.width ?? 0,
        textureHeight: mesh.material?.map?.image?.height ?? 0,
      });
    });
    return { canvasConnected: gl.domElement.isConnected, objects };
  });
}
function projectTriangle(objectId: string) {
  for (const { store } of _roots.values()) {
    const { scene, camera, gl } = store.getState();
    const group = scene.getObjectByName(objectId);
    const triangles: Mesh[] = [];
    group?.traverse((object) => {
      const mesh = object as Mesh;
      if (mesh.isMesh && mesh.geometry.getAttribute("position")?.count === 3) triangles.push(mesh);
    });
    const triangle = triangles[0];
    if (!triangle) continue;
    triangle.geometry.computeBoundingBox();
    const center = triangle.geometry.boundingBox!.getCenter(triangle.position.clone());
    triangle.localToWorld(center);
    center.project(camera);
    const bounds = gl.domElement.getBoundingClientRect();
    return { x: bounds.x + (center.x + 1) * bounds.width / 2, y: bounds.y + (1 - center.y) * bounds.height / 2 };
  }
  return null;
}
declare global {
  interface Window { __spatialFixture: { inspect: typeof inspect; projectTriangle: typeof projectTriangle; tokenCompletions: { sessionId: string; skipCache: boolean }[] } }
}
window.__spatialFixture = { inspect, projectTriangle, tokenCompletions: [] };

function SessionFixture({ projectId }: { projectId: string }) {
  const [sessionId, setSessionId] = useState<string | null>("fixture-session-a");
  const session = useMemo(() => sessionId ? {
    id: sessionId,
    async getToken(options?: { skipCache?: boolean }) {
      // This test-only token adapter represents the SDK promise. It never
      // invokes Clerk, and its fabricated values are accepted only by routes
      // intercepted in the browser test.
      const response = await fetch("/__fixture/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, skipCache: Boolean(options?.skipCache) }) });
      const data = await response.json() as { token: string | null };
      window.__spatialFixture.tokenCompletions.push({ sessionId, skipCache: Boolean(options?.skipCache) });
      return data.token;
    },
  } : null, [sessionId]);
  return <>
    <div className="fixture-controls">
      <button onClick={() => setSessionId(null)}>Sign out fixture session</button>
      <button onClick={() => setSessionId("fixture-session-b")}>Use fixture session B</button>
    </div>
    <SessionWorkspace projectId={projectId} lifecycle={{ isLoaded: true, session }} />
  </>;
}

function App({ fixture }: { fixture: SpatialWorkspaceFixture }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <div className="fixture-controls">
        <button onClick={() => setOpen((value) => !value)}>{open ? "Close fixture editor" : "Reopen fixture editor"}</button>
      </div>
      {open && (fixture.sessionFixture ? <StrictMode><SessionFixture projectId={fixture.project.id} /></StrictMode> : <SpatialEditor {...fixture} />)}
    </>
  );
}

async function mount() {
  const response = await fetch("/__fixture/workspace");
  if (!response.ok) throw new Error("No spatial workspace fixture was registered.");
  const fixture = await response.json() as SpatialWorkspaceFixture;
  createRoot(document.getElementById("root")!).render(<App fixture={fixture} />);
}
void mount().catch((error: unknown) => {
  const target = document.getElementById("root")!;
  target.setAttribute("role", "alert");
  target.textContent = error instanceof Error ? error.message : "The spatial component fixture could not mount.";
});
