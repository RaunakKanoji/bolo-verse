import { expect, test } from "@playwright/test";

test("shared creator shell exposes canonical feature navigation", async ({ page }) => {
  await page.goto("/");
  const top = page.getByRole("navigation", { name: "Studio navigation" });
  for (const [name, href] of [
    ["Workspace", "/workspace"],
    ["Create", "/create"],
    ["Brainstorm", "/brainstorm"],
    ["Projects", "/projects"],
    ["Review", "/review"],
  ]) {
    await expect(top.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  const side = page.getByRole("navigation", { name: "Workspace tools" });
  for (const [name, href] of [
    ["Assets", "/assets"],
    ["Clients", "/clients"],
    ["Analytics", "/analytics"],
    ["Spatial Studio", "/spatial-studio"],
    ["Recording lab", "/recording-lab"],
    ["Settings", "/settings"],
    ["Profile", "/profile"],
  ]) {
    await expect(side.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test("mobile navigation drawer opens and closes with keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: "Assets", exact: true }).click();
  await expect(page).toHaveURL(/\/assets$/);
  await expect(page.getByRole("dialog", { name: "Workspace navigation" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
