import type { Object3D } from "three";
import {
  createStudioDocument,
  serializeSceneDocument,
  type SceneDocument,
  type SceneEntity,
  type WorkspaceProject,
} from "../serializers/scene-document";
import type { AFrameEntity, AFrameScene } from "./aframe-types";
import { loadAFrame, type XRRealm } from "./load-aframe";
import { RuntimeScope } from "./scope";

export type RuntimeStats = { fps: number; calls: number; triangles: number };
export type ViewingPosition = "seated" | "standing";
type Callbacks = {
  onSelect(entity: SceneEntity): void;
  onSession(active: boolean): void;
  onStats(stats: RuntimeStats): void;
  onError(message: string, fatal?: boolean): void;
};

export class StudioAdapter {
  private readonly scope = new RuntimeScope();
  private readonly document: SceneDocument;
  private scene?: AFrameScene;
  private realm?: XRRealm;
  private camera?: AFrameEntity;
  private rig?: AFrameEntity;
  private panels = new Map<string, AFrameEntity>();
  private position: ViewingPosition = "standing";
  private session?: XRSession;
  private sessionPending = false;

  constructor(
    private readonly host: HTMLDivElement,
    project: WorkspaceProject,
    private readonly callbacks: Callbacks,
  ) {
    this.document = createStudioDocument(project);
  }

  async initialize(): Promise<void> {
    const realm = await loadAFrame(this.host, this.scope);
    if (!realm || this.scope.signal.aborted) return;
    this.realm = realm;
    const { document, window } = realm;

    const scene = document.createElement("a-scene") as AFrameScene;
    this.scene = scene;
    // A-Frame's built-in UI can offer a session during component setup. Only
    // our explicit controls request one; never auto-offer or enter fullscreen.
    scene.enterVR = (_useAR, useOfferSession) =>
      useOfferSession
        ? Promise.resolve()
        : this.enterVR().catch(() =>
            this.callbacks.onError(
              "The headset session could not start. Use Enter VR to try again.",
            ),
          );
    scene.exitVR = () =>
      this.exitVR().catch(() =>
        this.callbacks.onError(
          "The headset session could not close. Use your headset's system menu to exit.",
        ),
      );

    scene.setAttribute("embedded", "");
    scene.setAttribute("background", "color: #111827");
    scene.setAttribute(
      "renderer",
      "antialias: true; colorManagement: true; maxCanvasWidth: 1920; maxCanvasHeight: 1440; highRefreshRate: true",
    );
    scene.setAttribute(
      "xr-mode-ui",
      "enabled: false; enterVREnabled: false; enterAREnabled: false",
    );
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");
    scene.setAttribute("keyboard-shortcuts", "enterVR: false; exitVR: false");
    scene.setAttribute("loading-screen", "enabled: false");
    scene.setAttribute("webxr", "referenceSpaceType: local-floor; requiredFeatures: local-floor");
    scene.setAttribute("studio-stats", "");
    scene.style.cssText = "display:block;position:relative;width:100%;height:100%;";

    const listen = (target: EventTarget, event: string, callback: EventListener) => {
      target.addEventListener(event, callback, { signal: this.scope.signal });
    };
    listen(scene, "studio-stats", (event) =>
      this.callbacks.onStats((event as CustomEvent<RuntimeStats>).detail),
    );
    listen(scene, "click", (event) => {
      const entity = (event.target as HTMLElement).closest<HTMLElement>("[data-studio-id]");
      if (entity?.dataset.studioId) this.select(entity.dataset.studioId);
      if ((event.target as HTMLElement).dataset.studioExit !== undefined)
        void this.exitVR().catch(() =>
          this.callbacks.onError(
            "The headset session could not close. Use your headset's system menu to exit.",
          ),
        );
    });

    this.buildRoom(scene);
    this.rig = this.entity("a-entity", { id: "studio-camera-rig" });
    this.camera = this.entity("a-entity", {
      camera: "active: true; fov: 65; near: 0.05; far: 60",
      position: "0 1.6 1.4",
      "look-controls":
        "pointerLockEnabled: false; magicWindowTrackingEnabled: false; touchEnabled: true",
      "wasd-controls": "enabled: false; acceleration: 12; fly: false",
    });
    this.rig.append(this.camera);
    for (const hand of ["left", "right"]) {
      this.rig.append(
        this.entity("a-entity", {
          "laser-controls": `hand: ${hand}; model: false`,
          raycaster: "objects: .studio-interactive; far: 12; lineColor: #a5b4fc",
        }),
      );
    }
    scene.append(this.rig);
    scene.append(
      this.entity("a-entity", {
        cursor: "rayOrigin: mouse; fuse: false",
        raycaster: "objects: .studio-interactive; far: 15",
      }),
    );

    for (const data of this.document.entities) {
      const panel = this.entity("a-entity", {
        position: data.transform.position.join(" "),
        rotation: data.transform.rotation.join(" "),
        scale: data.transform.scale.join(" "),
        "studio-panel": {
          title: data.properties.title,
          body: data.properties.body,
          eyebrow: data.properties.eyebrow,
          selected: data.id === "project-overview",
        },
      });
      panel.classList.add("studio-interactive");
      panel.dataset.studioId = data.id;
      this.panels.set(data.id, panel);
      scene.append(panel);
    }
    const exitPanel = this.entity("a-entity", {
      position: "3.9 1.7 -1.6",
      rotation: "0 -55 0",
      scale: "0.5 0.5 0.5",
      "studio-panel": {
        title: "Exit VR",
        body: "Return to the desktop workspace. You can also use your headset's system menu.",
        eyebrow: "SESSION CONTROL",
      },
    });
    exitPanel.classList.add("studio-interactive");
    exitPanel.dataset.studioExit = "true";
    scene.append(exitPanel);

    // Own teardown before connecting: even setup errors must release the scene.
    this.scope.own(() => {
      scene.pause();
      scene.renderer?.setAnimationLoop(null);
      if (this.session) void this.session.end().catch(() => undefined);
      this.session = undefined;
      // Custom components dispose their meshes; native components own theirs.
      scene.remove();
      scene.renderer?.dispose();
      scene.renderer?.forceContextLoss();
      this.panels.clear();
    });

    const ready = new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(
        () =>
          reject(new Error("The 3D scene did not finish loading. Reload the workspace to retry.")),
        20_000,
      );
      this.scope.own(() => window.clearTimeout(timeout));
      listen(scene, "renderstart", () => {
        window.clearTimeout(timeout);
        resolve();
      });
      this.scope.signal.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
    });
    document.body.append(scene);
    // Scene defaults are installed during connection, overriding absent attrs.
    scene.removeAttribute("inspector");
    scene.removeAttribute("screenshot");
    scene.setAttribute(
      "xr-mode-ui",
      "enabled: false; enterVREnabled: false; enterAREnabled: false",
    );
    scene.setAttribute("device-orientation-permission-ui", "enabled: false");
    scene.setAttribute("keyboard-shortcuts", "enterVR: false; exitVR: false");

    const renderer = scene.renderer;
    if (!renderer)
      throw new Error(
        "WebGL could not start. Enable hardware acceleration and reload the workspace.",
      );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    await ready;
    if (this.scope.signal.aborted) return;
    const canvas = scene.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "Interactive 3D workspace. Drag to look, use W A S D to move, and press Tab to return to workspace controls.",
    );
    const focusCanvas = () => canvas.focus({ preventScroll: true });
    const enableMovement = () => this.setMovement(true);
    const disableMovement = () => this.setMovement(false);
    listen(canvas, "pointerdown", focusCanvas);
    listen(canvas, "focus", enableMovement);
    listen(canvas, "blur", disableMovement);
    listen(window, "blur", disableMovement);
    listen(document, "visibilitychange", () => {
      if (document.hidden) disableMovement();
    });
    listen(canvas, "webglcontextlost", (event) => {
      event.preventDefault();
      disableMovement();
      this.callbacks.onError(
        "The graphics context was interrupted. Reload the workspace to restore the scene.",
        true,
      );
    });
    const observer = new window.ResizeObserver(() => {
      if (!this.scope.signal.aborted) scene.resize();
    });
    observer.observe(this.host);
    this.scope.own(() => observer.disconnect());
    this.callbacks.onSelect(this.document.entities[0]);
  }

  private entity(
    tag: string,
    attributes: Record<string, string | Record<string, unknown>>,
  ): AFrameEntity {
    const element = this.realm!.document.createElement(tag) as AFrameEntity;
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  }

  private buildRoom(scene: AFrameScene): void {
    const box = (position: string, width: number, height: number, depth: number, color: string) => {
      scene.append(
        this.entity("a-box", {
          position,
          width: String(width),
          height: String(height),
          depth: String(depth),
          material: `color: ${color}; roughness: 0.9; metalness: 0.1`,
        }),
      );
    };
    scene.append(
      this.entity("a-entity", { light: "type: ambient; color: #dce3ff; intensity: 1.4" }),
    );
    scene.append(
      this.entity("a-entity", {
        light: "type: directional; color: #ffffff; intensity: 1.5",
        position: "1 5 3",
      }),
    );
    box("0 -0.11 -1", 14, 0.2, 14, "#182237");
    box("0 2.1 -4.6", 11, 4.2, 0.2, "#202a40");
    box("-5.5 2.1 -0.1", 0.2, 4.2, 9, "#172135");
    box("5.5 2.1 -0.1", 0.2, 4.2, 9, "#172135");
    box("0 0.015 -2.5", 8, 0.02, 3.6, "#253047");
    box("0 3.75 -4.45", 8.7, 0.035, 0.035, "#939ee8");
    for (const x of [-4.4, -3.9, 3.9, 4.4]) box(`${x} 2.1 -4.4`, 0.025, 2.8, 0.04, "#45516d");
    for (let z = -4; z <= 4; z += 2) box(`0 0.002 ${z}`, 11, 0.004, 0.01, "#2c3850");
    for (let x = -4; x <= 4; x += 2) box(`${x} 0.002 0`, 0.01, 0.004, 10, "#2c3850");
  }

  private setMovement(enabled: boolean): void {
    if (!this.camera || this.scope.signal.aborted) return;
    this.camera.setAttribute("wasd-controls", "enabled", enabled && !this.session);
    const controls = this.camera.components["wasd-controls"];
    if (!enabled && controls) {
      controls.velocity?.set(0, 0, 0);
      controls.keys = {};
    }
  }

  select(id: string): void {
    if (this.scope.signal.aborted) return;
    const entity = this.document.entities.find((item) => item.id === id);
    if (!entity) return;
    for (const [panelId, panel] of this.panels)
      panel.setAttribute("studio-panel", "selected", panelId === id);
    this.callbacks.onSelect(entity);
  }

  recenter(position: ViewingPosition = this.position): void {
    if (this.scope.signal.aborted || !this.camera || !this.rig) return;
    this.position = position;
    this.rig.object3D.position.set(0, this.session && position === "seated" ? 0.4 : 0, 0);
    this.rig.object3D.rotation.set(0, 0, 0);
    if (!this.session) {
      this.camera.object3D.position.set(0, position === "seated" ? 1.2 : 1.6, 1.4);
      this.camera.object3D.rotation.set(0, 0, 0);
      const look = this.camera.components["look-controls"];
      for (const object of [look?.yawObject, look?.pitchObject] as (Object3D | undefined)[])
        object?.rotation.set(0, 0, 0);
    }
    this.setMovement(false);
  }

  async enterVR(): Promise<void> {
    const scene = this.scene;
    if (!scene || this.scope.signal.aborted || this.sessionPending || this.session) return;
    const window = this.realm?.window;
    if (!window?.navigator.xr || !window.isSecureContext)
      throw new Error("Immersive VR is unavailable in this browser.");
    this.sessionPending = true;
    let session: XRSession | undefined;
    try {
      // Called directly from a user gesture; do not await a second support probe
      // before requestSession, which can consume transient browser activation.
      session = await window.navigator.xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
      });
      if (this.scope.signal.aborted) {
        await session.end();
        return;
      }
      this.session = session;
      scene.xrSession = session;
      session.addEventListener(
        "end",
        () => {
          this.session = undefined;
          scene.xrSession = undefined;
          if (this.scope.signal.aborted) return;
          scene.renderer.xr.enabled = false;
          scene.removeState("vr-mode");
          scene.emit("exit-vr", { target: scene });
          this.recenter();
          scene.resize();
          this.callbacks.onSession(false);
        },
        { once: true },
      );
      scene.renderer.xr.enabled = true;
      scene.renderer.xr.setReferenceSpaceType("local-floor");
      await scene.renderer.xr.setSession(session);
      if (this.scope.signal.aborted) {
        await session.end();
        return;
      }
      if (!scene.renderer.xr.isPresenting)
        throw new Error("The headset did not start presenting the workspace.");
      scene.addState("vr-mode");
      scene.emit("enter-vr", { target: scene });
      this.recenter();
      this.callbacks.onSession(true);
    } catch {
      if (session) await session.end().catch(() => undefined);
      if (!this.scope.signal.aborted)
        throw new Error(
          "The headset session could not start. Check headset connection and permissions, then try again.",
        );
    } finally {
      this.sessionPending = false;
    }
  }

  async exitVR(): Promise<void> {
    if (this.session) await this.session.end();
  }

  serialize(): SceneDocument {
    return serializeSceneDocument(this.document);
  }

  dispose(): void {
    this.scope.dispose();
    this.realm = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.rig = undefined;
  }
}
