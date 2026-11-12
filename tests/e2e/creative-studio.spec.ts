import { expect, test } from "@playwright/test";

test("dashboard has honest connection state and working creative navigation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good things start with an idea." }),
  ).toBeVisible();
  await expect(
    page.getByText("Illustrative campaign studies · these are not saved projects."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Connect your workspace", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("dashboard-desktop.png"), fullPage: true });
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Create", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Make it your own." })).toBeVisible();
  await expect(page.getByRole("img", { name: "Image adjustment preview" })).toBeVisible();
});

test("image canvas applies adjustments, compares, resets, and exports real edited PNG pixels", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/studio/create");
  const preview = page.getByRole("img", { name: "Image adjustment preview" });
  await expect(preview).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("creative-canvas-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("slider", { name: "Brightness", exact: true }).fill("140");
  await expect(preview).toHaveCSS("filter", /brightness\(1.4\)/);
  await page.getByRole("button", { name: "Show original", exact: true }).click();
  await expect(preview).toHaveCSS("filter", /brightness\(1\)/);
  await page.getByRole("button", { name: "Show edits", exact: true }).click();
  await expect(preview).toHaveCSS("filter", /brightness\(1.4\)/);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Brightness", exact: true })).toHaveValue("100");
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "rgb(100,80,60)";
    ctx.fillRect(0, 0, 32, 24);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Choose local image file").setInputFiles({
    name: "local-study.png",
    mimeType: "image/png",
    buffer: Buffer.from(fixture, "base64"),
  });
  await expect(page.getByText("Local upload. Nothing is uploaded to a server.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PNG", exact: true })).toBeEnabled();
  await page.getByRole("slider", { name: "Brightness", exact: true }).fill("150");
  const event = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("boloverse-image-edit.png");
  const location = testInfo.outputPath("edited.png");
  await download.saveAs(location);
  const { readFile } = await import("node:fs/promises");
  const png = await readFile(location);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const decoded = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return {
      width: image.width,
      height: image.height,
      pixel: [...ctx.getImageData(15, 10, 1, 1).data],
    };
  }, png.toString("base64"));
  expect(decoded.width).toBe(32);
  expect(decoded.height).toBe(24);
  expect(decoded.pixel[0]).toBeGreaterThan(140);
  expect(decoded.pixel[0]).toBeLessThan(160);
  expect(decoded.pixel[3]).toBe(255);
  await expect(page.getByRole("status", { name: "Image export status" })).toContainText(
    "PNG exported",
  );
});

test("creative screens fit narrow viewports and image preset controls remain accessible", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png"), fullPage: true });
  await page.goto("/studio/create");
  await expect(page.getByRole("img", { name: "Image adjustment preview" })).toBeVisible();
  await page.getByRole("button", { name: "Vivid", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Saturation", exact: true })).toHaveValue("125");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("creative-canvas-mobile.png"),
    fullPage: true,
  });
});
