import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test("home exposes a working recording experiment and honest project setup", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Give your next/ })).toBeVisible();
  await page.getByRole("link", { name: "Open projects", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Connect your workspace" })).toBeVisible();
});

test("consent gates a real portrait recording with synthetic microphone input", async ({ page, browser }, testInfo) => {
  const graphicsErrors: string[] = [];
  page.on("console", message => {
    if (/WebGL.*INVALID_OPERATION/.test(message.text())) graphicsErrors.push(message.text());
  });
  await page.goto("/studio/feasibility");
  const record = page.getByRole("button", { name: "Record 5-second test" });
  await expect(record).toBeDisabled();
  await page.getByRole("checkbox", { name: "I agree to record my microphone locally" }).check();
  await expect(record).toBeEnabled();
  await record.click();
  await expect(page.getByText("Local recording ready — not saved", { exact: true })).toBeVisible({ timeout: 30000 });
  const video = page.getByLabel("Local recording playback");
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.videoWidth)).toBe(720);
  const media = await video.evaluate(async (node: HTMLVideoElement) => {
    const blob = await (await fetch(node.src)).blob();
    await node.play();
    const capture = (node as HTMLVideoElement & { captureStream(): MediaStream }).captureStream();
    const audioTracks = capture.getAudioTracks().length;
    capture.getTracks().forEach(track => track.stop());
    return { width: node.videoWidth, height: node.videoHeight, bytes: blob.size, mime: blob.type, audioTracks };
  });
  expect(media.height).toBe(1280);
  expect(media.bytes).toBeGreaterThan(1000);
  expect(media.mime).toMatch(/^video\/(webm|mp4)/);
  expect(media.audioTracks).toBe(1);
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(0.1);
  const decodedFrame = await video.evaluate((node: HTMLVideoElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = node.videoWidth;
    canvas.height = node.videoHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(node, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let lightPixels = 0;
    let textilePixels = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 150 && pixels[i + 1] > 150 && pixels[i + 2] > 150) lightPixels++;
      if (pixels[i] > pixels[i + 1] * 1.2 && pixels[i] > pixels[i + 2] * 1.2) textilePixels++;
    }
    return { image: canvas.toDataURL("image/png").split(",")[1], lightPixels, textilePixels };
  });
  expect(decodedFrame.lightPixels).toBeGreaterThan(100_000);
  expect(decodedFrame.textilePixels).toBeGreaterThan(10_000);
  const framePath = testInfo.outputPath("decoded-recording-frame.png");
  await writeFile(framePath, Buffer.from(decodedFrame.image, "base64"));
  await testInfo.attach("decoded-recording-frame", { path: framePath, contentType: "image/png" });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download local recording" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toMatch(/\.(webm|mp4)$/);
  await download.saveAs(testInfo.outputPath(download.suggestedFilename()));
  await testInfo.attach("recording-evidence", {
    body: JSON.stringify({ ...media, browser: browser.version(), input: "Chromium synthetic microphone", hardware: "Not a physical Android test" }, null, 2),
    contentType: "application/json",
  });
  expect(graphicsErrors).toEqual([]);
});

test("missing authentication configuration fails closed for private API", async ({ request }) => {
  const response = await request.get("/api/projects");
  expect(response.status()).toBe(503);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await response.json()).ok).toBe(false);
});
