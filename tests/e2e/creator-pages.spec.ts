import { expect, test } from "@playwright/test";

test("all creator screens retain distinct usable layouts on desktop tablet and mobile without services", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const screens = [
    ["/workspace", "Good morning"],
    ["/projects", "Your Projects"],
    ["/brainstorm", "Brainstorm Studio"],
    ["/create", "Create something extraordinary."],
    ["/review", "Review & Approvals"],
    ["/assets", "Asset Library"],
    ["/clients", "Your Clients"],
    ["/analytics", "Workspace Analytics"],
    ["/spatial-studio", "Spatial Studio"],
    ["/recording-lab", "Recording Lab"],
    ["/settings", "Workspace Settings"],
    ["/profile", "Your Profile"],
  ];
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, title] of screens) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Connect your workspace", exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}px`,
      ).toBe(true);
      if (
        width !== 768 &&
        ["/workspace", "/brainstorm", "/projects", "/review", "/spatial-studio"].includes(path)
      )
        await page.screenshot({
          path: testInfo.outputPath(`${path.slice(1)}-${width}.png`),
          fullPage: true,
        });
    }
  }
});
