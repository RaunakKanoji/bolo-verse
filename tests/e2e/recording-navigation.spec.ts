import { expect, test } from "@playwright/test";

test("a completed local take survives cancelled navigation and permits download", async ({ page }) => {
  await page.goto("/studio/feasibility");
  await page.getByRole("checkbox", { name: "I agree to record my microphone locally" }).check();
  await page.getByRole("button", { name: "Record 5-second test" }).click();
  await expect(page.getByText("Local recording ready — not saved", { exact: true })).toBeVisible({ timeout: 30000 });
  const messages: string[] = [];
  page.on("dialog", async (dialog) => {
    messages.push(dialog.message());
    await dialog.dismiss();
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download local recording" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.(webm|mp4)$/);
  expect(messages).toHaveLength(0);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/feasibility$/);
  expect(messages).toHaveLength(1);
  expect(messages[0]).toMatch(/not saved/i);
  await expect(page.getByLabel("Local recording playback")).toBeVisible();
  await page.getByRole("button", { name: "Discard local recording" }).click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(messages).toHaveLength(1);
});

test("same-tab navigation warns before interrupting an active take", async ({ page }) => {
  await page.goto("/studio/feasibility");
  await page.getByRole("checkbox", { name: "I agree to record my microphone locally" }).check();
  await page.getByRole("button", { name: "Record 15-second test" }).click();
  // Let the encoder receive frames before stopping; sub-frame takes are
  // correctly rejected as empty rather than presented as usable videos.
  await expect(page.getByTestId("recording-status")).toContainText(/Recording · (?:1[0-4]|[1-9])s remaining/);
  let warned = false;
  page.once("dialog", async (dialog) => {
    warned = /recording|microphone/i.test(dialog.message());
    await dialog.dismiss();
  });
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/studio\/feasibility$/);
  expect(warned).toBe(true);
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(page.getByText("Local recording ready — not saved", { exact: true })).toBeVisible();
});
