import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("crop, rotation and sharpness export real composed pixels and fullscreen can exit", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/studio/create");
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "rgb(180,30,20)";
    context.fillRect(0, 0, 16, 24);
    context.fillStyle = "rgb(20,40,180)";
    context.fillRect(16, 0, 16, 24);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page
    .getByLabel("Choose local image file")
    .setInputFiles({
      name: "two-tones.png",
      mimeType: "image/png",
      buffer: Buffer.from(fixture, "base64"),
    });
  await expect(page.getByRole("button", { name: "Download PNG", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Centered crop", { exact: true }).selectOption("square");
  await page.getByRole("button", { name: "Rotate right 90 degrees" }).click();
  await page.getByRole("button", { name: "Adjust", exact: true }).click();
  await page.getByRole("slider", { name: "Sharpness", exact: true }).fill("50");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const downloaded = await pending;
  const path = testInfo.outputPath("composed.png");
  await downloaded.saveAs(path);
  const pixels = await page.evaluate(
    async (encoded) => {
      const image = new Image();
      image.src = `data:image/png;base64,${encoded}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return {
        width: image.width,
        height: image.height,
        top: [...context.getImageData(12, 4, 1, 1).data],
        bottom: [...context.getImageData(12, 20, 1, 1).data],
        edge: [...context.getImageData(12, 11, 1, 1).data],
      };
    },
    (await readFile(path)).toString("base64"),
  );
  expect(pixels.width).toBe(24);
  expect(pixels.height).toBe(24);
  expect(pixels.top).toEqual([180, 30, 20, 255]);
  expect(pixels.bottom).toEqual([20, 40, 180, 255]);
  expect(pixels.edge[0]).toBeGreaterThan(200);
  await page.getByRole("button", { name: "Fullscreen preview", exact: true }).click();
  await page.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fullscreen preview", exact: true })).toBeVisible();
});
