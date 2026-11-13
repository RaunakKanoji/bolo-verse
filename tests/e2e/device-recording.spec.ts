import { expect, test } from "@playwright/test";

test("device listing failure clears a granted preview and allows an explicit retry", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera", "microphone"]);
  await page.addInitScript(() => {
    navigator.mediaDevices.enumerateDevices = async () => {
      throw new Error("Device listing unavailable");
    };
  });
  await page.goto("/recording-lab");
  await page.getByRole("button", { name: "Enable preview", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("Device listing unavailable");
  await expect(page.getByRole("button", { name: "Start recording", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Enable preview", exact: true })).toBeVisible();
});

test("recording lab waits for explicit permission and handles denial without a fake take", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let requests = 0;
    Object.defineProperty(window, "captureRequests", { get: () => requests });
    navigator.mediaDevices.getUserMedia = async () => {
      requests++;
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.goto("/recording-lab");
  await expect(page.getByRole("heading", { name: "Recording Lab", exact: true })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { captureRequests: number }).captureRequests),
  ).toBe(0);
  await page.getByRole("button", { name: "Enable preview", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("permission");
  await expect(page.getByRole("button", { name: "Start recording", exact: true })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Save recording", exact: true })).toHaveCount(0);
});

test("camera recording produces a genuine local take and releases tracks on navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera", "microphone"]);
  await page.goto("/recording-lab");
  await page.getByRole("button", { name: "Enable preview", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start recording", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await expect(page.getByText("00:01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(page.getByRole("link", { name: "Save recording", exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Save recording", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/^shape-recording\.(webm|mp4)$/);
  await page.getByRole("button", { name: "Enable preview", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start recording", exact: true })).toBeEnabled();
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Workspace", exact: true })
    .click();
  await expect(page).toHaveURL(/\/workspace$/);
});
