import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { createDefaultXRLayout, SaveXRWorkspaceSchema, type XRWorkspaceData } from "../../apps/web/src/lib/contracts/xr-workspace";
import { createMediaWorkspaceFixture, createTestGLB, createWorkspaceFixture, TEST_ASSET_IDS, TEST_GLTF, TEST_PNG_BASE64 } from "../browser-fixtures/xr-workspace-data";

let origin = "";
let harness: ChildProcess | undefined;

test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-xr-harness.mjs"], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => { harness?.kill("SIGTERM"); reject(new Error(`XR harness startup timed out. ${output}`)); }, 25_000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /XR_HARNESS_READY (\d+)/.exec(output);
      if (ready) { origin = `http://127.0.0.1:${ready[1]}`; clearTimeout(timeout); resolve(); }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    harness!.once("error", error => { clearTimeout(timeout); reject(error); });
    harness!.once("exit", code => { clearTimeout(timeout); reject(new Error(`XR harness exited (${code}). ${output}`)); });
  });
});
test.afterAll(async () => {
  if (!harness || harness.exitCode !== null) return;
  await new Promise<void>(resolve => { harness!.once("exit", () => resolve()); harness!.kill("SIGTERM"); });
});

/** HTTP fixtures exercise the actual client. SQL auth/CAS is covered by PGlite tests. */
async function backend(page: Page, fixture = createWorkspaceFixture()) {
  let stored = structuredClone(fixture);
  let failure: { status: number; code: string; message: string } | undefined;
  const writes: ReturnType<typeof SaveXRWorkspaceSchema.parse>[] = [];
  let resets = 0;
  const ok = (data: unknown) => ({ ok: true, data, requestId: "component-fixture" });
  await page.route(`${origin}/__fixture/workspace`, route => route.fulfill({ json: structuredClone(stored) }));
  await page.route(`${origin}/api/xr/assistant/**`, route => route.fulfill({ json: ok({ mode: "unconfigured", textAvailable: false, sttAvailable: false, ttsAvailable: false, message: "Assistant is unconfigured in this component test." }) }));
  await page.route(`${origin}/api/xr/workspaces/**`, async route => {
    const request = route.request();
    if (request.method() === "GET") { await route.fulfill({ json: ok(structuredClone(stored)) }); return; }
    if (failure) { await route.fulfill({ status: failure.status, json: { ok: false, error: { code: failure.code, message: failure.message, retryable: failure.status === 503 }, requestId: "component-fixture" } }); return; }
    const body = request.postDataJSON();
    if (body.expectedVersion !== stored.workspace.version) { await route.fulfill({ status: 409, json: { ok: false, error: { code: "CONFLICT", message: "A newer saved layout exists. Reload before saving again.", retryable: false }, requestId: "component-fixture" } }); return; }
    const resetting = new URL(request.url()).pathname.endsWith("/reset");
    const layout = resetting ? createDefaultXRLayout(stored.content) : SaveXRWorkspaceSchema.parse(body).layout;
    if (resetting) resets++; else writes.push(SaveXRWorkspaceSchema.parse(body));
    stored = { ...stored, workspace: { ...stored.workspace, version: stored.workspace.version + 1, layout, updatedAt: new Date().toISOString() } };
    await route.fulfill({ json: ok({ workspace: stored.workspace }) });
  });
  return {
    writes, saved: () => structuredClone(stored), resets: () => resets,
    replace: (next: XRWorkspaceData) => { stored = structuredClone(next); },
    fail: (next: typeof failure) => { failure = next; },
  };
}
async function open(page: Page) {
  await page.goto(origin);
  await expect(page.getByRole("heading", { name: "XR component test harness" })).toBeVisible();
  await expect(page.getByTestId("xr-runtime-status")).toHaveText("Desktop preview", { timeout: 30000 });
  await expect(page.frameLocator('iframe[title="XR studio canvas"]').locator("a-scene canvas")).toBeVisible();
}
async function positionX(page: Page) {
  return page.frameLocator('iframe[title="XR studio canvas"]').locator('[data-studio-id="project-overview"]').evaluate(element => (element as unknown as { object3D: { position: { x: number } } }).object3D.position.x);
}

function assetPanel(page: Page, assetId: string) {
  return page.frameLocator('iframe[title="XR studio canvas"]').locator(`[data-studio-id="asset-${assetId}"]`);
}

async function imagePreviewState(page: Page, assetId: string) {
  return assetPanel(page, assetId).evaluate(element => {
    const mesh = (element as unknown as {
      getObject3D(name: string): { isMesh: boolean; visible: boolean; material: { map?: { isTexture: boolean; image?: HTMLImageElement } } } | undefined;
    }).getObject3D("asset-preview");
    return {
      mesh: mesh?.isMesh === true,
      visible: mesh?.visible === true,
      texture: mesh?.material.map?.isTexture === true,
      width: mesh?.material.map?.image?.naturalWidth ?? 0,
      height: mesh?.material.map?.image?.naturalHeight ?? 0,
    };
  });
}

function watchPreviewResources(page: Page) {
  const externalRequests: string[] = [];
  const cspErrors: string[] = [];
  page.on("request", request => {
    const url = new URL(request.url());
    if (["http:", "https:"].includes(url.protocol) && url.origin !== origin)
      externalRequests.push(request.url());
  });
  page.on("console", message => {
    if (/content security policy|violates.*policy|refused to (?:load|connect|execute)/i.test(message.text()))
      cspErrors.push(message.text());
  });
  return { externalRequests, cspErrors };
}

test("component harness moves actual scene objects, saves versioned layout and restores on reload", async ({ page }) => {
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  await expect.poll(() => positionX(page)).toBe(0.25);
  await page.getByRole("button", { name: "Rotate +15°", exact: true }).click();
  await page.getByRole("button", { name: "Scale up", exact: true }).click();
  await expect(page.getByTestId("xr-save-status")).toContainText("Unsaved layout changes");
  await page.getByRole("button", { name: "Save workspace", exact: true }).click();
  await expect(page.getByTestId("xr-save-status")).toContainText("Workspace saved · version 2");
  expect(store.writes).toHaveLength(1);
  expect(store.writes[0]).toMatchObject({ expectedVersion: 1, layout: { objects: [expect.objectContaining({ id: "project-overview", transform: { position: [0.25, 2.3, -3.7], rotation: [0, 15, 0], scale: [1.32, 1.32, 1.32] } }), expect.anything(), expect.anything()] } });
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  await expect(page.getByTestId("xr-save-status")).toContainText("Unsaved layout changes");
  await expect(page.getByRole("button", { name: "Save workspace", exact: true })).toBeEnabled();
  // Restore the saved transform so the following reload tests persistence rather
  // than the browser's separate unsaved-navigation dialog.
  await page.getByRole("button", { name: "Move x negative", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("xr-runtime-status")).toHaveText("Desktop preview", { timeout: 30000 });
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  await expect.poll(() => positionX(page)).toBe(0.25);
  await expect(page.getByRole("button", { name: "Save workspace", exact: true })).toBeDisabled();
  await expect(page.locator('iframe[title="XR studio canvas"]')).toHaveCount(1);
});

test("component harness preserves dirty transforms after conflict until reload is confirmed", async ({ page }) => {
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  const concurrent = store.saved();
  concurrent.workspace.version = 2;
  concurrent.workspace.layout.objects[0].transform.position[0] = -1;
  store.replace(concurrent);
  await page.getByRole("button", { name: "Save workspace", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your local changes are retained");
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  await expect.poll(() => positionX(page)).toBe(0.25);
  expect(store.writes).toHaveLength(0);
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Reload saved layout", exact: true }).click();
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reload saved layout", exact: true }).click();
  await expect(page.getByTestId("xr-save-status")).toContainText("Saved workspace loaded");
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("-1.00");
  await expect.poll(() => positionX(page)).toBe(-1);
  await expect(page.getByRole("button", { name: "Save workspace", exact: true })).toBeDisabled();
});

test("component harness makes project clients read-only and disables mutation controls", async ({ page }) => {
  const store = await backend(page, createWorkspaceFixture(false));
  await open(page);
  await expect(page.getByText("Read-only project workspace", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Move x positive", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Rotate +15°", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reset layout", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save workspace", exact: true })).toBeDisabled();
  expect(store.writes).toHaveLength(0);
  expect(store.resets()).toBe(0);
});

test("component harness requires reset confirmation and then reloads the saved default", async ({ page }) => {
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  expect(store.resets()).toBe(0);
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(page.getByTestId("xr-save-status")).toContainText("Default layout saved");
  expect(store.resets()).toBe(1);
  expect(store.saved().workspace.version).toBe(2);
  await expect.poll(() => positionX(page)).toBe(0);
});

for (const failure of [
  { status: 401, code: "UNAUTHORIZED", message: "Sign in again to save your workspace." },
  { status: 503, code: "SERVICE_UNAVAILABLE", message: "The workspace service is temporarily unavailable." },
]) test(`component harness retains unsaved work on HTTP ${failure.status}`, async ({ page }) => {
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  store.fail(failure);
  await page.getByRole("button", { name: "Save workspace", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(failure.message);
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  await expect(page.getByTestId("xr-save-status")).toContainText("Unsaved layout changes");
  expect(store.saved().workspace.version).toBe(1);
  expect(store.writes).toHaveLength(0);
});

test("component harness keeps another asset usable when an older preview fails late", async ({ page }) => {
  const resources = watchPreviewResources(page);
  await backend(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`${origin}/api/xr/assets/${TEST_ASSET_IDS[0]}`, async route => {
    await gate;
    await route.fulfill({ status: 503, json: { ok: false, error: { code: "SERVICE_UNAVAILABLE", message: "Late first preview failure", retryable: true }, requestId: "component-fixture" } }).catch(() => undefined);
  });
  await page.route(`${origin}/api/xr/assets/${TEST_ASSET_IDS[1]}`, route => route.fulfill({ body: Buffer.from(TEST_PNG_BASE64, "base64"), contentType: "image/png" }));
  await open(page);
  await page.getByRole("button", { name: "Inspect image · c4000001", exact: true }).click();
  await page.getByRole("button", { name: "Preview in studio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Loading asset…", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Inspect image · c4000002", exact: true }).click();
  await expect(page.getByRole("button", { name: "Preview in studio", exact: true })).toBeEnabled();
  release();
  await page.getByRole("button", { name: "Preview in studio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Preview in studio", exact: true })).toBeEnabled();
  await expect.poll(() => imagePreviewState(page, TEST_ASSET_IDS[1])).toEqual({ mesh: true, visible: true, texture: true, width: 1, height: 1 });
  expect(await imagePreviewState(page, TEST_ASSET_IDS[0])).toEqual({ mesh: false, visible: false, texture: false, width: 0, height: 0 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(resources.externalRequests).toEqual([]);
  expect(resources.cspErrors).toEqual([]);
});

test("component harness attaches a decoded protected image texture to the selected spatial card", async ({ page }) => {
  const resources = watchPreviewResources(page);
  await backend(page);
  await page.route(`${origin}/api/xr/assets/${TEST_ASSET_IDS[0]}`, route => route.fulfill({ body: Buffer.from(TEST_PNG_BASE64, "base64"), contentType: "image/png" }));
  await open(page);
  await page.getByRole("button", { name: "Inspect image · c4000001", exact: true }).click();
  await page.getByRole("button", { name: "Preview in studio", exact: true }).click();
  await expect.poll(() => imagePreviewState(page, TEST_ASSET_IDS[0])).toEqual({ mesh: true, visible: true, texture: true, width: 1, height: 1 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(resources.externalRequests).toEqual([]);
  expect(resources.cspErrors).toEqual([]);
});

for (const modelFixture of [
  { format: "glTF", mimeType: "model/gltf+json", body: TEST_GLTF },
  { format: "GLB", mimeType: "model/gltf-binary", body: Buffer.from(createTestGLB()) },
]) test(`component harness parses a self-contained static ${modelFixture.format} into actual scene geometry`, async ({ page }) => {
  const resources = watchPreviewResources(page);
  await backend(page, createMediaWorkspaceFixture({ mimeType: modelFixture.mimeType, byteSize: Buffer.byteLength(modelFixture.body), width: null, height: null, durationSeconds: null }));
  await page.route(`${origin}/api/xr/assets/${TEST_ASSET_IDS[0]}`, route => route.fulfill({ body: modelFixture.body, contentType: modelFixture.mimeType }));
  await open(page);
  await page.getByRole("button", { name: "Inspect model · c4000001", exact: true }).click();
  await page.getByRole("button", { name: "Preview in studio", exact: true }).click();
  const model = assetPanel(page, TEST_ASSET_IDS[0]).locator("a-entity[gltf-model]");
  await expect(model).toHaveCount(1);
  await expect.poll(() => model.evaluate(element => {
    interface ModelObject {
      isMesh?: boolean;
      visible: boolean;
      geometry?: { getAttribute(name: string): { count: number } | undefined };
      traverse(visitor: (child: ModelObject) => void): void;
    }
    const root = (element as unknown as { getObject3D(name: string): ModelObject | undefined }).getObject3D("mesh");
    const meshes: { vertices: number; visible: boolean }[] = [];
    root?.traverse(child => { if (child.isMesh) meshes.push({ vertices: child.geometry?.getAttribute("position")?.count ?? 0, visible: child.visible }); });
    return meshes;
  })).toEqual([{ vertices: 3, visible: true }]);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(resources.externalRequests).toEqual([]);
  expect(resources.cspErrors).toEqual([]);
});

test("component harness plays a generated silent video through its spatial video texture", async ({ page }) => {
  // Create portable real media in Chromium without cameras, microphones or an encoder dependency.
  const clip = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const mimeType = "video/webm;codecs=vp8";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: BlobPart[] = [];
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("The synthetic video fixture could not be encoded."));
    });
    let frame = 0;
    const draw = () => { context.fillStyle = frame++ % 2 ? "#3478f6" : "#4b9a6a"; context.fillRect(0, 0, 32, 32); };
    const timer = setInterval(draw, 80);
    try {
      recorder.start();
      draw();
      await new Promise(resolve => setTimeout(resolve, 1_200));
      recorder.stop();
      await stopped;
      const bytes = new Uint8Array(await new Blob(chunks, { type: "video/webm" }).arrayBuffer());
      return { base64: btoa(String.fromCharCode(...bytes)), byteSize: bytes.length };
    } finally {
      clearInterval(timer);
      for (const track of stream.getTracks()) track.stop();
    }
  });
  const resources = watchPreviewResources(page);
  await backend(page, createMediaWorkspaceFixture({ mimeType: "video/webm", byteSize: clip.byteSize, width: 32, height: 32, durationSeconds: 1.2 }));
  await page.route(`${origin}/api/xr/assets/${TEST_ASSET_IDS[0]}`, route => route.fulfill({ body: Buffer.from(clip.base64, "base64"), contentType: "video/webm" }));
  await open(page);
  await page.getByRole("button", { name: "Inspect video · c4000001", exact: true }).click();
  await page.getByRole("button", { name: "Preview in studio", exact: true }).click();
  await expect.poll(() => assetPanel(page, TEST_ASSET_IDS[0]).evaluate(element => {
    const mesh = (element as unknown as { getObject3D(name: string): { material: { map?: { isVideoTexture: boolean; image: HTMLVideoElement } } } | undefined }).getObject3D("asset-preview");
    const texture = mesh?.material.map;
    return { videoTexture: texture?.isVideoTexture === true, width: texture?.image.videoWidth ?? 0, height: texture?.image.videoHeight ?? 0, played: (texture?.image.currentTime ?? 0) > 0 };
  })).toEqual({ videoTexture: true, width: 32, height: 32, played: true });
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(resources.externalRequests).toEqual([]);
  expect(resources.cspErrors).toEqual([]);
});

test("component harness handles a simulated headset rejection without losing dirty layout", async ({ page }) => {
  await page.addInitScript(() => {
    const xr = Object.assign(new EventTarget(), {
      isSessionSupported: async (mode: string) => mode === "immersive-vr",
      requestSession: async () => { throw new DOMException("Simulated permission rejection", "NotAllowedError"); },
    });
    Object.defineProperty(navigator, "xr", { configurable: true, value: xr });
  });
  await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Move x positive", exact: true }).click();
  await expect(page.getByRole("button", { name: "Enter VR", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Enter VR", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not start");
  await expect(page.getByTestId("xr-runtime-status")).toHaveText("Desktop preview");
  await expect(page.getByLabel("Position x", { exact: true })).toHaveText("0.25");
  await expect(page.getByRole("button", { name: "Save workspace", exact: true })).toBeEnabled();
});
