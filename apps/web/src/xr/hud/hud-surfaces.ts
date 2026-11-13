import type { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { StudioOverview } from "@/lib/contracts/workspace";
import type { AFrameEntity, AFrameScene } from "../runtime/aframe-types";
import type { XRRealm } from "../runtime/load-aframe";
import { HUD_NAVIGATION, type HudPanelId, type HudState } from "./hud-state";

export type HudSnapshot = {
  state: HudState;
  data: StudioOverview | null;
  notice: string;
  immersive: boolean;
};
type Surface = {
  id: string;
  panel: HudPanelId;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  body?: string;
  eyebrow?: string;
  action: string;
  active?: boolean;
};
type SurfaceComponent = {
  el: AFrameEntity;
  data: {
    title: string;
    body: string;
    eyebrow: string;
    width: number;
    height: number;
    active: boolean;
  };
  texture: CanvasTexture;
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  draw(): void;
  enter(): void;
  leave(): void;
  hovered: boolean;
};

/** Individual interactive surfaces, never a screenshot of a DOM application. */
function registerSurface(realm: XRRealm) {
  const aframe = realm.window.AFRAME;
  if (aframe.components["shape-hud-surface"]) return;
  aframe.registerComponent("shape-hud-surface", {
    schema: {
      title: { default: "" },
      body: { default: "" },
      eyebrow: { default: "" },
      width: { default: 1 },
      height: { default: 0.3 },
      active: { default: false },
    },
    init(this: SurfaceComponent) {
      const THREE = aframe.THREE;
      const canvas = realm.document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = Math.max(128, Math.round((1024 * this.data.height) / this.data.width));
      this.texture = new THREE.CanvasTexture(canvas);
      this.texture.colorSpace = THREE.SRGBColorSpace;
      this.mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(this.data.width, this.data.height),
        new THREE.MeshBasicMaterial({
          map: this.texture,
          transparent: true,
          alphaTest: 0.08,
          depthWrite: false,
        }),
      );
      this.el.setObject3D("mesh", this.mesh);
      this.enter = () => {
        this.hovered = true;
        this.draw();
      };
      this.leave = () => {
        this.hovered = false;
        this.draw();
      };
      this.el.addEventListener("mouseenter", this.enter);
      this.el.addEventListener("mouseleave", this.leave);
    },
    update(this: SurfaceComponent) {
      this.draw();
    },
    draw(this: SurfaceComponent) {
      const canvas = this.texture.image as HTMLCanvasElement;
      const c = canvas.getContext("2d");
      if (!c) return;
      const h = canvas.height;
      c.clearRect(0, 0, 1024, h);
      c.fillStyle = this.data.active ? "#393250" : this.hovered ? "#303044" : "#1b1c29";
      c.beginPath();
      c.roundRect(3, 3, 1018, h - 6, Math.min(40, h / 5));
      c.fill();
      c.strokeStyle = this.data.active || this.hovered ? "#a99bff" : "#45415f";
      c.lineWidth = 3;
      c.stroke();
      const fontSize = Math.min(h * 0.25, 58 / this.data.width);
      const left = 36;
      let y = this.data.eyebrow ? Math.min(65, h * 0.2) : this.data.body ? h * 0.37 : h * 0.54;
      if (this.data.eyebrow) {
        c.font = `500 ${Math.min(h * 0.14, 31 / this.data.width)}px system-ui`;
        c.fillStyle = "#c0b5ff";
        c.fillText(this.data.eyebrow, left, y, 950);
        y += fontSize + 15;
      }
      c.font = `600 ${fontSize}px system-ui`;
      c.fillStyle = "#f3f2fa";
      c.fillText(this.data.title, left, y, 950);
      if (this.data.body) {
        c.font = `400 ${Math.min(h * 0.19, 43 / this.data.width)}px system-ui`;
        c.fillStyle = "#b7b9c9";
        const words = this.data.body.split(/\s+/);
        let line = "",
          row = 0;
        for (const word of words) {
          if (c.measureText(`${line} ${word}`).width > 940 && line) {
            c.fillText(line, left, y + fontSize + 8 + row++ * (fontSize * 0.8));
            line = "";
            if (row >= 3) break;
          }
          line += `${line ? " " : ""}${word}`;
        }
        if (line && row < 3) c.fillText(line, left, y + fontSize + 8 + row * (fontSize * 0.8), 940);
      }
      this.texture.needsUpdate = true;
    },
    remove(this: SurfaceComponent) {
      this.el.removeEventListener("mouseenter", this.enter);
      this.el.removeEventListener("mouseleave", this.leave);
      this.el.removeObject3D("mesh");
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.texture.dispose();
    },
  });
}

export function createHudSurfaces({ state, data, notice, immersive }: HudSnapshot): Surface[] {
  const active = HUD_NAVIGATION.find((n) => n.id === state.workspace)!;
  const selected = data?.projects.find((p) => p.id === state.projectId);
  const result: Surface[] = [
    {
      id: "heading",
      panel: "main",
      x: 0,
      y: 0.42,
      width: 1.58,
      height: 0.25,
      title: state.workspace === "workspace" ? "Your creative studio" : active.label,
      eyebrow: "SHAPE STUDIO  /  SPATIAL WORKSPACE",
      action: "focus:main",
    },
    {
      id: "status",
      panel: "main",
      x: 0,
      y: 0.15,
      width: 1.58,
      height: 0.23,
      title:
        selected?.name ??
        (data
          ? `${data.metrics.activeProjects} active projects  ·  ${data.metrics.pendingReviews} pending reviews`
          : "A little more room to create."),
      body: selected ? selected.objective : notice,
      action: "focus:main",
    },
  ];
  if (state.workspace === "workspace" || state.workspace === "projects") {
    const projects = data?.projects.slice(0, 4) ?? [];
    for (const [index, project] of projects.entries())
      result.push({
        id: `project-${project.id}`,
        panel: "main",
        x: index % 2 === 0 ? -0.405 : 0.405,
        y: -0.12 - Math.floor(index / 2) * 0.24,
        width: 0.77,
        height: 0.21,
        title: project.name,
        body: `${project.clientName ?? "No client assigned"} · ${project.progress === null ? "Progress not set" : `${project.progress}% complete`}`,
        eyebrow: project.status.replaceAll("_", " ").toUpperCase(),
        action: `project:${project.id}`,
        active: selected?.id === project.id,
      });
    if (!projects.length)
      result.push({
        id: "empty",
        panel: "main",
        x: 0,
        y: -0.2,
        width: 1.58,
        height: 0.36,
        title: data ? "No projects yet" : "Your projects appear here",
        body: data
          ? "Create a project in your connected workspace. Your brief, assets and feedback will appear here."
          : notice,
        action: "nav:projects",
      });
  } else
    result.push({
      id: "workflow",
      panel: "main",
      x: 0,
      y: -0.19,
      width: 1.58,
      height: 0.36,
      title: `Continue in ${active.label}`,
      body: `${active.description} Use Open workspace for its full editing controls.`,
      action: "open-workspace",
    });
  HUD_NAVIGATION.forEach((nav, i) =>
    result.push({
      id: `nav-${nav.id}`,
      panel: "navigation",
      x: 0,
      y: 0.59 - i * 0.13,
      width: 0.51,
      height: 0.115,
      title: nav.label,
      action: `nav:${nav.id}`,
      active: state.workspace === nav.id,
    }),
  );
  result.push(
    {
      id: "assistant",
      panel: "assistant",
      x: 0,
      y: 0.18,
      width: 0.54,
      height: 0.38,
      title: "Shape AI",
      eyebrow: "IDLE",
      body: "Select a project to open its existing text and voice assistant.",
      action: "focus:assistant",
    },
    {
      id: "assistant-open",
      panel: "assistant",
      x: 0,
      y: -0.11,
      width: 0.54,
      height: 0.15,
      title: selected?.canEdit ? "Open project assistant" : "Choose an editable project",
      action: selected?.canEdit ? "open-assistant" : "nav:projects",
    },
  );
  ["workspace", "projects", "brainstorm", "create", "assets"].forEach((key, i) => {
    const nav = HUD_NAVIGATION.find((n) => n.id === key)!;
    result.push({
      id: `dock-${key}`,
      panel: "dock",
      x: -0.48 + i * 0.24,
      y: 0,
      width: 0.22,
      height: 0.12,
      title: nav.label,
      action: `nav:${key}`,
      active: state.workspace === key,
    });
  });
  result.push({
    id: "dock-reset",
    panel: "dock",
    x: 0.72,
    y: 0,
    width: 0.22,
    height: 0.12,
    title: "Reset view",
    action: "reset-view",
  });
  result.push({
    id: "expand-layout",
    panel: "main",
    x: -0.57,
    y: 0.64,
    width: 0.4,
    height: 0.12,
    title: "All panels",
    action: "layout:STANDARD",
  });
  if (immersive)
    result.push({
      id: "exit-vr",
      panel: "main",
      x: 0.57,
      y: 0.64,
      width: 0.4,
      height: 0.12,
      title: "Exit VR",
      action: "exit-vr",
    });
  return result;
}

/** Shares StudioAdapter's scene and lifetime; no renderer or animation loop of its own. */
export class HudSurfaces {
  private groups = new Map<HudPanelId, AFrameEntity>();
  private elements = new Map<string, AFrameEntity>();
  private root: AFrameEntity;
  constructor(
    private realm: XRRealm,
    private scene: AFrameScene,
  ) {
    registerSurface(realm);
    this.root = realm.document.createElement("a-entity") as AFrameEntity;
    this.root.id = "shape-spatial-hud";
    scene.append(this.root);
    for (const id of ["main", "navigation", "assistant", "dock"] as const) {
      const group = realm.document.createElement("a-entity") as AFrameEntity;
      group.dataset.hudPanel = id;
      this.root.append(group);
      this.groups.set(id, group);
    }
  }
  update(snapshot: HudSnapshot) {
    const { state, immersive } = snapshot;
    const placements: Record<HudPanelId, [number, number, number, number]> = {
      main: [0, 1.5, -1.85, 0],
      navigation: [-1.15, 1.5, -1.65, 22],
      assistant: [1.15, 1.5, -1.65, -22],
      dock: [-0.12, 0.74, -1.45, 0],
    };
    const visibility = new Map<HudPanelId, boolean>();
    for (const [id, group] of this.groups) {
      const [x, y, z, rotation] = placements[id];
      const offset = state.preferences.offsets[id];
      group.setAttribute("position", [x + offset[0], y + offset[1], z + offset[2]].join(" "));
      group.setAttribute("rotation", `0 ${rotation} 0`);
      // Desktop controls mirror side panels accessibly; immersive controls are all actual scene geometry.
      const expanded =
        state.preferences.preset === "STANDARD" || state.preferences.preset === "IMMERSIVE";
      const visible = id === "main" || (immersive && (id === "dock" || expanded));
      visibility.set(id, visible);
      group.setAttribute("visible", visible);
      for (const el of Array.from(group.children))
        el.classList.toggle("studio-interactive", visible);
    }
    const next = createHudSurfaces(snapshot),
      ids = new Set(next.map((s) => s.id));
    for (const [id, el] of this.elements)
      if (!ids.has(id)) {
        el.remove();
        this.elements.delete(id);
      }
    for (const s of next) {
      let el = this.elements.get(s.id);
      if (!el) {
        el = this.realm.document.createElement("a-entity") as AFrameEntity;
        this.elements.set(s.id, el);
        this.groups.get(s.panel)!.append(el);
      }
      el.dataset.hudAction = s.action;
      el.setAttribute("position", `${s.x} ${s.y} 0.01`);
      el.setAttribute("shape-hud-surface", {
        title: s.title,
        body: s.body ?? "",
        eyebrow: s.eyebrow ?? "",
        width: s.width,
        height: s.height,
        active: s.active ?? false,
      });
      // Hidden groups must not remain raycast targets.
      el.classList.toggle("studio-interactive", visibility.get(s.panel) === true);
    }
  }
  dispose() {
    this.root.remove();
    this.elements.clear();
    this.groups.clear();
  }
}
