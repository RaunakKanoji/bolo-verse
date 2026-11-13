import { expect, test } from "@playwright/test";

test("implemented Review is reachable from the studio header", async ({ page }) => {
  await page.goto("/");
  const review = page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Review", exact: true });
  await expect(review).toHaveAttribute("href", "/review");
  await review.click();
  await expect(page).toHaveURL(/\/review$/);
  await expect(
    page.getByRole("heading", { name: "Review & Approvals", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No submissions to review", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Connect your workspace", exact: true }),
  ).toHaveCount(0);
});

test("Brainstorm opens the dedicated drafting studio instead of the legacy XR chooser", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Studio navigation" })
    .getByRole("link", { name: "Brainstorm", exact: true })
    .click();
  await expect(page).toHaveURL(/\/brainstorm$/);
  await expect(page.getByRole("heading", { name: "Brainstorm Studio", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New session", exact: true })).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Connect your workspace", exact: true }),
  ).toHaveCount(0);
});

test("internal spatial port recovers portal page navigation and keeps backend requests isolated", async ({
  request,
  baseURL,
}) => {
  const portal = new URL(baseURL!);
  const internal = `http://127.0.0.1:${process.env.SPATIAL_PORT || Number(portal.port || 3000) + 1}`;
  for (const path of ["/", "/app/projects?view=all", "/reviews", "/studio/brainstorm"]) {
    const response = await request.get(`${internal}${path}`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(`${portal.origin}${path}`);
  }
  expect((await request.get(`${internal}/api/v1/projects`, { maxRedirects: 0 })).status()).toBe(
    404,
  );
  const page = await request.get(`${internal}/app/projects`);
  expect(page.status()).toBe(200);
  expect(page.url()).toBe(`${portal.origin}/projects`);
  expect(await page.text()).toContain("Your Projects");
  expect(await page.text()).toContain("No projects yet");
});
