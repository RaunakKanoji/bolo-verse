import { expect, test } from "@playwright/test";
test("review and spatial entry screens stay accessible without configured services", async ({
  page,
}) => {
  for (const [path, title] of [
    ["/review", "Review & Approvals"],
    ["/spatial-studio", "Spatial Studio"],
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Connect your workspace", exact: true }),
    ).toHaveCount(0);
  }
  await expect(
    page.getByRole("link", { name: "Try the desktop 3D demo", exact: true }),
  ).toHaveAttribute("href", "/workspace/demo");
});
test("review categories are usable with an empty offline inbox", async ({ page }) => {
  await page.goto("/review");
  for (const name of ["Pending Review", "Changes Requested", "Approved", "All Submissions"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  }
  await expect(page.getByText("No submissions to review", { exact: true })).toBeVisible();
});
