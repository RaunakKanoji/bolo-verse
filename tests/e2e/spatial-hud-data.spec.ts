import { spawn, type ChildProcess } from "node:child_process";
import { test, expect } from "@playwright/test";
let origin = "",
  harness: ChildProcess;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-spatial-hud-harness.mjs"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness.kill("SIGTERM");
      reject(new Error(output));
    }, 25000);
    harness.stdout!.on("data", (chunk) => {
      output += String(chunk);
      const match = /HUD_HARNESS_READY (\d+)/.exec(output);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness.stderr!.on("data", (chunk) => (output += String(chunk)));
    harness.once("exit", () => {
      clearTimeout(timer);
      reject(new Error(output));
    });
  });
});
test.afterAll(async () => {
  if (harness?.exitCode === null)
    await new Promise<void>((resolve) => {
      harness.once("exit", () => resolve());
      harness.kill("SIGTERM");
    });
});
const id = "e67ea056-e196-445c-8c9b-55b2058a5d58";
const project = {
  id,
  name: "ALTÉR fragrance launch",
  objective: "Develop a fragrance campaign from the approved brief.",
  clientId: null,
  type: "Campaign",
  status: "active",
  priority: "normal",
  startDate: null,
  dueDate: "2026-12-01",
  clientName: "ALTÉR",
  createdAt: "2026-11-13T00:00:00.000Z",
  updatedAt: "2026-11-13T00:00:00.000Z",
  revision: 1,
  progress: 35,
  canEdit: true,
};
const data = {
  metrics: { activeProjects: 1, pendingReviews: 2, completedDeliverables: 0, upcomingDeadlines: 1 },
  projects: [project],
  tasks: [],
  activity: [],
};

test("authorized overview drives DOM and spatial selection; denied refresh removes private textures", async ({
  page,
}, testInfo) => {
  let denied = false;
  await page.route("**/api/v1/workspace/overview", (route) =>
    route.fulfill({
      status: denied ? 403 : 200,
      json: denied
        ? {
            ok: false,
            error: { code: "FORBIDDEN", message: "Workspace access changed.", retryable: false },
            requestId: "fixture-hud",
          }
        : { ok: true, data, requestId: "fixture-hud" },
    }),
  );
  await page.goto(origin);
  await expect(page.getByTestId("hud-runtime-status")).toContainText("Desktop preview", {
    timeout: 30000,
  });
  const carousel = page
    .getByRole("region", { name: "Shape Studio spatial HUD" })
    .getByLabel("Project carousel");
  await expect(carousel).toContainText(project.name);
  const projected = await page
    .frameLocator('iframe[title="XR studio canvas"]')
    .locator(`[data-hud-action="project:${id}"]`)
    .evaluate((element) => {
      const el = element as unknown as {
        object3D: import("three").Object3D;
        sceneEl: { camera: import("three").Camera; canvas: HTMLCanvasElement };
      };
      const position = el.object3D.position.clone();
      el.object3D.getWorldPosition(position);
      position.project(el.sceneEl.camera);
      return {
        x: ((position.x + 1) * el.sceneEl.canvas.clientWidth) / 2,
        y: ((1 - position.y) * el.sceneEl.canvas.clientHeight) / 2,
      };
    });
  const canvas = page.frameLocator('iframe[title="XR studio canvas"]').locator("a-scene canvas");
  await canvas.hover({ position: projected });
  await expect
    .poll(() =>
      page
        .frameLocator('iframe[title="XR studio canvas"]')
        .locator(`[data-hud-action="project:${id}"]`)
        .evaluate(
          (element) =>
            (element as unknown as { components: Record<string, { hovered: boolean }> }).components[
              "shape-hud-surface"
            ].hovered,
        ),
    )
    .toBe(true);
  await canvas.click({ position: projected });
  await expect(page.getByLabel("Selected project")).toContainText(project.objective);
  await expect(page.getByRole("link", { name: "Brainstorm", exact: true })).toHaveAttribute(
    "href",
    `/brainstorm?projectId=${id}`,
  );
  const frame = page.frameLocator('iframe[title="XR studio canvas"]');
  await expect(frame.locator(`[data-hud-action="project:${id}"]`)).toHaveCount(1);
  await page.getByRole("button", { name: "Measure renderer stats" }).click();
  await expect(page.getByLabel("Measured HUD renderer statistics")).toContainText(/FPS.*calls/, {
    timeout: 5000,
  });
  await page.screenshot({ path: testInfo.outputPath("hud-connected-desktop.png"), fullPage: true });
  expect(
    await page.evaluate(() => localStorage.getItem("shape-spatial-hud-view-v1")),
  ).not.toContain("ALTÉR");
  denied = true;
  await page.getByRole("button", { name: "Switch fixture session" }).click();
  await expect(page.getByText("Workspace access changed.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Selected project")).toHaveCount(0);
  await expect(frame.locator(`[data-hud-action="project:${id}"]`)).toHaveCount(0);
  expect(
    await frame
      .locator("#shape-spatial-hud")
      .evaluate((el) =>
        JSON.stringify(
          Array.from(el.querySelectorAll("[shape-hud-surface]")).map((e) =>
            e.getAttribute("shape-hud-surface"),
          ),
        ),
      ),
  ).not.toContain("ALTÉR");
});

test("bad payload leaves clear retry state; retry and keyboard navigation work", async ({
  page,
}) => {
  let valid = false;
  await page.route("**/api/v1/workspace/overview", (route) =>
    route.fulfill({
      json: valid
        ? { ok: true, data, requestId: "fixture-hud" }
        : { ok: true, data: { inventedMetric: 100 }, requestId: "fixture-hud" },
    }),
  );
  await page.goto(origin);
  await expect(page.getByRole("alert")).toContainText("unexpected response");
  valid = true;
  await page.getByRole("button", { name: "Retry workspace", exact: true }).click();
  await expect(page.getByLabel("Project carousel")).toContainText("ALTÉR fragrance launch");
  await page
    .getByRole("navigation", { name: "Spatial navigation" })
    .getByRole("button", { name: "Brainstorm", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Brainstorm", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Brainstorm", exact: true })).toBeVisible();
});
