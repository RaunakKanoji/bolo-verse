import * as THREE from "three";

export const CAPTURE_WIDTH = 720;
export const CAPTURE_HEIGHT = 1280;
export const CAPTURE_FPS = 30;

export interface MonoStage {
  setVisible(visible: boolean): void;
  dispose(): void;
}

// Every pixel in the sample is original procedural artwork, not a product photo.
function drawWeave(context: CanvasRenderingContext2D) {
  context.fillStyle = "#94413e";
  context.fillRect(0, 0, 512, 768);
  for (let x = 0; x < 512; x += 4) {
    context.fillStyle = x % 12 === 0 ? "#b76353" : "#a55045";
    context.fillRect(x, 0, 1, 768);
  }
  for (let y = 0; y < 768; y += 5) {
    context.fillStyle = "#d3906629";
    context.fillRect(0, y, 512, 1);
  }
  context.fillStyle = "#e1ae57";
  context.fillRect(22, 0, 36, 768);
  context.fillRect(454, 0, 36, 768);
  context.fillRect(0, 596, 512, 112);
  context.fillStyle = "#632d37";
  context.fillRect(0, 620, 512, 12);
  context.fillRect(0, 676, 512, 12);
  context.fillStyle = "#8b3c3d";
  for (let x = 0; x < 512; x += 28) {
    context.beginPath();
    context.moveTo(x, 650);
    context.lineTo(x + 10, 636);
    context.lineTo(x + 20, 650);
    context.lineTo(x + 10, 664);
    context.closePath();
    context.fill();
  }
  const fold = context.createLinearGradient(0, 0, 512, 0);
  fold.addColorStop(0, "#00000015");
  fold.addColorStop(0.3, "#ffffff18");
  fold.addColorStop(0.47, "#00000025");
  fold.addColorStop(0.64, "#ffffff0d");
  fold.addColorStop(1, "#00000022");
  context.fillStyle = fold;
  context.fillRect(0, 0, 512, 768);
}

function drawTitles(context: CanvasRenderingContext2D) {
  context.textAlign = "center";
  context.fillStyle = "#526151";
  context.font = "500 21px sans-serif";
  context.fillText("A SAMPLE STORY / 001", 360, 109);
  context.fillStyle = "#28352b";
  context.font = "58px Georgia, serif";
  context.fillText("Woven in Ilkal.", 360, 196);
  context.font = "24px sans-serif";
  context.fillText("A tradition, in every thread.", 360, 243);
  context.font = "500 30px sans-serif";
  context.fillText("The Ilkal collection", 360, 1035);
  context.font = "23px sans-serif";
  context.fillStyle = "#596458";
  context.fillText("Silk-cotton blend · Handwoven in Ilkal", 360, 1085);
  context.font = "18px sans-serif";
  context.fillText("FICTIONAL CAMPAIGN · ILLUSTRATED SAMPLE", 360, 1142);
  context.fillStyle = "#e1e4d9";
  context.fillRect(72, 1188, 576, 44);
  context.fillStyle = "#3b493c";
  context.font = "19px sans-serif";
  context.fillText("DRAFT — pending client approval", 360, 1217);
}

export function createMonoStage(canvas: HTMLCanvasElement, onContextLost: () => void): MonoStage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  let frame: number | null = null;
  let disposed = false;
  let contextLost = false;
  let lastRender = -Infinity;

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    canvas.removeEventListener("webglcontextlost", handleContextLost);
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    // React development remounts reuse this canvas/context. Restore pixel-store
    // defaults so the next renderer can initialize its fallback 3D textures.
    renderer.resetState();
    renderer.dispose();
    // React development remounts reuse this canvas. Explicitly losing its
    // browser-owned context would poison the next renderer on that canvas.
  }

  function handleContextLost(event: Event) {
    event.preventDefault();
    contextLost = true;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    onContextLost();
  }

  try {
    renderer.setPixelRatio(1);
    renderer.setSize(CAPTURE_WIDTH, CAPTURE_HEIGHT, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f0f0e6");
    // This fixed portrait camera has no orientation or headset pose input.
    const recordingCamera = new THREE.OrthographicCamera(-3.6, 3.6, 6.4, -6.4, 0.1, 30);
    recordingCamera.position.z = 10;
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const key = new THREE.DirectionalLight(0xffe9d2, 1.5);
    key.position.set(-3, 5, 8);
    scene.add(key);

    function texture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void) {
      const source = document.createElement("canvas");
      source.width = width;
      source.height = height;
      const context = source.getContext("2d");
      if (!context) throw new Error("The browser could not create the sample artwork.");
      draw(context);
      const map = new THREE.CanvasTexture(source);
      map.colorSpace = THREE.SRGBColorSpace;
      textures.push(map);
      return map;
    }

    function plane(width: number, height: number, material: THREE.Material) {
      const geometry = new THREE.PlaneGeometry(width, height);
      geometries.push(geometry);
      materials.push(material);
      return new THREE.Mesh(geometry, material);
    }

    const backdrop = plane(5.3, 6.1, new THREE.MeshBasicMaterial({ color: "#e3e4d8" }));
    backdrop.position.set(0.12, -0.1, -0.5);
    backdrop.rotation.z = -0.045;
    scene.add(backdrop);

    const product = new THREE.Group();
    const card = plane(3.86, 5.83, new THREE.MeshBasicMaterial({ color: "#fff9ec" }));
    const fabric = plane(3.66, 5.49, new THREE.MeshStandardMaterial({
      map: texture(512, 768, drawWeave), roughness: 1, metalness: 0,
    }));
    fabric.position.z = 0.01;
    product.add(card, fabric);
    product.position.y = 0.1;
    product.rotation.z = -0.07;
    scene.add(product);

    const titles = plane(7.2, 12.8, new THREE.MeshBasicMaterial({
      map: texture(720, 1280, drawTitles), transparent: true, depthTest: false,
    }));
    titles.position.z = 2;
    titles.renderOrder = 10;
    scene.add(titles);

    function render(time: number) {
      if (disposed || contextLost) return;
      if (time - lastRender >= 1000 / CAPTURE_FPS) {
        // A gentle card sway never reveals nonexistent sides of the artwork.
        product.rotation.y = Math.sin(time / 2800) * 0.08;
        renderer.render(scene, recordingCamera);
        lastRender = time;
      }
      frame = requestAnimationFrame(render);
    }

    canvas.addEventListener("webglcontextlost", handleContextLost);
    render(performance.now());
    return {
      setVisible(visible) {
        if (disposed || contextLost) return;
        if (!visible && frame !== null) {
          cancelAnimationFrame(frame);
          frame = null;
        } else if (visible && frame === null) {
          render(performance.now());
        }
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
