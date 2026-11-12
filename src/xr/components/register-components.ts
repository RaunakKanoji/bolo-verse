import type { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { AFrameEntity, AFrameRuntime } from "../runtime/aframe-types";

interface PanelComponent {
  el: AFrameEntity;
  data: { title: string; body: string; eyebrow: string; selected: boolean };
  canvas: HTMLCanvasElement;
  texture: CanvasTexture;
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  hovered: boolean;
  redraw(): void;
  onEnter: () => void;
  onLeave: () => void;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let count = 0;
  for (let index = 0; index < words.length; index++) {
    const next = `${line}${line ? " " : ""}${words[index]}`;
    if (context.measureText(next).width > width && line) {
      context.fillText(
        count === maxLines - 1 ? `${line.slice(0, -1)}…` : line,
        x,
        y + count * lineHeight,
        width,
      );
      if (++count >= maxLines) return;
      line = words[index];
    } else line = next;
  }
  if (line) context.fillText(line, x, y + count * lineHeight, width);
}

export function registerStudioComponents(aframe: AFrameRuntime, ownerDocument: Document): void {
  if (!aframe.components["studio-panel"])
    aframe.registerComponent("studio-panel", {
      schema: {
        title: { type: "string" },
        body: { type: "string" },
        eyebrow: { type: "string" },
        selected: { default: false },
      },
      init(this: PanelComponent) {
        const THREE = aframe.THREE;
        this.canvas = ownerDocument.createElement("canvas");
        this.canvas.width = 1200;
        this.canvas.height = 700;
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.colorSpace = THREE.SRGBColorSpace;
        this.mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 7 / 6),
          new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, alphaTest: 0.05 }),
        );
        this.el.setObject3D("mesh", this.mesh);
        this.hovered = false;
        this.onEnter = () => {
          this.hovered = true;
          this.redraw();
        };
        this.onLeave = () => {
          this.hovered = false;
          this.redraw();
        };
        this.el.addEventListener("mouseenter", this.onEnter);
        this.el.addEventListener("mouseleave", this.onLeave);
      },
      update(this: PanelComponent) {
        this.redraw();
      },
      redraw(this: PanelComponent) {
        const context = this.canvas.getContext("2d");
        if (!context) return;
        const { selected, title, body, eyebrow } = this.data;
        context.clearRect(0, 0, 1200, 700);
        context.fillStyle = selected ? "#283b60" : "#202a40";
        context.beginPath();
        context.roundRect(4, 4, 1192, 692, 34);
        context.fill();
        context.lineWidth = selected ? 8 : 3;
        context.strokeStyle = selected ? "#9eaaff" : this.hovered ? "#8b95bb" : "#41506c";
        context.stroke();
        context.fillStyle = "#b4bffc";
        context.font = "600 31px system-ui, sans-serif";
        context.fillText(eyebrow, 65, 80, 1070);
        context.fillStyle = "#f5f7ff";
        context.font = "600 60px system-ui, sans-serif";
        wrapText(context, title, 65, 173, 1070, 70, 2);
        context.fillStyle = "#d0d8ec";
        context.font = "400 37px system-ui, sans-serif";
        wrapText(context, body, 65, 340, 1070, 52, 4);
        context.fillStyle = "#aab7d4";
        context.font = "500 28px system-ui, sans-serif";
        context.fillText(
          selected ? "✓ SELECTED · Details in the companion panel" : "SELECT TO INSPECT",
          65,
          633,
          1070,
        );
        this.texture.needsUpdate = true;
      },
      remove(this: PanelComponent) {
        this.el.removeEventListener("mouseenter", this.onEnter);
        this.el.removeEventListener("mouseleave", this.onLeave);
        this.el.removeObject3D("mesh");
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.texture.dispose();
      },
    });

  if (!aframe.components["studio-stats"])
    aframe.registerComponent("studio-stats", {
      init(this: { elapsed: number; frames: number }) {
        this.elapsed = 0;
        this.frames = 0;
      },
      tick(
        this: { el: AFrameEntity; elapsed: number; frames: number },
        _time: number,
        delta: number,
      ) {
        if (!delta || delta > 1000) return;
        this.elapsed += delta;
        this.frames++;
        if (this.elapsed < 1000) return;
        const renderer = this.el.sceneEl.renderer;
        this.el.emit(
          "studio-stats",
          {
            fps: Math.round((this.frames * 1000) / this.elapsed),
            calls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
          },
          false,
        );
        this.elapsed = 0;
        this.frames = 0;
      },
    });
}
