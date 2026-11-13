import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  SaveSpatialSceneSchema,
  SpatialSceneSnapshotSchema,
  type SaveSpatialScene,
  type SpatialSceneSnapshot,
} from "@shape/scene-schema";
import {
  createSpatialFixture,
  createSpatialGLB,
  SPATIAL_ASSET_IDS,
  SPATIAL_PNG_BASE64,
  SPATIAL_PROJECT_ID,
  type SpatialWorkspaceFixture,
} from "../browser-fixtures/spatial-workspace-data";

let origin = "";
let harness: ChildProcess | undefined;

test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-spatial-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Spatial harness startup timed out. ${output}`));
    }, 25_000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /SPATIAL_HARNESS_READY (\d+)/.exec(output);
      if (ready) {
        origin = `http://127.0.0.1:${ready[1]}`;
        clearTimeout(timeout);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    harness!.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    harness!.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Spatial harness exited (${code}). ${output}`));
    });
  });
});
test.afterAll(async () => {
  if (!harness || harness.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    harness!.once("exit", () => resolve());
    harness!.kill("SIGTERM");
  });
});

const scenePath = `/api/v1/projects/${SPATIAL_PROJECT_ID}/spatial-scene`;
const ok = (snapshot: SpatialSceneSnapshot) => ({
  ok: true,
  data: { scene: SpatialSceneSnapshotSchema.parse(snapshot) },
  requestId: "spatial-component-fixture",
});

/** Real component/HTTP contracts only; these fixtures never verify live identity or SQL authorization. */
async function backend(page: Page, fixture: SpatialWorkspaceFixture = createSpatialFixture()) {
  let stored = structuredClone(fixture.snapshot);
  const writes: SaveSpatialScene[] = [];
  const assets: string[] = [];
  await page.route(`${origin}/__fixture/workspace`, (route) =>
    route.fulfill({ json: { ...fixture, snapshot: stored } }),
  );
  await page.route(`${origin}/api/v1/projects/${SPATIAL_PROJECT_ID}`, (route) =>
    route.fulfill({
      json: {
        ok: true,
        data: { project: fixture.project },
        requestId: "spatial-component-fixture",
      },
    }),
  );
  await page.route(`${origin}/api/v1/projects/${SPATIAL_PROJECT_ID}/assets`, (route) =>
    route.fulfill({
      json: {
        ok: true,
        data: { assets: fixture.assets, hasMore: fixture.hasMoreAssets },
        requestId: "spatial-component-fixture",
      },
    }),
  );
  await page.route(`${origin}/api/v1/assets/**/content`, async (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2)!;
    assets.push(id);
    if (id === SPATIAL_ASSET_IDS.model)
      await route.fulfill({
        body: Buffer.from(createSpatialGLB()),
        contentType: "model/gltf-binary",
      });
    else if (id === SPATIAL_ASSET_IDS.image)
      await route.fulfill({
        body: Buffer.from(SPATIAL_PNG_BASE64, "base64"),
        contentType: "image/png",
      });
    else
      await route.fulfill({
        status: 404,
        json: { error: "No supported asset fixture registered." },
      });
  });
  await page.route(`${origin}${scenePath}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: ok(stored) });
      return;
    }
    expect(route.request().method()).toBe("PUT");
    const body = SaveSpatialSceneSchema.parse(route.request().postDataJSON());
    if (body.expectedRevision !== stored.revision) {
      await route.fulfill({
        status: 409,
        json: {
          ok: false,
          error: { code: "CONFLICT", message: "A newer scene exists.", retryable: false },
          requestId: "spatial-component-fixture",
        },
      });
      return;
    }
    writes.push(body);
    stored = SpatialSceneSnapshotSchema.parse({
      ...stored,
      document: body.document,
      revision: stored.revision + 1,
      updatedAt: "2026-11-12T01:00:00.000Z",
    });
    await route.fulfill({ json: ok(stored) });
  });
  return {
    writes,
    assets,
    saved: () => structuredClone(stored),
    replace: (snapshot: SpatialSceneSnapshot) => {
      stored = SpatialSceneSnapshotSchema.parse(snapshot);
    },
  };
}

async function open(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(origin);
  await expect(page.getByRole("heading", { name: "Spatial fixture project" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__spatialFixture.inspect().filter((root) => root.canvasConnected).length,
      ),
    )
    .toBe(1);
}
async function commit(page: Page, label: string, value: string) {
  const input = page.getByRole("spinbutton", { name: label, exact: true });
  await input.fill(value);
  await input.press("Enter");
  await expect(input).toHaveValue(value);
}
function objectButton(page: Page, number: number) {
  return page.getByRole("button", { name: new RegExp(`^Object ${number} `) });
}

test("separate procedural demo has no project assets or persistence and supports numeric editing", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url());
  });
  await page.goto("/workspace/demo");
  await expect(page.getByRole("heading", { name: "Local procedural demo" })).toBeVisible();
  await expect(page.getByText(/Nothing here is saved/)).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await commit(page, "Position X", "1.25");
  await commit(page, "Rotation Y", "45");
  await commit(page, "Scale Z", "1.5");
  await expect(page.getByRole("button", { name: "Save scene", exact: true })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("procedural-demo-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("procedural-demo-mobile.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("0");
  expect(requests).toEqual([]);
});

test("empty project offers separate demo and catalog refresh without inventing scene assets", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  const ready = structuredClone(fixture.assets);
  fixture.assets = [];
  const store = await backend(page, fixture);
  await open(page);
  await expect(page.getByText(/no ready assets yet/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Try the local procedural demo" })).toHaveAttribute(
    "href",
    "/workspace/demo",
  );
  await expect(page.getByRole("link", { name: "Open Creative Studio" })).toHaveAttribute(
    "href",
    `/studio/create?projectId=${SPATIAL_PROJECT_ID}`,
  );
  fixture.assets = ready;
  await page.getByRole("button", { name: "Refresh assets", exact: true }).click();
  await expect(page.getByRole("button", { name: "Place asset 1", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await commit(page, "Position X", "2");
  fixture.assets = [{ ...ready[0], projectId: ready[0].id }];
  await page.getByRole("button", { name: "Refresh assets", exact: true }).click();
  await expect(page.getByText(/Assets could not be refreshed/)).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("2");
  expect(store.writes).toHaveLength(0);
});

test("network save failure retains edits and retry; delayed save retains newer edits", async ({
  page,
}) => {
  const store = await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  let attempt = 0;
  await page.route(`${origin}${scenePath}`, async (route) => {
    if (route.request().method() !== "PUT") return route.fallback();
    if (++attempt === 1) return route.abort("failed");
    held = true;
    await gate;
    return route.fallback();
  });
  await open(page);
  try {
    await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
    await commit(page, "Position X", "1");
    await page.getByRole("button", { name: "Save scene", exact: true }).click();
    await expect(page.getByTestId("scene-status")).toContainText("Save failed");
    await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue(
      "1",
    );
    await page.getByRole("button", { name: "Save scene", exact: true }).click();
    await expect.poll(() => held).toBe(true);
    await commit(page, "Position X", "2");
    release();
    await expect(page.getByTestId("scene-status")).toHaveText("Unsaved changes");
    expect(store.saved().document.objects[0].position[0]).toBe(1);
    await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue(
      "2",
    );
    await page.getByRole("button", { name: "Save scene", exact: true }).click();
    await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
    expect(store.saved().document.objects[0].position[0]).toBe(2);
  } finally {
    release();
  }
});

test("invalid numeric bounds retain the last valid transform and expose an actionable error", async ({
  page,
}) => {
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  for (const [label, value] of [
    ["Position X", "31"],
    ["Scale Y", "0"],
    ["Scale Z", "11"],
  ]) {
    const input = page.getByRole("spinbutton", { name: label, exact: true });
    await input.fill(value);
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-invalid", "true");
  }
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(
    page.getByText("Correct the highlighted transform values before saving.", { exact: true }),
  ).toBeVisible();
  expect(store.writes).toHaveLength(0);
  await commit(page, "Position X", "1");
  await commit(page, "Scale Y", "2");
  // The scale group remount restores other invalid drafts to their actual valid values.
  await commit(page, "Scale Z", "1.5");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(store.saved().document.objects[0]).toMatchObject({
    position: [1, 0, 0],
    scale: [1, 2, 1.5],
  });
});

test("missing WebGL leaves a usable numeric editor and canonical save", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.includes("webgl")) return null;
      return Reflect.apply(getContext, this, [kind, ...args]);
    } as typeof getContext;
  });
  const store = await backend(page);
  await page.goto(origin);
  await expect(page.getByText(/3D preview is unavailable|3D preview requires WebGL/)).toBeVisible();
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await commit(page, "Position X", "1.25");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(store.saved().document.objects[0].position[0]).toBe(1.25);
});

test("image preview releases its owned GPU resources on unmount and remounts cleanly", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  fixture.snapshot.document.objects = [
    {
      id: "image-resource",
      assetId: SPATIAL_ASSET_IDS.image,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      visible: true,
    },
  ];
  await backend(page, fixture);
  await open(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__spatialFixture
          .inspect()
          .flatMap((root) => root.objects)
          .some((object) => object.textureWidth === 1),
      ),
    )
    .toBe(true);
  const before = await page.evaluate(() => ({ ...window.__spatialFixture.disposedResources }));
  await page.getByRole("button", { name: "Close fixture editor", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__spatialFixture.inspect().length)).toBe(0);
  for (const kind of ["geometries", "materials", "textures"] as const) {
    await expect
      .poll(() => page.evaluate((name) => window.__spatialFixture.disposedResources[name], kind))
      .toBeGreaterThan(before[kind]);
  }
  await page.getByRole("button", { name: "Reopen fixture editor", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.__spatialFixture.inspect().filter((root) => root.canvasConnected).length,
      ),
    )
    .toBe(1);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__spatialFixture
          .inspect()
          .flatMap((root) => root.objects)
          .some((object) => object.textureWidth === 1),
      ),
    )
    .toBe(true);
});

test("failed and stale reloads preserve local edits and never replace a newer revision", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  fixture.snapshot.document.objects = [
    {
      id: "reload-object",
      assetId: SPATIAL_ASSET_IDS.model,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      visible: true,
    },
  ];
  const store = await backend(page, fixture);
  await open(page);
  await objectButton(page, 1).click();
  await commit(page, "Position X", "3");
  let failed = true;
  await page.route(`${origin}${scenePath}`, (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    return failed
      ? route.abort("failed")
      : route.fulfill({ json: ok({ ...fixture.snapshot, revision: 0 }) });
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole("button", { name: "Reload scene", exact: true }).click();
    await page.getByRole("button", { name: "Discard changes and reload", exact: true }).click();
    await expect(
      page.getByText("The latest scene could not be loaded. Your local changes are retained.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue(
      "3",
    );
    await expect(page.getByText("Revision 1", { exact: true })).toBeVisible();
    failed = false;
  }
  expect(store.writes).toHaveLength(0);
});

test("dirty navigation cancellation keeps the project and its unsaved transform", async ({
  page,
}) => {
  await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await commit(page, "Position X", "2");
  let confirmations = 0;
  page.on("dialog", (dialog) => {
    confirmations++;
    return dialog.dismiss();
  });
  await page.getByRole("link", { name: "Open Creative Studio" }).click();
  await expect(page).toHaveURL(origin + "/");
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("2");
  expect(confirmations).toBe(1);
});
async function renderedObject(page: Page, id: string) {
  return page.evaluate(
    (objectId) =>
      window.__spatialFixture
        .inspect()
        .flatMap((root) => root.objects)
        .find((object) => object.name === objectId),
    id,
  );
}

test("same-origin gateway keeps the dashboard on web and denies private or malformed spatial projects", async ({
  page,
  request,
}) => {
  const landing = await page.goto("/workspace");
  expect(landing?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: /^Good morning/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your creative workspace starts here.", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator('script[src*="/spatial-static/"]')).toHaveCount(0);
  await page.goto("/spatial-studio");
  await expect(page.getByRole("heading", { name: "Spatial Studio", exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Try the desktop 3D demo", exact: true }),
  ).toHaveAttribute("href", "/workspace/demo");
  await page.getByRole("link", { name: "Choose a project", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { name: "Your Projects", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No projects yet", exact: true })).toBeVisible();
  await page.goto(`/workspace/${SPATIAL_PROJECT_ID}`);
  const appScripts = await page.locator('script[src*="/spatial-static/"]').count();
  expect(appScripts).toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: /workspace.*unavailable|access|connect|sign in/i }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByTestId("spatial-editor")).toHaveCount(0);
  await page.goto("/workspace/not-a-project-id");
  await expect(
    page.getByRole("heading", { name: /workspace.*unavailable|access|invalid|not found/i }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  const denied = await request.get(scenePath);
  expect([401, 503]).toContain(denied.status());
  expect(denied.headers()["cache-control"]).toContain("no-store");
  expect((await denied.json()).ok).toBe(false);
});

test("fixture editor places real GLB and image assets, selects and transforms them, and restores a canonical CAS save", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const store = await backend(page);
  await open(page);
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await expect(objectButton(page, 1)).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__spatialFixture
            .inspect()
            .flatMap((root) => root.objects)
            .filter((object) => object.vertices === 3).length,
      ),
    )
    .toBe(1);
  await commit(page, "Position X", "1.25");
  await commit(page, "Rotation Y", "45");
  await commit(page, "Scale Z", "1.5");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Scale Z", exact: true })).toHaveValue("1");
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Scale Z", exact: true })).toHaveValue("1.5");
  await page.getByRole("button", { name: "Place asset 2", exact: true }).click();
  await expect(objectButton(page, 2)).toHaveAttribute("aria-pressed", "true");
  await commit(page, "Position X", "-1");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__spatialFixture
          .inspect()
          .flatMap((root) => root.objects)
          .some((object) => object.textureWidth === 1 && object.textureHeight === 1),
      ),
    )
    .toBe(true);
  await objectButton(page, 1).click();
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue(
    "1.25",
  );
  await expect(page.getByTestId("scene-status")).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(store.writes).toHaveLength(1);
  expect(store.writes[0].expectedRevision).toBe(1);
  const saved = store.saved();
  expect(saved.revision).toBe(2);
  const model = saved.document.objects[0];
  expect(model).toMatchObject({
    assetId: SPATIAL_ASSET_IDS.model,
    position: [1.25, 0, 0],
    scale: [1, 1, 1.5],
    visible: true,
  });
  expect(model.rotation[0]).toBeCloseTo(0, 8);
  expect(model.rotation[1]).toBeCloseTo(Math.sin(Math.PI / 8), 8);
  expect(model.rotation[2]).toBeCloseTo(0, 8);
  expect(model.rotation[3]).toBeCloseTo(Math.cos(Math.PI / 8), 8);
  await expect
    .poll(async () => (await renderedObject(page, model.id))?.position)
    .toEqual([1.25, 0, 0]);
  await expect.poll(async () => (await renderedObject(page, model.id))?.scale).toEqual([1, 1, 1.5]);
  expect(store.assets).toContain(SPATIAL_ASSET_IDS.model);
  expect(store.assets).toContain(SPATIAL_ASSET_IDS.image);
  const canvasImage = await page
    .locator("canvas")
    .screenshot({ path: testInfo.outputPath("spatial-canvas.png") });
  const pixels = await page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let bluePixels = 0;
    for (let index = 0; index < rgba.length; index += 4)
      if (rgba[index + 2] > rgba[index] * 1.3 && rgba[index + 2] > rgba[index + 1] * 1.2)
        bluePixels++;
    return bluePixels;
  }, canvasImage.toString("base64"));
  expect(pixels).toBeGreaterThan(50);
  await page.screenshot({ path: testInfo.outputPath("spatial-editor-assets.png"), fullPage: true });
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await objectButton(page, 1).click();
  await expect(page.getByRole("spinbutton", { name: "Rotation Y", exact: true })).toHaveValue("45");
  await expect(page.getByRole("spinbutton", { name: "Scale Z", exact: true })).toHaveValue("1.5");
  await expect
    .poll(async () => (await renderedObject(page, model.id))?.position)
    .toEqual([1.25, 0, 0]);
  await expect(page.getByRole("button", { name: "Save scene", exact: true })).toBeDisabled();
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(store.writes).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("fixture editor keeps dirty transforms after 409 until explicit discard and reload", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  fixture.snapshot.document.objects = [
    {
      id: "existing-model",
      assetId: SPATIAL_ASSET_IDS.model,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      visible: true,
    },
  ];
  const store = await backend(page, fixture);
  await open(page);
  await objectButton(page, 1).click();
  await commit(page, "Position X", "2");
  const concurrent = store.saved();
  concurrent.revision = 2;
  concurrent.document.objects[0].position = [-1, 0, 0];
  store.replace(concurrent);
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toContainText("Your changes are retained");
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("2");
  await expect
    .poll(async () => (await renderedObject(page, "existing-model"))?.position)
    .toEqual([2, 0, 0]);
  await expect(page.getByRole("button", { name: "Save scene", exact: true })).toBeDisabled();
  expect(store.writes).toHaveLength(0);
  await page.getByRole("button", { name: "Reload scene", exact: true }).click();
  await expect(page.getByRole("alertdialog", { name: "Discard local changes" })).toBeVisible();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "Reload scene", exact: true }).click();
  await page.getByRole("button", { name: "Discard changes and reload", exact: true }).click();
  await expect(page.getByText("Latest saved scene loaded.", { exact: true })).toBeVisible();
  await objectButton(page, 1).click();
  await expect(page.getByRole("spinbutton", { name: "Position X", exact: true })).toHaveValue("-1");
  await expect
    .poll(async () => (await renderedObject(page, "existing-model"))?.position)
    .toEqual([-1, 0, 0]);
  await commit(page, "Position Y", "1");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(store.writes[0].expectedRevision).toBe(2);
});

test("fixture canvas pointer selection and drag modes edit actual model transforms", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  fixture.snapshot.document.objects = [
    {
      id: "pointer-model",
      assetId: SPATIAL_ASSET_IDS.model,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      visible: true,
    },
  ];
  await backend(page, fixture);
  await open(page);
  await expect
    .poll(() => page.evaluate(() => window.__spatialFixture.projectTriangle("pointer-model")))
    .not.toBeNull();
  const target = await page.evaluate(() =>
    window.__spatialFixture.projectTriangle("pointer-model"),
  );
  expect(target).not.toBeNull();
  await page.mouse.click(target!.x, target!.y);
  await expect(objectButton(page, 1)).toHaveAttribute("aria-pressed", "true");
  async function drag(dx: number, dy: number) {
    const point = await page.evaluate(() =>
      window.__spatialFixture.projectTriangle("pointer-model"),
    );
    expect(point).not.toBeNull();
    await page.mouse.move(point!.x, point!.y);
    await page.mouse.down();
    await page.mouse.move(point!.x + dx, point!.y + dy, { steps: 8 });
    await page.mouse.up();
  }
  await drag(45, 0);
  await expect
    .poll(async () => {
      const position = (await renderedObject(page, "pointer-model"))?.position ?? [0, 0, 0];
      return Math.abs(position[0]) + Math.abs(position[2]);
    })
    .toBeGreaterThan(0.05);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(async () => (await renderedObject(page, "pointer-model"))?.position)
    .toEqual([0, 0, 0]);
  await page.getByRole("radio", { name: "Rotate", exact: true }).check();
  await drag(35, 0);
  await expect
    .poll(async () => Math.abs((await renderedObject(page, "pointer-model"))?.rotation[1] ?? 0))
    .toBeGreaterThan(0.1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(async () => (await renderedObject(page, "pointer-model"))?.rotation)
    .toEqual([0, 0, 0, 1]);
  await page.getByRole("radio", { name: "Scale", exact: true }).check();
  await drag(30, -10);
  await expect
    .poll(async () => (await renderedObject(page, "pointer-model"))?.scale[0] ?? 1)
    .toBeGreaterThan(1.2);
  await expect(page.getByTestId("scene-status")).toHaveText("Unsaved changes");
});

test("fixture read-only scene disables placement, transform and save controls", async ({
  page,
}) => {
  const fixture = createSpatialFixture(false);
  fixture.snapshot.document.objects = [
    {
      id: "readonly-model",
      assetId: SPATIAL_ASSET_IDS.model,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1],
      visible: true,
    },
  ];
  const store = await backend(page, fixture);
  await open(page);
  await objectButton(page, 1).click();
  await expect(page.getByTestId("scene-status")).toHaveText("Read-only scene");
  for (const name of [
    "Place asset 1",
    "Place asset 2",
    "Undo",
    "Redo",
    "Save scene",
    "Remove object",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
  for (const name of ["Position X", "Rotation Y", "Scale Z"])
    await expect(page.getByRole("spinbutton", { name, exact: true })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Visible", exact: true })).toBeDisabled();
  expect(store.writes).toHaveLength(0);
});

test("fixture save preserves unsupported canonical objects without requesting their private media", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  const unsupported = {
    id: "native-only-object",
    assetId: SPATIAL_ASSET_IDS.unsupported,
    position: [1, 2, -3] as [number, number, number],
    rotation: [0, 0, 0, 1] as [number, number, number, number],
    scale: [1.25, 1.25, 1.25] as [number, number, number],
    visible: false,
  };
  fixture.snapshot.document.objects = [structuredClone(unsupported)];
  const store = await backend(page, fixture);
  await open(page);
  await expect(page.getByText("Preview unavailable · preserved", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Place asset 3", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await commit(page, "Position Z", "-2");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(store.writes[0].document.objects[0]).toEqual(unsupported);
  expect(store.saved().document.objects).toHaveLength(2);
  expect(store.assets).not.toContain(SPATIAL_ASSET_IDS.unsupported);
});

test("fixture unmount releases its renderer and ignores a late save before reopening", async ({
  page,
}) => {
  await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let pending: SaveSpatialScene | undefined;
  await page.route(`${origin}${scenePath}`, async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }
    pending = SaveSpatialSceneSchema.parse(route.request().postDataJSON());
    await gate;
    const fixture = createSpatialFixture();
    await route
      .fulfill({ json: ok({ ...fixture.snapshot, revision: 2, document: pending.document }) })
      .catch(() => undefined);
  });
  await open(page);
  try {
    await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
    await commit(page, "Position X", "3");
    await page.getByRole("button", { name: "Save scene", exact: true }).click();
    await expect.poll(() => pending?.document.objects[0].position[0]).toBe(3);
    await page.getByRole("button", { name: "Close fixture editor", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.__spatialFixture.inspect().length)).toBe(0);
    await page.getByRole("button", { name: "Reopen fixture editor", exact: true }).click();
    await expect(page.locator("canvas")).toBeVisible();
    release();
    await expect(page.getByTestId("scene-status")).toHaveText("Scene is up to date");
    await expect(objectButton(page, 1)).toHaveCount(0);
    await expect(page.getByText("Revision 1", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.__spatialFixture.inspect().filter((root) => root.canvasConnected).length,
        ),
      )
      .toBe(1);
  } finally {
    release();
  }
});

test("fixture session writes mint a fresh bearer when the ambient cookie is expired", async ({
  page,
}) => {
  const fixture = createSpatialFixture();
  fixture.sessionFixture = true;
  const store = await backend(page, fixture);
  await page
    .context()
    .addCookies([{ name: "__session", value: "expired-fixture-cookie", url: origin }]);
  const tokenCalls: { sessionId: string; skipCache: boolean }[] = [];
  const writes: { authorization?: string; cookie?: string }[] = [];
  await page.route(`${origin}/__fixture/token`, (route) => {
    const call = route.request().postDataJSON() as { sessionId: string; skipCache: boolean };
    tokenCalls.push(call);
    return route.fulfill({
      json: { token: call.skipCache ? "fixture-fresh-write-token" : "fixture-read-token" },
    });
  });
  await page.route(`${origin}/api/v1/**`, async (route) => {
    const request = route.request();
    const headers = request.headers();
    const writing = request.method() === "PUT";
    if (writing) writes.push({ authorization: headers.authorization, cookie: headers.cookie });
    const expected = writing ? "Bearer fixture-fresh-write-token" : "Bearer fixture-read-token";
    if (headers.authorization !== expected) {
      await route.fulfill({
        status: 401,
        json: {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "The fixture cookie is expired.",
            retryable: false,
          },
          requestId: "spatial-session-fixture",
        },
      });
      return;
    }
    await route.fallback();
  });
  await open(page);
  await page.getByRole("button", { name: "Place asset 1", exact: true }).click();
  await commit(page, "Position X", "1");
  await page.getByRole("button", { name: "Save scene", exact: true }).click();
  await expect(page.getByTestId("scene-status")).toHaveText("All changes saved");
  expect(tokenCalls.some((call) => !call.skipCache)).toBe(true);
  expect(tokenCalls.filter((call) => call.skipCache)).toEqual([
    { sessionId: "fixture-session-a", skipCache: true },
  ]);
  expect(writes).toEqual([
    {
      authorization: "Bearer fixture-fresh-write-token",
      cookie: "__session=expired-fixture-cookie",
    },
  ]);
  expect(store.writes).toHaveLength(1);
  expect(store.saved().revision).toBe(2);
});

for (const action of ["signout", "switch"] as const)
  test(`fixture session ${action} clears private editor state and aborts a deferred old token`, async ({
    page,
  }) => {
    const fixture = createSpatialFixture();
    fixture.sessionFixture = true;
    fixture.snapshot.document.objects = [
      {
        id: "private-from-session-a",
        assetId: SPATIAL_ASSET_IDS.model,
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        scale: [1, 1, 1],
        visible: true,
      },
    ];
    const store = await backend(page, fixture);
    let releaseOldToken!: () => void;
    let releaseNewSession!: () => void;
    const oldTokenGate = new Promise<void>((resolve) => {
      releaseOldToken = resolve;
    });
    const newSessionGate = new Promise<void>((resolve) => {
      releaseNewSession = resolve;
    });
    let deferredOldToken = false;
    let attemptedWrites = 0;
    await page.route(`${origin}/__fixture/token`, async (route) => {
      const call = route.request().postDataJSON() as { sessionId: string; skipCache: boolean };
      if (call.sessionId === "fixture-session-a" && call.skipCache) {
        deferredOldToken = true;
        await oldTokenGate;
      }
      if (call.sessionId === "fixture-session-b") await newSessionGate;
      await route.fulfill({ json: { token: `${call.sessionId}-token` } }).catch(() => undefined);
    });
    await page.route(`${origin}/api/v1/**`, async (route) => {
      const request = route.request();
      if (request.method() === "PUT") attemptedWrites++;
      expect(request.headers().authorization).toMatch(/^Bearer fixture-session-[ab]-token$/);
      await route.fallback();
    });
    await open(page);
    try {
      await objectButton(page, 1).click();
      await commit(page, "Position X", "2");
      await page.getByRole("button", { name: "Save scene", exact: true }).click();
      await expect.poll(() => deferredOldToken).toBe(true);
      const next = createSpatialFixture().snapshot;
      next.revision = 7;
      store.replace(next);
      await page
        .getByRole("button", {
          name: action === "signout" ? "Sign out fixture session" : "Use fixture session B",
          exact: true,
        })
        .click();
      await expect(page.getByTestId("spatial-editor")).toHaveCount(0);
      await expect(page.getByText("private-from-session-a", { exact: true })).toHaveCount(0);
      await expect(page.locator("canvas")).toHaveCount(0);
      await expect
        .poll(() => page.evaluate(() => window.__spatialFixture.inspect().length))
        .toBe(0);
      if (action === "signout")
        await expect(
          page.getByText("Sign in through Shape Studio to open this private project.", {
            exact: true,
          }),
        ).toBeVisible();
      else
        await expect(
          page.getByText("Opening your authorized project scene…", { exact: true }),
        ).toBeVisible();
      releaseOldToken();
      await expect
        .poll(() =>
          page.evaluate(() =>
            window.__spatialFixture.tokenCompletions.some(
              (call) => call.sessionId === "fixture-session-a" && call.skipCache,
            ),
          ),
        )
        .toBe(true);
      // Let the resolved SDK promise's microtasks and the next render commit run.
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      expect(attemptedWrites).toBe(0);
      expect(store.writes).toHaveLength(0);
      if (action === "signout")
        await page.getByRole("button", { name: "Use fixture session B", exact: true }).click();
      releaseNewSession();
      await expect(
        page.getByRole("heading", { name: "Spatial fixture project", exact: true }),
      ).toBeVisible();
      await expect(objectButton(page, 1)).toHaveCount(0);
      await expect(page.getByText("Revision 7", { exact: true })).toBeVisible();
      await expect(page.getByTestId("scene-status")).toHaveText("Scene is up to date");
      expect(attemptedWrites).toBe(0);
    } finally {
      releaseOldToken();
      releaseNewSession();
    }
  });
