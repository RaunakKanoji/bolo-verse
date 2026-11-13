import type { Object3D } from "three";
import { XRTransformSchema, type XRTransform } from "@/lib/contracts/xr-workspace";
import {
  applyTransformAction,
  SPATIAL_TRANSFORM_ACTIONS,
  type TransformAction,
} from "../interactions/transform-controls";
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
import { startSpatialAssetPreview, type SpatialAssetPreview } from "./asset-preview";
import { HudSurfaces, type HudSnapshot } from "../hud/hud-surfaces";

export type RuntimeStats = {
  fps: number;
  frameTimeMs: number;
  calls: number;
  triangles: number;
  objects: number;
};
export type ViewingPosition = "seated" | "standing";
type Callbacks = {
  onHUDAction?(action: string): void;
  onSelect(entity: SceneEntity): void;
  onSession(active: boolean): void;
  onStats(stats: RuntimeStats): void;
  onError(message: string, fatal?: boolean): void;
  onDocumentChange?(document: SceneDocument): void;
};

export class StudioAdapter {
  private readonly scope = new RuntimeScope();
  private document: SceneDocument;
  private readonly baseline = new Map<string, XRTransform>();
  private selectedId: string;
  private editable = true;
  private spatialTools: AFrameEntity[] = [];
  private assetPreviews = new Map<string, SpatialAssetPreview>();
  private scene?: AFrameScene;
  private realm?: XRRealm;
  private camera?: AFrameEntity;
  private rig?: AFrameEntity;
  private panels = new Map<string, AFrameEntity>();
  private position: ViewingPosition = "standing";
  private session?: XRSession;
  private sessionPending = false;
  private hud?: HudSurfaces;
  private hudRoom?: AFrameEntity;

  constructor(
    private readonly host: HTMLDivElement,
    project: WorkspaceProject,
    private readonly callbacks: Callbacks,
    initialDocument?: SceneDocument,
  ) {
    this.document = serializeSceneDocument(initialDocument ?? createStudioDocument(project));
    if (this.document.projectId !== project.id)
      throw new Error("A scene must belong to the active project.");
    this.selectedId = this.document.entities[0].id;
    for (const entity of this.document.entities)
      this.baseline.set(entity.id, XRTransformSchema.parse(entity.transform));
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
    scene.setAttribute("background", "color: #f5f7fb");
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
      const hudAction = (event.target as HTMLElement).closest<HTMLElement>("[data-hud-action]")
        ?.dataset.hudAction;
      if (hudAction) {
        this.callbacks.onHUDAction?.(hudAction);
        return;
      }
      const entity = (event.target as HTMLElement).closest<HTMLElement>("[data-studio-id]");
      if (entity?.dataset.studioId) this.select(entity.dataset.studioId);
      const actionId = (event.target as HTMLElement).closest<HTMLElement>("[data-studio-action]")
        ?.dataset.studioAction;
      if (actionId && this.editable) {
        if (actionId === "reset") this.resetTransform(this.selectedId);
        else {
          const action = SPATIAL_TRANSFORM_ACTIONS.find((item) => item.id === actionId);
          if (action) this.transformSelected(action.action);
        }
      }
      if ((event.target as HTMLElement).dataset.studioExit !== undefined)
        void this.exitVR().catch(() =>
          this.callbacks.onError(
            "The headset session could not close. Use your headset's system menu to exit.",
          ),
        );
    });

    this.hudRoom = this.entity("a-entity", {});
    scene.append(this.hudRoom);
    this.buildRoom(this.hudRoom);
    this.rig = this.entity("a-entity", { id: "studio-camera-rig" });
    this.camera = this.entity("a-entity", {
      camera: this.callbacks.onHUDAction
        ? "active: true; fov: 38; near: 0.05; far: 60"
        : "active: true; fov: 65; near: 0.05; far: 60",
      position: this.callbacks.onHUDAction ? "0 1.6 0" : "0 1.6 1.4",
      "look-controls":
        "pointerLockEnabled: false; magicWindowTrackingEnabled: false; touchEnabled: true",
      "wasd-controls": "enabled: false; acceleration: 12; fly: false",
    });
    this.rig.append(this.camera);
    for (const hand of ["left", "right"]) {
      this.rig.append(
        this.entity("a-entity", {
          "laser-controls": `hand: ${hand}; model: false`,
          raycaster: "objects: .studio-interactive; far: 12; lineColor: #3478f6",
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

    if (this.callbacks.onHUDAction) {
      this.hud = new HudSurfaces(realm, scene);
    } else {
      this.reconcilePanels();
      this.buildSpatialTools(scene);
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
      for (const preview of this.assetPreviews.values()) preview.dispose();
      this.assetPreviews.clear();
      this.panels.clear();
      this.spatialTools = [];
      this.hud?.dispose();
      this.hud = undefined;
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
    this.select(this.selectedId);
  }

  private entity(
    tag: string,
    attributes: Record<string, string | Record<string, unknown>>,
  ): AFrameEntity {
    const element = this.realm!.document.createElement(tag) as AFrameEntity;
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  }

  private buildRoom(scene: AFrameEntity): void {
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
      this.entity("a-entity", { light: "type: ambient; color: #ffffff; intensity: 1.8" }),
    );
    scene.append(
      this.entity("a-entity", {
        light: "type: directional; color: #ffffff; intensity: 0.8",
        position: "1 5 3",
      }),
    );
    box("0 -0.11 0", 64, 0.2, 64, "#e7ecf3");
    box("0 2.1 -31.5", 64, 4.2, 0.2, "#f5f7fb");

    box("0 0.015 -2.5", 8, 0.02, 3.6, "#f1f5fb");
    box("0 3.75 -31.35", 40, 0.035, 0.035, "#b1ccfa");
    for (const x of [-4.4, -3.9, 3.9, 4.4]) box(`${x} 2.1 -31.3`, 0.025, 2.8, 0.04, "#dfe4ec");
    for (let z = -4; z <= 4; z += 2) box(`0 0.002 ${z}`, 11, 0.004, 0.01, "#dae1eb");
    for (let x = -4; x <= 4; x += 2) box(`${x} 0.002 0`, 0.01, 0.004, 10, "#dae1eb");
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
    this.selectedId = id;
    for (const [panelId, panel] of this.panels)
      panel.setAttribute("studio-panel", "selected", panelId === id);
    this.callbacks.onSelect(
      serializeSceneDocument(this.document).entities.find((item) => item.id === id)!,
    );
  }

  /** Replace only scene data; the realm, camera and render loop stay owned. */
  updateDocument(input: SceneDocument): void {
    if (this.scope.signal.aborted) return;
    const document = serializeSceneDocument(input);
    if (document.projectId !== this.document.projectId)
      throw new Error("Cannot replace a scene with another project's document.");
    this.document = document;
    if (!document.entities.some((entity) => entity.id === this.selectedId))
      this.selectedId = document.entities[0].id;
    for (const entity of document.entities)
      if (!this.baseline.has(entity.id))
        this.baseline.set(entity.id, XRTransformSchema.parse(entity.transform));
    this.reconcilePanels();
    this.select(this.selectedId);
  }

  updateTransform(id: string, input: XRTransform): boolean {
    if (this.scope.signal.aborted || !this.editable) return false;
    const entity = this.document.entities.find((item) => item.id === id);
    if (!entity) return false;
    const transform = XRTransformSchema.parse(input);
    const next = this.serialize();
    next.entities.find((item) => item.id === id)!.transform = transform;
    this.updateDocument(next);
    this.callbacks.onDocumentChange?.(this.serialize());
    return true;
  }

  transformSelected(action: TransformAction): boolean {
    if (this.scope.signal.aborted || !this.editable) return false;
    const entity = this.document.entities.find((item) => item.id === this.selectedId);
    return entity
      ? this.updateTransform(entity.id, applyTransformAction(entity.transform, action))
      : false;
  }

  resetTransform(id: string): boolean {
    const transform = this.baseline.get(id);
    return transform ? this.updateTransform(id, transform) : false;
  }

  setEditable(editable: boolean): void {
    this.editable = editable;
    for (const tool of this.spatialTools) {
      tool.setAttribute("visible", editable);
      tool.classList.toggle("studio-interactive", editable);
    }
  }

  /** An explicit desktop focus frames an object; never force a headset's pose. */
  focus(id: string): void {
    this.select(id);
    const panel = this.panels.get(id);
    if (!panel || !this.camera || this.session || !this.realm) return;
    const target = new this.realm.window.AFRAME.THREE.Vector3();
    panel.object3D.getWorldPosition(target);
    const THREE = this.realm.window.AFRAME.THREE;
    const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
      panel.object3D.getWorldQuaternion(new THREE.Quaternion()),
    );
    const framed = target
      .clone()
      .addScaledVector(normal, 3.2 * Math.max(1, panel.object3D.scale.x));
    if (this.rig) this.rig.object3D.worldToLocal(framed);
    this.camera.object3D.position.copy(framed);
    this.camera.object3D.lookAt(target);
    const controls = this.camera.components["look-controls"];
    if (controls?.yawObject) controls.yawObject.rotation.y = this.camera.object3D.rotation.y;
    if (controls?.pitchObject) controls.pitchObject.rotation.x = this.camera.object3D.rotation.x;
    this.setMovement(false);
  }

  /** Load only after an explicit action; keep at most three decoded media previews. */
  async previewAsset(id: string, url: string, mimeType: string): Promise<void> {
    const entity = this.document.entities.find((item) => item.id === id);
    const panel = this.panels.get(id);
    if (this.scope.signal.aborted || !this.realm || !panel || !entity?.assetId) return;
    if (entity.properties.mimeType !== mimeType)
      throw new Error("The asset type does not match the authorized catalog.");
    this.assetPreviews.get(id)?.dispose();
    this.assetPreviews.delete(id);
    if (this.assetPreviews.size >= 3) {
      const oldest = this.assetPreviews.keys().next().value;
      if (oldest) {
        this.assetPreviews.get(oldest)?.dispose();
        this.assetPreviews.delete(oldest);
      }
    }
    const preview = startSpatialAssetPreview(
      this.realm,
      panel,
      { assetId: entity.assetId, url, mimeType },
      this.scope.signal,
    );
    this.assetPreviews.set(id, preview);
    try {
      await preview.ready;
    } catch (error) {
      if (this.assetPreviews.get(id) === preview) this.assetPreviews.delete(id);
      throw error;
    }
  }

  private reconcilePanels(): void {
    if (!this.scene || !this.realm) return;
    const ids = new Set(this.document.entities.map((entity) => entity.id));
    for (const [id, panel] of this.panels)
      if (!ids.has(id)) {
        this.assetPreviews.get(id)?.dispose();
        this.assetPreviews.delete(id);
        panel.remove();
        this.panels.delete(id);
      }
    for (const data of this.document.entities) {
      let panel = this.panels.get(data.id);
      if (!panel) {
        panel = this.entity("a-entity", {});
        panel.classList.add("studio-interactive");
        panel.dataset.studioId = data.id;
        this.panels.set(data.id, panel);
        this.scene.append(panel);
      }
      panel.setAttribute("position", data.transform.position.join(" "));
      panel.setAttribute("rotation", data.transform.rotation.join(" "));
      panel.setAttribute("scale", data.transform.scale.join(" "));
      panel.setAttribute("studio-panel", {
        title: data.properties.title,
        body: data.properties.body,
        eyebrow: data.properties.eyebrow,
        selected: data.id === this.selectedId,
      });
    }
  }

  private buildSpatialTools(scene: AFrameScene): void {
    const controls = [
      ...SPATIAL_TRANSFORM_ACTIONS.map(({ id, label }) => ({ id, label })),
      { id: "reset", label: "Reset object" },
    ];
    for (const [index, control] of controls.entries()) {
      const tool = this.entity("a-entity", {
        position: `${-1.75 + (index % 6) * 0.7} ${0.7 - Math.floor(index / 6) * 0.4} -2.6`,
        scale: "0.3 0.3 0.3",
        "studio-panel": { title: control.label, body: "", eyebrow: "", compact: true },
      });
      tool.dataset.studioAction = control.id;
      this.spatialTools.push(tool);
      scene.append(tool);
    }
    this.setEditable(this.editable);
  }

  recenter(position: ViewingPosition = this.position): void {
    if (this.scope.signal.aborted || !this.camera || !this.rig) return;
    this.position = position;
    this.rig.object3D.position.set(0, this.session && position === "seated" ? 0.4 : 0, 0);
    this.rig.object3D.rotation.set(0, 0, 0);
    if (!this.session) {
      this.camera.object3D.position.set(
        0,
        position === "seated" ? 1.2 : 1.6,
        this.callbacks.onHUDAction ? 0 : 1.4,
      );
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

  updateHUD(snapshot: HudSnapshot): void {
    if (this.scope.signal.aborted || !this.scene) return;
    this.hud?.update(snapshot);
    const environment = snapshot.state.preferences.environment;
    this.scene.dataset.hudEnvironment = environment;
    this.scene.setAttribute(
      "background",
      "color",
      environment === "Creative Workspace" ? "#252638" : "#101118",
    );
    this.hudRoom?.setAttribute("visible", environment !== "Minimal Void");
    if (this.hudRoom)
      for (const element of Array.from(this.hudRoom.children)) {
        if (element.tagName.toLowerCase() === "a-box") {
          (element as AFrameEntity).setAttribute(
            "material",
            "color",
            environment === "Creative Workspace" ? "#383747" : "#191a25",
          );
        }
      }
  }

  dispose(): void {
    this.scope.dispose();
    this.realm = undefined;
    this.scene = undefined;
    this.camera = undefined;
    this.rig = undefined;
  }
}
