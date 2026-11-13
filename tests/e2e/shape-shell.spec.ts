import { expect, test } from "@playwright/test";

test("Shape navigation stays named on small screens and shortcuts ignore editable fields", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/studio/settings");
  const navigation = page.getByRole("navigation", { name: "Studio navigation" });
  await expect(navigation.getByRole("link", { name: "Create", exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Workspace tools" })
      .getByRole("link", { name: "Profile", exact: true }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(drawer.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Appearance", { exact: true }).focus();
  await page.keyboard.press("Alt+Digit2");
  await expect(page).toHaveURL(/\/studio\/settings$/);
  await page.getByRole("heading", { name: "Workspace Settings" }).click();
  await page.keyboard.press("Alt+Digit2");
  await expect(page).toHaveURL(/\/create$/);
  await expect(navigation.getByRole("link", { name: "Create", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("appearance persists across navigation and dark workspace fits narrow viewports", async ({
  page,
}, testInfo) => {
  await page.goto("/studio/settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-shape-theme", "dark");
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Workspace", exact: true })
    .click();
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(16, 17, 24)");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath(`shape-dark-${width}.png`), fullPage: true });
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-shape-theme", "dark");
  await page.goto("/studio/create");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(16, 17, 24)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("shape-playground-dark-mobile.png"),
    fullPage: true,
  });
});

test("versioned capabilities are truthful and private project context fails closed", async ({
  request,
  page,
}) => {
  const catalog = await request.get("/api/v1/capabilities");
  expect(catalog.ok()).toBe(true);
  const body = await catalog.json();
  expect(body.data.modes).toHaveLength(4);
  expect(
    body.data.modes.every(
      (mode: { availability: string; settings: unknown[] }) =>
        mode.availability === "not_implemented" && mode.settings.length === 0,
    ),
  ).toBe(true);
  await page.goto("/studio/create?projectId=11111111-1111-4111-8111-111111111111");
  await expect(page.getByRole("textbox", { name: "Image prompt" })).toHaveCount(0);
  expect((await request.get("/api/v1/projects")).status()).toBe(503);
});
