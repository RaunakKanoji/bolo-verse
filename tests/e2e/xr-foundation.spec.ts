import { expect, test } from "@playwright/test";

test("loads the real A-Frame desktop studio without a headset or remote asset requests", async ({ page }, testInfo) => {
  const failures: string[] = [];
  const external: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  page.on("request", request => {
    if (/^https?:/.test(request.url()) && !request.url().startsWith("http://127.0.0.1:3000")) external.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/xr/preview");
  await expect(page.getByRole("heading", { name: "XR foundation preview" })).toBeVisible();
  await expect(page.getByTestId("xr-runtime-status")).toContainText(/ready|desktop/i, { timeout: 30000 });
  const studio = page.frameLocator('iframe[title="XR studio canvas"]');
  await expect(studio.locator("a-scene")).toHaveCount(1);
  await expect(studio.locator("a-scene canvas")).toBeVisible();
  await page.getByRole("button", { name: "Inspect Concept card", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inspect Concept card", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Inspect project overview", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("complementary", { name: "Workspace companion" }).getByRole("heading", { name: "Concept card", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter VR", exact: true })).toBeDisabled();
  await expect(page.getByTestId("xr-capability-status")).toContainText(/not available|not supported|unavailable|no immersive VR headset/i);
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  const canvasImage = await studio.locator("a-scene canvas").screenshot({ path: testInfo.outputPath("xr-canvas.png") });
  const rendered = await page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set<string>();
    let lightPixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      colors.add(`${pixels[i] >> 4},${pixels[i + 1] >> 4},${pixels[i + 2] >> 4}`);
      if (pixels[i] > 150 && pixels[i + 1] > 150 && pixels[i + 2] > 150) lightPixels++;
    }
    return { colors: colors.size, lightPixels };
  }, canvasImage.toString("base64"));
  expect(rendered.colors).toBeGreaterThan(20);
  expect(rendered.lightPixels).toBeGreaterThan(2000);
  expect(await page.evaluate(() => ({ sceneElement: Boolean(customElements.get("a-scene")), globalRuntime: "AFRAME" in window, globalEngine: "THREE" in window }))).toEqual({ sceneElement: false, globalRuntime: false, globalEngine: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("xr-desktop.png"), fullPage: true });
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test("mobile desktop preview retains accessible companion controls without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/xr/preview");
  await expect(page.getByTestId("xr-runtime-status")).toContainText("Desktop preview", { timeout: 30000 });
  await expect(page.frameLocator('iframe[title="XR studio canvas"]').locator("a-scene canvas")).toBeVisible();
  await page.getByRole("button", { name: "Inspect Storyboard frame", exact: true }).click();
  await expect(page.getByRole("button", { name: "Inspect Storyboard frame", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("xr-mobile.png"), fullPage: true });
});

test("private XR project routes deny unconfigured access and never substitute sample projects", async ({ page, request }) => {
  const projectId = "a0000000-0000-4000-8000-000000000001";
  await page.goto(`/xr/${projectId}`);
  await expect(page.getByRole("heading", { name: "Connect your workspace" })).toBeVisible();
  await expect(page.locator('iframe[title="XR studio canvas"]')).toHaveCount(0);
  const response = await request.post("/api/projects", { data: { name: "Unauthorized", objective: "Cannot create without credentials" }, headers: { Origin: "http://localhost:3000" } });
  expect(response.status()).toBe(503);
  expect((await response.json()).ok).toBe(false);
});

test("XR route teardown leaves no active scene and supports reopening", async ({ page }) => {
  await page.goto("/xr/preview");
  await expect(page.frameLocator('iframe[title="XR studio canvas"]').locator("a-scene canvas")).toBeVisible({ timeout: 30000 });
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.locator('iframe[title="XR studio canvas"]')).toHaveCount(0);
  await page.getByRole("link", { name: "XR preview", exact: true }).click();
  await expect(page.getByTestId("xr-runtime-status")).toContainText(/ready|desktop/i, { timeout: 30000 });
  await expect(page.locator('iframe[title="XR studio canvas"]')).toHaveCount(1);
  const reopened = page.frameLocator('iframe[title="XR studio canvas"]');
  await expect(reopened.locator("a-scene")).toHaveCount(1);
  await expect(reopened.locator("a-scene canvas")).toHaveCount(1);
});
