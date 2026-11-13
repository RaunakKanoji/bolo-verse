import { expect, test } from "@playwright/test";

test("Video Creation opens the embedded editor route with contextual service state", async ({
  page,
}) => {
  await page.goto("/create");
  await expect(
    page.getByRole("link", { name: "Start Video Creation", exact: true }),
  ).toHaveAttribute("href", "/create/video");
  await page.getByRole("link", { name: "Start Video Creation", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "A story, frame by frame.", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Connect your workspace", exact: true }),
  ).toHaveCount(0);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
