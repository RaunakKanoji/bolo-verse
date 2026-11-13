import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-project-images-harness.mjs"], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error(`Images harness timeout: ${output}`)), 25_000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /IMAGES_HARNESS_READY (\d+)/.exec(output);
      if (ready) { origin = `http://127.0.0.1:${ready[1]}`; clearTimeout(timer); resolve(); }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    harness!.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Images harness exited ${code}: ${output}`)); });
    harness!.once("error", reject);
  });
});
test.afterAll(async () => {
  if (harness && harness.exitCode === null) await new Promise<void>((resolve) => { harness!.once("exit", () => resolve()); harness!.kill("SIGTERM"); });
});
const projectId = "e67ea056-e196-445c-8c9b-55b2058a5d58";
const assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
const uploadId = "b046df5a-e5e4-4727-a191-2266e031bba9";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==", "base64");
const asset = { id: assetId, projectId, mimeType: "image/png", byteSize: png.length, width: 1, height: 1, durationSeconds: null, createdAt: "2026-11-13T00:00:00.000Z", contentUrl: `/api/v1/assets/${assetId}/content`, nativeContentUrl: null };
const ok = (data: unknown) => ({ ok: true, data, requestId: "images-component-fixture" });
const failure = (status: number, message: string) => ({ status, json: { ok: false, error: { code: "UNAVAILABLE", message, retryable: status === 503 }, requestId: "fixture" } });
async function backend(page: Page, initiallyReady = false) {
  await page.route(`${origin}/api/v1/projects/${projectId}/deliverables`, (route) => route.fulfill({ json: ok({ deliverables: [], hasMore: false, canPublish: true }) }));
  let ready = initiallyReady;
  const reservations: { idempotencyKey: string }[] = [];
  let puts = 0, finalizes = 0;
  await page.route(`${origin}/api/v1/projects/${projectId}/assets`, (route) => route.fulfill({ json: ok({ assets: ready ? [asset] : [], hasMore: false }) }));
  await page.route(`${origin}/api/v1/assets/upload-session`, (route) => {
    reservations.push(route.request().postDataJSON());
    return route.fulfill({ status: 201, json: ok({ upload: { id: uploadId, projectId, assetId, expiresAt: "2026-11-13T10:00:00.000Z", uploadUrl: "https://storage.example.test/upload", uploadContentType: "image/png" } }) });
  });
  await page.route("https://storage.example.test/upload", (route) => {
    puts++;
    expect(route.request().headers()["if-none-match"]).toBe("*");
    expect(route.request().headers().cookie).toBeUndefined();
    return route.fulfill({ status: puts > 1 ? 412 : 200, headers: { "Access-Control-Allow-Origin": origin } });
  });
  await page.route(`${origin}/api/v1/assets/upload-session/${uploadId}/finalize`, (route) => {
    finalizes++; ready = true;
    expect(route.request().postDataJSON()).toEqual({});
    return route.fulfill({ json: ok({ asset }) });
  });
  await page.route(`${origin}${asset.contentUrl}`, (route) => route.fulfill({ contentType: "image/png", body: png }));
  return { reservations, puts: () => puts, finalizes: () => finalizes };
}
async function choose(page: Page) {
  await page.getByLabel("Choose project image").setInputFiles({ name: "private-poster.png", mimeType: "image/png", buffer: png });
}
test("PNG upload is independent of Gemini, selected from real decoded ready grid and survives refresh", async ({ page }, testInfo) => {
  const state = await backend(page);
  const providerRequests: string[] = [];
  page.on("request", (request) => { if (/capabilities|generations|gemini/i.test(request.url())) providerRequests.push(request.url()); });
  await page.goto(origin);
  await expect(page.getByText("No ready project images yet.", { exact: true })).toBeVisible();
  await choose(page);
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  await expect(page.getByText("Image uploaded and ready.", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Project image 1", exact: true })).toBeVisible();
  expect(await page.getByRole("img", { name: "Project image 1", exact: true }).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1);
  await expect(page.getByRole("button", { name: "Select project image 1", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "Open selected image" })).toHaveAttribute("href", `/app/projects/${projectId}/assets/${assetId}`);
  await page.screenshot({ path: testInfo.outputPath("project-images-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("project-images-mobile.png"), fullPage: true });
  await page.reload();
  await expect(page.getByRole("img", { name: "Project image 1", exact: true })).toBeVisible();
  expect(state.reservations).toHaveLength(1);
  expect(providerRequests).toEqual([]);
});
test("retry after finalize interruption reuses the reservation and verifies a conditional PUT conflict", async ({ page }) => {
  const state = await backend(page);
  let fail = true;
  await page.route(`${origin}/api/v1/assets/upload-session/${uploadId}/finalize`, (route) => {
    if (!fail) return route.fallback();
    fail = false;
    return route.fulfill(failure(503, "Verification interrupted. Retry the same image."));
  });
  await page.goto(origin);
  await choose(page);
  await page.getByRole("button", { name: "Upload image", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Retry upload", exact: true }).click();
  await expect(page.getByText("Image uploaded and ready.", { exact: true })).toBeVisible();
  expect(state.reservations).toHaveLength(2);
  expect(state.reservations[0].idempotencyKey).toBe(state.reservations[1].idempotencyKey);
  expect(state.puts()).toBe(2);
  expect(state.finalizes()).toBe(1);
});
test("invalid/spoofed and oversized files never reserve a ready asset", async ({ page }) => {
  const state = await backend(page);
  await page.goto(origin);
  for (const file of [{ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not PNG bytes") }, { name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(20 * 1024 * 1024 + 1) }]) {
    await page.getByLabel("Choose project image").setInputFiles(file);
    await page.getByRole("button", { name: "Upload image", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  }
  expect(state.reservations).toHaveLength(0);
});
test("read-only project users can preview but cannot upload; preview access loss clears private data", async ({ page }) => {
  await backend(page, true);
  await page.goto(origin);
  await page.getByRole("button", { name: "Use read-only fixture role" }).click();
  await expect(page.getByRole("img", { name: "Project image 1", exact: true })).toBeVisible();
  await expect(page.getByLabel("Choose project image")).toHaveCount(0);
  await page.route(`${origin}${asset.contentUrl}`, (route) => route.fulfill(failure(403, "Access changed")));
  await page.getByRole("button", { name: "Refresh project images", exact: true }).click();
  await expect(page.getByText(/Project image access is unavailable/)).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);
});
test("session sign-out aborts pending verification and discards its late private result", async ({ page }) => {
  await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let waiting = false;
  await page.route(`${origin}/api/v1/assets/upload-session/${uploadId}/finalize`, async (route) => {
    waiting = true; await gate;
    await route.fulfill({ json: ok({ asset }) }).catch(() => undefined);
  });
  await page.goto(origin);
  try {
    await choose(page);
    await page.getByRole("button", { name: "Upload image", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await expect(page.getByRole("progressbar")).toHaveAttribute("value", "4");
    await page.getByRole("button", { name: "Sign out fixture session" }).click();
    release();
    await expect(page.getByText(/Sign in to view project images/)).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(0);
    await expect(page.getByText("Image uploaded and ready.", { exact: true })).toHaveCount(0);
  } finally { release(); }
});
test("cancel stops transfer before finalize and keeps an explicit retry for the same file", async ({ page }) => {
  const state = await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let waiting = false;
  await page.route("https://storage.example.test/upload", async (route) => { waiting = true; await gate; await route.fulfill({ status: 200 }).catch(() => undefined); });
  await page.goto(origin);
  try {
    await choose(page);
    await page.getByRole("button", { name: "Upload image", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await page.getByRole("button", { name: "Cancel upload", exact: true }).click();
    release();
    await expect(page.getByText(/Upload cancelled/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry upload", exact: true })).toBeEnabled();
    expect(state.finalizes()).toBe(0);
  } finally { release(); }
});

test("bad catalog refresh retains the verified grid and selected image without trusting foreign assets", async ({ page }) => {
  const state = await backend(page, true);
  await page.goto(origin);
  await expect(page.getByRole("img", { name: "Project image 1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Select project image 1", exact: true }).click();
  await page.route(`${origin}/api/v1/projects/${projectId}/assets`, (route) => route.fulfill({ json: ok({ assets: [{ ...asset, projectId: assetId }], hasMore: false }) }));
  await page.getByRole("button", { name: "Refresh project images", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be refreshed");
  await expect(page.getByRole("img", { name: "Project image 1", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open selected image" })).toHaveAttribute("href", `/app/projects/${projectId}/assets/${assetId}`);
  expect(state.reservations).toHaveLength(0);
});

test("unmount revokes preview URLs and remount owns one fresh image preview", async ({ page }) => {
  await backend(page, true);
  await page.goto(origin);
  const image = page.getByRole("img", { name: "Project image 1", exact: true });
  await expect(image).toBeVisible();
  const previous = await image.getAttribute("src");
  expect(previous).toMatch(/^blob:/);
  await page.getByRole("button", { name: "Close fixture images" }).click();
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect.poll(() => page.evaluate(async (url) => {
    try { await fetch(url!); return false; } catch { return true; }
  }, previous)).toBe(true);
  await page.getByRole("button", { name: "Reopen fixture images" }).click();
  await expect(image).toBeVisible();
  expect(await image.getAttribute("src")).not.toBe(previous);
});

test("lost editor role aborts verification and clears the retained file before viewer remount", async ({ page }) => {
  await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let waiting = false;
  await page.route(`${origin}/api/v1/assets/upload-session/${uploadId}/finalize`, async (route) => {
    waiting = true; await gate;
    await route.fulfill({ json: ok({ asset }) }).catch(() => undefined);
  });
  await page.goto(origin);
  try {
    await choose(page);
    await page.getByRole("button", { name: "Upload image", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await page.getByRole("button", { name: "Use read-only fixture role" }).click();
    release();
    await expect(page.getByLabel("Choose project image")).toHaveCount(0);
    await expect(page.getByText("Selected file: private-poster.png", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Image uploaded and ready.", { exact: true })).toHaveCount(0);
  } finally { release(); }
});
