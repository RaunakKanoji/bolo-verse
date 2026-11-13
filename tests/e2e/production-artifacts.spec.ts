import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  SaveProductionArtifactSchema,
  type ProductionLibrary,
} from "../../apps/web/src/lib/contracts/production-artifacts";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-production-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Production harness timeout: ${output}`));
    }, 25000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /PRODUCTION_HARNESS_READY (\d+)/.exec(output);
      if (ready) {
        origin = `http://127.0.0.1:${ready[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    harness!.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    harness!.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Production harness exited ${code}: ${output}`));
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
const projectId = "a7000000-0000-4000-8000-000000000001",
  briefId = "a7000000-0000-4000-8000-000000000003";
async function fixture(page: Page) {
  const library: ProductionLibrary = {
    versions: [],
    ideas: [
      {
        id: "a7000000-0000-4000-8000-000000000004",
        title: "Morning concept",
        description: "Pour cold brew into a glass.",
      },
    ],
    generation: "unavailable",
    briefs: [
      {
        id: briefId,
        version: 1,
        brief: {
          schemaVersion: 1,
          objective: "Launch coffee",
          audience: "Commuters",
          product: "Coffee",
          format: "reel",
          aspectRatio: "9:16",
          tone: "Warm",
          language: "en-IN",
          facts: [],
          constraints: [],
          prohibitedClaims: [],
        },
      },
    ],
  };
  const writes: ReturnType<typeof SaveProductionArtifactSchema.parse>[] = [];
  let failure: "lost" | "conflict" | "denied" | undefined;
  await page.route(`${origin}/api/projects/*/artifacts`, async (route) => {
    if (failure === "denied" || (failure === "conflict" && route.request().method() === "POST"))
      return route.fulfill({
        status: failure === "denied" ? 403 : 409,
        json: {
          ok: false,
          requestId: "production-fixture",
          error: {
            code: failure === "denied" ? "FORBIDDEN" : "CONFLICT",
            message: "Private access unavailable",
            retryable: false,
          },
        },
      });
    if (route.request().method() === "GET")
      return route.fulfill({ json: { ok: true, data: library, requestId: "production-fixture" } });
    const input = SaveProductionArtifactSchema.parse(route.request().postDataJSON());
    writes.push(input);
    let saved = library.versions.find((v) => v.id === input.idempotencyKey);
    if (!saved) {
      saved = {
        id: input.idempotencyKey,
        projectId,
        kind: input.artifact.kind,
        version: input.expectedVersion + 1,
        artifact: input.artifact,
        savedAt: "2026-11-13T01:00:00.000Z",
      };
      library.versions = [saved, ...library.versions].sort((a, b) => b.version - a.version);
    }
    if (failure === "lost") return route.abort("failed");
    return route.fulfill({ json: { ok: true, data: saved, requestId: "production-fixture" } });
  });
  return {
    library,
    writes,
    fail: (value: typeof failure) => {
      failure = value;
    },
  };
}
async function fillDirection(page: Page) {
  await page.getByLabel("Copy my saved brainstorm idea").selectOption({ label: "Morning concept" });
  await page.getByLabel("Saved brief version").selectOption(briefId);
  await page.getByLabel("Hook", { exact: true }).fill("Start your morning");
  await page.getByLabel("Visual treatment").fill("Amber sunlight and condensation");
  await page.getByLabel("Rationale").fill("Show a simple everyday ritual");
  await page.getByRole("button", { name: "Save direction as new version" }).click();
  await expect(page.getByRole("status")).toContainText("direction version: 1");
}
test("saved ideas become editable direction, script and text storyboard versions that survive refresh", async ({
  page,
}) => {
  const api = await fixture(page);
  await page.goto(origin);
  await fillDirection(page);
  await page.getByLabel("Artifact type").selectOption("script");
  await page.getByLabel("Saved direction version").selectOption({ label: "Direction v1" });
  await page.getByLabel("Section 1 dialogue / voiceover").fill("Morning starts here.");
  await page.getByLabel("Section 1 on-screen text").fill("Cold brew");
  await page.getByLabel("Call to action").fill("Try Nova Coffee");
  await page.getByRole("button", { name: "Save script as new version" }).click();
  await expect(page.getByRole("status")).toContainText("script version: 1");
  await page.getByLabel("Artifact type").selectOption("storyboard");
  await page.getByLabel("Saved script version").selectOption({ label: "Script v1" });
  await page.getByLabel("Scene 1 description", { exact: true }).fill("Pour coffee over ice");
  await page.getByLabel("Scene 1 camera framing").fill("Close up");
  await page.getByLabel("Scene 1 visual direction / lighting").fill("Warm side light");
  await page.getByLabel("Scene 1 dialogue / voiceover").fill("Morning starts here.");
  await page.getByLabel("Scene 1 notes", { exact: true }).fill("Use clear glass");
  await page.getByRole("button", { name: "Save storyboard as new version" }).click();
  await expect(page.getByRole("status")).toContainText("storyboard version: 1");
  await page.getByLabel("Scene 1 description", { exact: true }).fill("Pour cold brew over ice");
  await page.getByRole("button", { name: "Save storyboard as new version" }).click();
  await expect(page.getByRole("status")).toContainText("storyboard version: 2");
  await page.reload();
  await page.getByLabel("Artifact type").selectOption("storyboard");
  await expect(page.getByLabel("Scene 1 description", { exact: true })).toHaveValue(
    "Pour cold brew over ice",
  );
  await page.getByRole("button", { name: /^Text storyboard v1/ }).click();
  await expect(page.getByLabel("Scene 1 description", { exact: true })).toHaveValue(
    "Pour coffee over ice",
  );
  expect(api.library.versions).toHaveLength(4);
  expect(api.writes[2].artifact.kind).toBe("storyboard");
  await expect(page.getByText(/text only/)).toBeVisible();
  await expect(page.getByText(/Direct artifact generation is unavailable/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("lost save response keeps the same UUID and conflict refresh retains local edits", async ({
  page,
}) => {
  const api = await fixture(page);
  await page.goto(origin);
  await fillDirection(page);
  await page.getByLabel("Direction title").fill("Second direction");
  api.fail("lost");
  await page.getByRole("button", { name: "Save direction as new version" }).click();
  await expect(page.getByRole("alert")).toContainText("retry safely");
  api.fail(undefined);
  await page.getByRole("button", { name: "Save direction as new version" }).click();
  await expect(page.getByRole("status")).toContainText("direction version: 2");
  expect(api.writes.at(-1)).toEqual(api.writes.at(-2));
  await page.getByLabel("Direction title").fill("Local revision");
  api.fail("conflict");
  await page.getByRole("button", { name: "Save direction as new version" }).click();
  await expect(page.getByRole("alert")).toContainText("edits are kept");
  await expect(page.getByRole("button", { name: "Save direction as new version" })).toBeDisabled();
  api.fail(undefined);
  await page.getByRole("button", { name: "Refresh history (keep edits)" }).click();
  await expect(page.getByLabel("Direction title")).toHaveValue("Local revision");
  await expect(page.getByRole("button", { name: "Save direction as new version" })).toBeEnabled();
});
test("revoked access clears loaded private text and editor controls", async ({ page }) => {
  const api = await fixture(page);
  await page.goto(origin);
  await fillDirection(page);
  api.fail("denied");
  await page.getByRole("button", { name: "Refresh history (keep edits)" }).click();
  await expect(page.getByRole("alert")).toContainText("access has changed");
  await expect(page.getByRole("form", { name: "Edit direction" })).toHaveCount(0);
  await expect(page.getByText("Morning concept", { exact: true })).toHaveCount(0);
});
