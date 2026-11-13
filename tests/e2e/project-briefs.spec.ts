import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  SaveProjectBriefSchema,
  type ProjectBriefResult,
} from "../../apps/web/src/lib/contracts/project-briefs";

let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-project-brief-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Brief harness timeout: ${output}`));
    }, 25000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /BRIEF_HARNESS_READY (\d+)/.exec(output);
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
      reject(new Error(`Brief harness exited ${code}: ${output}`));
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

async function fixture(page: Page, readonly = false) {
  let saved: ProjectBriefResult = { brief: null, version: 0, savedAt: null, canEdit: !readonly };
  let failure: "network" | "conflict" | "denied" | "lost-response" | "unavailable" | undefined;
  const writes: ReturnType<typeof SaveProjectBriefSchema.parse>[] = [];
  const ok = (data: unknown) => ({ ok: true, data, requestId: "brief-fixture" });
  await page.route(`${origin}/api/v1/projects/*/brief`, async (route) => {
    if (failure === "denied")
      return route.fulfill({
        status: 403,
        json: {
          ok: false,
          error: { code: "FORBIDDEN", message: "Denied", retryable: false },
          requestId: "brief-fixture",
        },
      });
    if (route.request().method() === "GET") return route.fulfill({ json: ok(saved) });
    if (failure === "network") return route.abort("failed");
    if (failure === "conflict" || failure === "unavailable")
      return route.fulfill({
        status: failure === "conflict" ? 409 : 503,
        json: {
          ok: false,
          error: {
            code: failure === "conflict" ? "CONFLICT" : "SERVICE_UNAVAILABLE",
            message: "Brief service unavailable. Try again.",
            retryable: true,
          },
          requestId: "brief-fixture",
        },
      });
    const input = SaveProjectBriefSchema.parse(route.request().postDataJSON());
    writes.push(input);
    if (writes.filter((item) => item.idempotencyKey === input.idempotencyKey).length === 1)
      saved = {
        ...saved,
        brief: input.brief,
        version: saved.version + 1,
        savedAt: "2026-11-13T01:00:00.000Z",
      };
    if (failure === "lost-response") return route.abort("failed");
    return route.fulfill({ json: ok(saved) });
  });
  return {
    writes,
    saved: () => saved,
    fail: (value: typeof failure) => {
      failure = value;
    },
    downgrade: () => {
      saved = { brief: null, version: 0, savedAt: null, canEdit: false };
    },
    seed: (value: ProjectBriefResult) => {
      saved = value;
    },
    advance: () => {
      saved = {
        ...saved,
        version: saved.version + 1,
        brief: { ...saved.brief!, notes: "Another editor's notes" },
      };
    },
  };
}
async function fill(page: Page) {
  await expect(page.getByLabel("Brief title")).toBeEnabled();
  await page.getByLabel("Brief title").fill("Silk launch brief");
  await page.getByLabel("Audience", { exact: false }).fill("Design-conscious shoppers");
  await page.getByLabel("Brand / product").fill("Violet Silk");
  await page.getByLabel("Tone", { exact: false }).fill("Warm and clear");
  await page.getByLabel("Brand requirements").fill("Use approved logo");
  await page.getByLabel("Verified facts").fill("Handwoven\nMade in India");
  await page.getByLabel("Reference URLs").fill("https://example.com/reference");
  await page.getByLabel("Notes", { exact: true }).fill("Discuss with client");
  await page.getByLabel("Due date (optional)").fill("2026-12-01");
}
const save = (page: Page) => page.getByRole("button", { name: "Save brief", exact: true }).click();

test("brainstorm chooser anchor exists before delayed private brief data arrives", async ({ page }) => {
  await fixture(page);
  let release!: () => void, waiting = false;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`${origin}/api/v1/projects/*/brief`, async (route) => {
    waiting = true; await gate; await route.fallback().catch(() => undefined);
  });
  try {
    await page.goto(`${origin}/#brainstorm`);
    await expect.poll(() => waiting).toBe(true);
    await expect(page.locator("#brainstorm")).toBeAttached();
    release();
    await expect(page.getByLabel("Brief title")).toBeVisible();
    const anchor = await page.locator("#brainstorm").boundingBox();
    expect(anchor!.y).toBeLessThan(page.viewportSize()!.height);
  } finally { release(); }
});

test("brief saves rich fields, refreshes and reopens without losing data", async ({ page }) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  await expect(page.getByLabel("Goal / objectives")).toHaveValue("Launch this collection");
  await save(page);
  await expect(page.getByRole("status")).toContainText("Latest saved version: 1");
  const persisted = service.saved().brief;
  await page.reload();
  await expect(page.getByLabel("Brief title")).toHaveValue("Silk launch brief");
  await expect(page.getByLabel("Verified facts")).toHaveValue("Handwoven\nMade in India");
  await expect(page.getByLabel("Due date (optional)")).toHaveValue("2026-12-01");
  await page.getByRole("button", { name: "Refresh saved brief" }).click();
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("Discuss with client");
  expect(service.saved().brief).toEqual(persisted);
  expect(service.writes).toHaveLength(1);
  await page.screenshot({ path: test.info().outputPath("brief-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Brief title")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("brief-mobile.png"), fullPage: true });
});

test("invalid fields focus the error and do not write", async ({ page }) => {
  const service = await fixture(page);
  await page.goto(origin);
  await page.getByLabel("Brief title").fill("Draft");
  await save(page);
  await expect(page.getByRole("alert")).toContainText("highlighted");
  await expect(page.getByLabel("Audience", { exact: false })).toBeFocused();
  expect(service.writes).toHaveLength(0);
  await fill(page);
  await page.getByLabel("Reference URLs").fill("javascript:alert(1)");
  await save(page);
  await expect(page.getByLabel("Reference URLs")).toHaveAttribute("aria-invalid", "true");
  expect(service.writes).toHaveLength(0);
});

test("failed network and lost response preserve edits with an idempotent retry", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  service.fail("network");
  await save(page);
  await expect(page.getByRole("alert")).toContainText(/retry|try again/i);
  await expect(page.getByLabel("Brief title")).toHaveValue("Silk launch brief");
  service.fail("lost-response");
  await save(page);
  await expect(page.getByRole("alert")).toBeVisible();
  service.fail(undefined);
  await save(page);
  await expect(page.getByRole("status")).toContainText("Latest saved version: 1");
  expect(service.writes).toHaveLength(2);
  expect(service.writes[0]).toEqual(service.writes[1]);
});

test("stale writes keep local edits and compare latest before an explicit merge", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 1");
  service.advance();
  service.fail("conflict");
  await page.getByLabel("Notes", { exact: true }).fill("My unsaved notes");
  await save(page);
  await expect(page.getByRole("alert")).toContainText("edits are kept");
  await expect(page.getByRole("button", { name: "Save brief", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("My unsaved notes");
  await page.getByRole("button", { name: "Refresh saved brief" }).click();
  await expect(page.getByRole("complementary", { name: "Saved brief comparison" })).toContainText(
    "Another editor's notes",
  );
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("My unsaved notes");
  await page.getByRole("button", { name: "Keep my edits on version 2" }).click();
  service.fail(undefined);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 3");
  expect(service.writes.at(-1)?.expectedVersion).toBe(2);
  expect(service.saved().brief?.notes).toBe("My unsaved notes");
});

test("unsaved navigation warns and refresh never silently discards local fields", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(origin);
  await fill(page);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("link", { name: "Leave project" }).click();
  await expect(page.getByLabel("Brief title")).toHaveValue("Silk launch brief");
  await page.getByRole("button", { name: "Refresh saved brief" }).click();
  await expect(page.getByRole("button", { name: "Replace edits with saved brief" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Replace edits with saved brief" }).click();
  await expect(page.getByLabel("Brief title")).toHaveValue("Silk launch brief");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Replace edits with saved brief" }).click();
  await expect(page.getByLabel("Brief title")).toHaveValue("");
});

test("read-only and revoked access never leave editable private brief content", async ({
  page,
}) => {
  await fixture(page, true);
  await page.goto(origin);
  await expect(page.getByText("No approved brief is available yet.")).toBeVisible();
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
});

test("access loss clears loaded fields and failed initial load can recover", async ({ page }) => {
  const service = await fixture(page);
  service.fail("denied");
  await page.goto(origin);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
  service.fail(undefined);
  await page.reload();
  await fill(page);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 1");
  service.fail("denied");
  await page.getByRole("button", { name: "Refresh saved brief" }).click();
  await expect(page.getByRole("alert")).toContainText("authorized account");
  await expect(page.getByText("Silk launch brief")).toHaveCount(0);
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
});

test("editor downgrade discards private local draft and displays only approved content", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 1");
  await page.getByLabel("Notes", { exact: true }).fill("Private unsaved notes");
  service.downgrade();
  await page.getByRole("button", { name: "Refresh saved brief" }).click();
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
  await expect(page.getByText("No approved brief is available yet.")).toBeVisible();
  await expect(page.getByText("Private unsaved notes")).toHaveCount(0);
});

test("editing metadata preserves multiline legacy rich fields and fact identities", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 1");
  const initial = service.saved();
  service.seed({
    ...initial,
    brief: {
      ...initial.brief!,
      constraints: ["First line\nSecond line"],
      prohibitedClaims: ["No\nclaim"],
      facts: [{ id: "b2000000-0000-4000-8000-000000000005", text: "A fact\nwith detail" }],
    },
  });
  await page.reload();
  await expect(page.getByLabel("Verified facts")).toHaveValue("A fact\nwith detail");
  await page.getByLabel("Brief title").fill("Updated title");
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 2");
  expect(service.saved().brief?.facts).toEqual([
    { id: "b2000000-0000-4000-8000-000000000005", text: "A fact\nwith detail" },
  ]);
  expect(service.saved().brief?.constraints).toEqual(["First line\nSecond line"]);
  expect(service.saved().brief?.prohibitedClaims).toEqual(["No\nclaim"]);
});

test("combined UTF-8 size is validated locally and service failure supports recovery", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.goto(origin);
  await fill(page);
  await page.getByLabel("Notes", { exact: true }).fill("界".repeat(5000));
  await page.getByLabel("Brand requirements").fill("界".repeat(2000));
  await page
    .getByLabel("Constraints", { exact: true })
    .fill(Array(20).fill("界".repeat(300)).join("\n"));
  await save(page);
  await expect(page.getByRole("alert")).toContainText("32 KiB");
  expect(service.writes).toHaveLength(0);
  await page.getByLabel("Notes", { exact: true }).fill("Short notes");
  await page.getByLabel("Constraints", { exact: true }).fill("Short constraints");
  service.fail("unavailable");
  await save(page);
  await expect(page.getByRole("alert")).toContainText("Try again");
  await expect(page.getByLabel("Notes", { exact: true })).toHaveValue("Short notes");
  service.fail(undefined);
  await save(page);
  await expect(page.getByRole("status")).toContainText("version: 1");
});

test("an authorized client sees the approved brief summary without editing controls", async ({
  page,
}) => {
  const service = await fixture(page, true);
  service.seed({
    version: 3,
    canEdit: false,
    savedAt: "2026-11-13T01:00:00.000Z",
    brief: {
      schemaVersion: 1,
      title: "Approved campaign brief",
      objective: "Introduce the collection",
      audience: "Shoppers",
      product: "Silk",
      format: "poster",
      aspectRatio: "1:1",
      tone: "Warm",
      language: "en-IN",
      facts: [],
      prohibitedClaims: [],
      constraints: ["Approved logo only"],
    },
  });
  await page.goto(origin);
  await expect(page.getByRole("status")).toContainText("version: 3");
  await expect(page.getByText("Approved campaign brief", { exact: true })).toBeVisible();
  await expect(page.getByText("Approved logo only", { exact: true })).toBeVisible();
  await expect(page.getByRole("form", { name: "Edit client brief" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save brief", exact: true })).toHaveCount(0);
});
