import { test, expect } from "@playwright/test";
test("public synthetic workflow connects briefs, conversations, scripts, storyboards, content and feedback", async ({
  page,
}) => {
  await page.goto("/demo");
  await expect(
    page.getByRole("heading", { name: "Your creative production studio" }),
  ).toBeVisible();
  await expect(page.getByText("Fictional demo workspace", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Demo projects" }).getByRole("link"),
  ).toHaveCount(12);
  await expect(page.getByRole("heading", { name: "Submitted client brief" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Demo workflow" })
    .getByRole("link", { name: "Brainstorm", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Historical brainstorming sessions" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Har Cup Mein Khushi", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Script & storyboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Scene 5 · 27–30s" })).toHaveCount(2);
  const frames = page.locator('a[aria-label^="Open Scene"] img');
  await expect(frames).toHaveCount(5);
  for (const frame of await frames.all())
    await expect
      .poll(() =>
        frame.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 640),
      )
      .toBe(true);
  await page.getByRole("link", { name: "Content", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Content library", exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Demo projects" })
    .getByRole("link", { name: /UrbanThread Winter Collection/ })
    .click();
  await expect(
    page.getByRole("region", { name: "Demo project detail" }).getByRole("heading", {
      name: "UrbanThread Winter Collection",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Review & voice", exact: true }).click();
  await expect(
    page.getByText("The overall visual direction looks excellent.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Historical synthetic final approval:", { exact: false }),
  ).toBeVisible();
});
test("demo is usable on a narrow viewport and loads the real A-Frame studio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/demo");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "Open ChaiCraft in spatial studio" }).click();
  await expect(page.getByTestId("demo-spatial-host").locator("iframe")).toBeVisible({
    timeout: 45000,
  });
  await expect(page.getByRole("main").getByRole("status")).toContainText(
    "Synthetic spatial studio ready",
    {
      timeout: 45000,
    },
  );
  await page
    .getByRole("navigation", { name: "Synthetic spatial panels" })
    .getByRole("button", { name: "Campaign storyboard", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Campaign storyboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter immersive view" })).toBeDisabled();
});
