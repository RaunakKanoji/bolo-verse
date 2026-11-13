import { expect, test } from "@playwright/test";

test("HUD runs the existing isolated renderer, switches context without remount and keeps bounded view preferences", async ({
  page,
}, testInfo) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto("/xr/hud");
  await expect(page.getByTestId("hud-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  const frame = page.frameLocator('iframe[title="XR studio canvas"]');
  await expect(frame.locator("a-scene")).toHaveCount(1);
  await frame
    .locator("a-scene")
    .evaluate((el) => el.setAttribute("data-lifetime-test", "same-scene"));
  await page
    .getByRole("navigation", { name: "Spatial navigation" })
    .getByRole("button", { name: "Projects", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(frame.locator("a-scene")).toHaveAttribute("data-lifetime-test", "same-scene");
  await page.getByLabel("Layout preset").selectOption("FOCUSED");
  await page.reload();
  await expect(page.getByLabel("Layout preset")).toHaveValue("FOCUSED");
  await expect(page.getByTestId("hud-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  await page
    .frameLocator('iframe[title="XR studio canvas"]')
    .locator('[data-hud-action="layout:STANDARD"]')
    .evaluate((el) => el.dispatchEvent(new CustomEvent("click", { bubbles: true })));
  await expect(page.getByLabel("Layout preset")).toHaveValue("STANDARD");
  await page.getByLabel("Layout preset").selectOption("COMPACT");
  await page.getByRole("button", { name: "Reset layout", exact: true }).click();
  await expect(page.getByLabel("Layout preset")).toHaveValue("STANDARD");
  await expect(page.getByRole("button", { name: "Enter VR", exact: true })).toBeDisabled();
  await expect(page.getByText("Connect your workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("Your projects appear here", { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("hud-desktop.png"), fullPage: true });
  expect(failures).toEqual([]);
});

test("HUD ray controls share navigation, and mobile retains accessible controls", async ({
  page,
}, testInfo) => {
  await page.goto("/xr/hud");
  await expect(page.getByTestId("hud-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  const frame = page.frameLocator('iframe[title="XR studio canvas"]');
  await frame
    .locator('[data-hud-panel="main"] [data-hud-action="nav:projects"]')
    .evaluate((el) => el.dispatchEvent(new CustomEvent("click", { bubbles: true })));
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Spatial navigation" })
    .getByRole("button", { name: "Workspace", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your creative studio", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Environment").selectOption("Minimal Void");
  await expect(frame.locator("a-scene")).toHaveAttribute("data-hud-environment", "Minimal Void");
  await page.screenshot({ path: testInfo.outputPath("hud-mobile.png"), fullPage: true });
});

test("missing WebGL leaves readable dashboard and keyboard navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      return kind.includes("webgl") ? null : Reflect.apply(original, this, [kind, ...args]);
    } as typeof original;
  });
  await page.goto("/xr/hud");
  await expect(page.getByTestId("hud-runtime-status")).toContainText("3D view unavailable", {
    timeout: 30000,
  });
  const projects = page
    .getByRole("navigation", { name: "Spatial navigation" })
    .getByRole("button", { name: "Projects", exact: true });
  await projects.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Projects", exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Project carousel").getByRole("link", { name: "Create project", exact: true }),
  ).toBeVisible();
});

test("legacy preview clearly opens the current HUD and releases the sample scene", async ({
  page,
}) => {
  await page.goto("/xr/preview");
  await expect(page.getByTestId("xr-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  await expect(
    page.getByText("Legacy interaction sample · placeholder cards only", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open spatial workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/xr\/hud$/);
  await expect(page.getByTestId("hud-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  await expect(page.getByTestId("xr-workspace")).toHaveCount(0);
  await expect(page.locator('iframe[title="XR studio canvas"]')).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Try local 3D demo", exact: true })).toHaveAttribute(
    "href",
    "/workspace/demo",
  );
});

test("unconfigured spatial entry points to the current HUD instead of the placeholder sample", async ({
  page,
}) => {
  await page.goto("/studio/xr");
  await expect(
    page.getByRole("link", { name: "Open spatial workspace", exact: true }),
  ).toHaveAttribute("href", "/xr/hud");
});
