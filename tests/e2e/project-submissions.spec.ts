import { spawn, type ChildProcess } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";
let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-project-submission-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(output));
    }, 25000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /SUBMISSION_HARNESS_READY (\d+)/.exec(output);
      if (ready) {
        origin = `http://127.0.0.1:${ready[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    harness!.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(output));
    });
  });
});
test.afterAll(async () => {
  if (harness && harness.exitCode === null)
    await new Promise<void>((resolve) => {
      harness!.once("exit", () => resolve());
      harness!.kill("SIGTERM");
    });
});
const reply = (data: unknown) => ({ ok: true, data, requestId: "explicit-http-fixture" });
async function fill(page: Page) {
  for (const [label, value] of [
    ["Project name", "Nova launch"],
    ["Brand or organization", "Nova Coffee"],
    ["Target audience", "Young professionals"],
    ["Objectives", "Introduce cold brew"],
    ["Deliverables", "Social visual"],
    ["Distribution channel", "Instagram"],
    ["Project description", "Synthetic product launch"],
    ["Deadline", "2026-12-01"],
    ["Special instructions", "Use approved logo"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
}
const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
test("client submission persists metadata first and safely retries only failed files", async ({
  page,
}) => {
  let submissions = 0,
    transfers = 0;
  const keys: string[] = [];
  let project = "";
  await page.route("**/api/projects/submissions", async (route) => {
    submissions++;
    const input = route.request().postDataJSON();
    project = input.idempotencyKey;
    await route.fulfill({
      json: reply({ projectId: project, href: `/projects/${project}` }),
      status: 201,
    });
  });
  await page.route("**/api/v1/workspace/uploads?**", async (route) => {
    transfers++;
    const params = new URL(route.request().url()).searchParams;
    const id = params.get("idempotencyKey")!;
    keys.push(id);
    expect(params.get("projectId")).toBe(project);
    expect(submissions).toBe(1);
    if (transfers === 1) {
      await route.fulfill({
        status: 503,
        json: {
          ok: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Fixture transfer interrupted",
            retryable: true,
          },
          requestId: "fixture",
        },
      });
      return;
    }
    await route.fulfill({
      status: 201,
      json: reply({
        asset: {
          id,
          projectId: project,
          mimeType: "application/pdf",
          byteSize: pdf.length,
          width: null,
          height: null,
          durationSeconds: null,
          createdAt: "2026-11-13T00:00:00.000Z",
          contentUrl: `/api/v1/assets/${id}/content`,
          nativeContentUrl: null,
        },
      }),
    });
  });
  await page.goto(origin);
  await fill(page);
  await page
    .getByLabel("Choose brief and reference files")
    .setInputFiles({ name: "brief.pdf", mimeType: "application/pdf", buffer: pdf });
  await page.getByRole("button", { name: "Submit project", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open submitted project" })).toHaveAttribute(
    "href",
    `/projects/${project}`,
  );
  await expect(page.getByText("Fixture transfer interrupted")).toBeVisible();
  await page.getByRole("button", { name: "Retry incomplete uploads" }).click();
  await expect(page.getByText("1 of 1 files completed", { exact: true })).toBeVisible();
  expect(submissions).toBe(1);
  expect(transfers).toBe(2);
  expect(new Set(keys).size).toBe(1);
  await expect(page.getByLabel("Project name", { exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test("an ambiguous submission retries the original key and session changes clear private data", async ({
  page,
}) => {
  const keys: string[] = [];
  await page.route("**/api/projects/submissions", async (route) => {
    const input = route.request().postDataJSON();
    keys.push(input.idempotencyKey);
    if (keys.length === 1) {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 201,
      json: reply({ projectId: input.idempotencyKey, href: `/projects/${input.idempotencyKey}` }),
    });
  });
  await page.goto(origin);
  await fill(page);
  await page.getByRole("button", { name: "Submit project", exact: true }).click();
  await expect(page.getByRole("button", { name: "Retry same submission" })).toBeEnabled();
  await page.getByRole("button", { name: "Retry same submission" }).click();
  await expect(page.getByRole("link", { name: "Open submitted project" })).toBeVisible();
  expect(keys).toHaveLength(2);
  expect(keys[0]).toBe(keys[1]);
  await page.getByRole("button", { name: "Switch fixture session" }).click();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue("");
  await expect(page.getByRole("link", { name: "Open submitted project" })).toHaveCount(0);
});
test("invalid extensions never upload and authorization loss clears the private form", async ({
  page,
}) => {
  let submissions = 0;
  await page.route("**/api/projects/submissions", async (route) => {
    submissions++;
    await route.fulfill({
      status: 403,
      json: {
        ok: false,
        error: { code: "FORBIDDEN", message: "Denied", retryable: false },
        requestId: "fixture",
      },
    });
  });
  await page.goto(origin);
  await fill(page);
  await page
    .getByLabel("Choose brief and reference files")
    .setInputFiles({ name: "brief.exe", mimeType: "application/pdf", buffer: pdf });
  await expect(page.getByRole("alert")).toContainText("matching extension");
  expect(submissions).toBe(0);
  await page.getByRole("button", { name: "Submit project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Private form data was cleared");
  await expect(page.getByLabel("Project name", { exact: true })).toHaveCount(0);
});
