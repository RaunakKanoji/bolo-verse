import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-brainstorm-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Brainstorm harness timed out: ${output}`));
    }, 25000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /BRAINSTORM_HARNESS_READY (\d+)/.exec(output);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
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
      reject(new Error(`Harness exited ${code}: ${output}`));
    });
  });
});
test.afterAll(async () => {
  if (harness && harness.exitCode === null)
    await new Promise<void>((resolve) => {
      harness!.once("exit", resolve);
      harness!.kill("SIGTERM");
    });
});
const brief = {
  schemaVersion: 1,
  title: "Silk brief",
  objective: "Launch silk",
  audience: "Shoppers",
  product: "Silk",
  format: "poster",
  aspectRatio: "1:1",
  tone: "Warm",
  language: "en-IN",
  facts: [],
  prohibitedClaims: [],
  constraints: ["Approved logo"],
  notes: "Existing notes",
};
const directions = ["Craft story", "Everyday silk", "Gift story"].map((name) => ({
  name,
  concept: "Show the craft",
  visualDirection: "Warm light",
  proposedDeliverable: "Poster",
  productionSuggestion: "Close-up weave",
}));
const result = {
  reply: "Three possibilities for your silk campaign",
  directions,
  sourceBriefVersion: 1,
  providerStatus: "live",
  format: "structured",
};
async function fixture(page: Page, options: { canEdit?: boolean; version?: number } = {}) {
  let saved = {
    brief: options.version === 0 ? null : { ...brief },
    version: options.version ?? 1,
    savedAt: "2026-11-13T01:00:00.000Z",
    canEdit: options.canEdit ?? true,
  };
  let failure: "network" | "quota" | "missing" | "denied" | "stale" | "plain" | undefined;
  let gate: Promise<void> | undefined;
  let settled = false;
  const posts: unknown[] = [],
    saves: unknown[] = [];
  const ok = (data: unknown) => ({ ok: true, data, requestId: "brainstorm-fixture" });
  await page.route(`${origin}/api/v1/projects/*/brief`, async (route) => {
    if (route.request().method() === "PUT") {
      const input = route.request().postDataJSON();
      saves.push(input);
      saved = { ...saved, brief: input.brief, version: saved.version + 1 };
    }
    return route.fulfill({ json: ok(saved) });
  });
  await page.route(`${origin}/api/v1/projects/*/brainstorm`, async (route) => {
    posts.push(route.request().postDataJSON());
    await gate;
    if (failure === "network") return route.abort("failed");
    if (failure && failure !== "plain")
      return route.fulfill({
        status: { quota: 429, missing: 503, denied: 403, stale: 409 }[failure],
        json: {
          ok: false,
          error: {
            code:
              failure === "quota"
                ? "RATE_LIMITED"
                : failure === "missing"
                  ? "PROVIDER_UNCONFIGURED"
                  : failure === "stale"
                    ? "CONFLICT"
                    : "FORBIDDEN",
            message:
              failure === "quota"
                ? "Limit reached. Try again later."
                : failure === "missing"
                  ? "Gemini is not configured."
                  : "Refresh the brief and your access.",
            retryable: true,
          },
          requestId: "brainstorm-fixture",
        },
      });
    return route
      .fulfill({
        json: ok(
          failure === "plain"
            ? {
                ...result,
                reply: "Real provider plain text <script>window.evil=true</script>",
                format: "plain_text",
                directions: [],
              }
            : result,
        ),
      })
      .finally(() => {
        settled = true;
      });
  });
  return {
    posts,
    saves,
    settled: () => settled,
    hold: () => {
      let release!: () => void;
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => {
        gate = undefined;
        release();
      };
    },
    fail: (value: typeof failure) => {
      failure = value;
    },
  };
}
const send = (page: Page) => page.getByRole("button", { name: "Ask Gemini", exact: true }).click();
test("saved brief drives ephemeral ideas, quick prompts and explicit copy-to-notes save", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "Three campaign directions", exact: true }).click();
  await send(page);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toBeVisible();
  expect(service.posts).toEqual([
    { message: "Suggest three distinct campaign directions.", briefVersion: 1 },
  ]);
  await page
    .getByRole("region", { name: "Brainstorm with Gemini", exact: true })
    .screenshot({ path: test.info().outputPath("brainstorm-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole("region", { name: "Brainstorm with Gemini", exact: true })
    .screenshot({ path: test.info().outputPath("brainstorm-mobile.png") });
  await page.getByRole("button", { name: "Add Craft story to brief notes" }).click();
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(
    /Existing notes[\s\S]*Craft story/,
  );
  expect(service.saves).toHaveLength(0);
  await page.getByRole("button", { name: "Save brief", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("version: 2");
  expect(service.saves).toHaveLength(1);
  await page.reload();
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue(/Craft story/);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toHaveCount(0);
});
test("validation, no-key, quota and network failures preserve message with an explicit retry", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByLabel("Brainstorm message").fill(" ");
  await send(page);
  await expect(page.getByRole("alert")).toContainText("message");
  expect(service.posts).toHaveLength(0);
  await page.getByLabel("Brainstorm message").fill("Help with this campaign");
  for (const failure of ["missing", "quota", "network"] as const) {
    service.fail(failure);
    await send(page);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Brainstorm message")).toHaveValue("Help with this campaign");
    await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toHaveCount(0);
  }
  service.fail(undefined);
  await send(page);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toBeVisible();
});
test("plain fallback is labelled unstructured text and never executes commands or HTML", async ({
  page,
}) => {
  const service = await fixture(page);
  service.fail("plain");
  await page.goto(origin);
  await page.getByLabel("Brainstorm message").fill("Help");
  await send(page);
  await expect(page.getByText("Unstructured Gemini reply", { exact: true })).toBeVisible();
  await expect(page.getByText(/Real provider plain text/)).toContainText("<script>");
  expect(await page.evaluate(() => "evil" in window)).toBe(false);
  await expect(page.getByRole("button", { name: /Add .* to brief notes/ })).toHaveCount(0);
});
test("unsaved/readonly briefs cannot invoke brainstorming and access loss clears private state", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByLabel("Brainstorm message").fill("Help");
  await send(page);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toBeVisible();
  service.fail("denied");
  await send(page);
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toHaveCount(0);
});
test("a brief without a saved version shows an honest save prerequisite", async ({ page }) => {
  await fixture(page, { version: 0 });
  await page.goto(origin);
  await expect(
    page.getByText("Save a client brief to enable brainstorming.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Gemini", exact: true })).toBeDisabled();
});
test("read-only clients have no creative request panel", async ({ page }) => {
  const service = await fixture(page, { canEdit: false });
  await page.goto(origin);
  await expect(page.getByText("Approved brief summary for this project.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Gemini", exact: true })).toHaveCount(0);
  expect(service.posts).toHaveLength(0);
});

test("copy is explicit and appending cannot overwrite or overflow brief notes", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          (window as Window & { copied?: string }).copied = value;
        },
      },
    }),
  );
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByLabel("Notes", { exact: true }).fill("x".repeat(5000));
  await page.getByLabel("Brainstorm message").fill("Help");
  await send(page);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Copy Craft story", exact: true }).click();
  expect(await page.evaluate(() => (window as Window & { copied?: string }).copied)).toContain(
    "source brief v1",
  );
  await page.getByRole("button", { name: "Add Craft story to brief notes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("5000 characters");
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("x".repeat(5000));
  expect(service.saves).toHaveLength(0);
});

test("stale brief errors retain the message without showing the previous reply as new", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByLabel("Brainstorm message").fill("Keep my question");
  await send(page);
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toBeVisible();
  service.fail("stale");
  await send(page);
  await expect(page.getByRole("alert")).toContainText("Refresh");
  await expect(page.getByLabel("Brainstorm message")).toHaveValue("Keep my question");
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toHaveCount(0);
});

test("a late reply cannot reappear after saving a newer source brief", async ({ page }) => {
  const service = await fixture(page);
  const release = service.hold();
  await page.goto(origin);
  await page.getByLabel("Brainstorm message").fill("My question");
  await send(page);
  await expect.poll(() => service.posts.length).toBe(1);
  await page.getByLabel("Notes", { exact: true }).fill("A revised saved brief");
  await page.getByRole("button", { name: "Save brief", exact: true }).click();
  await expect(page.getByRole("status").first()).toContainText("version: 2");
  release();
  await expect.poll(() => service.settled()).toBe(true);
  await expect(page.getByRole("button", { name: "Ask Gemini", exact: true })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Craft story", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Brainstorm message")).toHaveValue("My question");
});
