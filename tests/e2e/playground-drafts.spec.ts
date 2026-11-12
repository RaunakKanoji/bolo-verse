import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import {
  createEmptyCreativeDraftDocument,
  SaveCreativeDraftSchema,
  type CreativeDraftSnapshot,
} from "../../apps/web/src/lib/contracts/shape";

let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-playground-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Prompt harness startup timed out. ${output}`));
    }, 25_000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /PLAYGROUND_HARNESS_READY (\d+)/.exec(output);
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
      reject(new Error(`Prompt harness exited (${code}). ${output}`));
    });
  });
});
test.afterAll(async () => {
  if (!harness || harness.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    harness!.once("exit", () => resolve());
    harness!.kill("SIGTERM");
  });
});

async function backend(page: Page, initialRead?: Promise<void>) {
  let saved: CreativeDraftSnapshot = {
    projectId: "e67ea056-e196-445c-8c9b-55b2058a5d58",
    revision: 0,
    document: createEmptyCreativeDraftDocument(),
    updatedAt: null,
    canEdit: true,
  };
  let failure: "conflict" | "unavailable" | undefined;
  const writes: ReturnType<typeof SaveCreativeDraftSchema.parse>[] = [];
  const ok = (data: unknown) => ({ ok: true, data, requestId: "prompt-fixture" });
  await page.route(`${origin}/api/v1/capabilities`, (route) =>
    route.fulfill({
      json: ok({
        schemaVersion: 1,
        modes: ["image", "video", "audio", "model3d"].map((id) => ({
          id,
          label: id,
          availability: "not_implemented",
          reason: "Generation is not connected in this fixture.",
          settings: [],
        })),
      }),
    }),
  );
  await page.route(`${origin}/api/v1/projects/*/creative-draft`, async (route) => {
    const projectId = new URL(route.request().url()).pathname.split("/")[4];
    if (projectId !== saved.projectId) {
      const document = createEmptyCreativeDraftDocument();
      document.prompts.video = "Read-only video direction";
      await route.fulfill({
        json: ok({ draft: { ...saved, projectId, revision: 0, document, canEdit: false } }),
      });
      return;
    }
    if (route.request().method() === "GET") {
      await initialRead;
      await route.fulfill({ json: ok({ draft: structuredClone(saved) }) });
      return;
    }
    if (failure) {
      await route.fulfill({
        status: failure === "conflict" ? 409 : 503,
        json: {
          ok: false,
          error: {
            code: failure === "conflict" ? "CONFLICT" : "UNAVAILABLE",
            message:
              failure === "conflict"
                ? "Another tab saved a newer prompt draft."
                : "The draft service is temporarily unavailable.",
            retryable: failure !== "conflict",
          },
          requestId: "prompt-fixture",
        },
      });
      return;
    }
    const body = SaveCreativeDraftSchema.parse(route.request().postDataJSON());
    writes.push(body);
    saved = {
      ...saved,
      revision: saved.revision + 1,
      document: body.document,
      updatedAt: new Date().toISOString(),
    };
    await route.fulfill({ json: ok({ draft: saved }) });
  });
  return {
    writes,
    fail: (value: typeof failure) => {
      failure = value;
    },
    saved: () => saved,
  };
}

test("prompt drafts preserve modes, save exact revisions and retain local text after failure/conflict", async ({
  page,
}) => {
  const service = await backend(page);
  await page.goto(origin);
  const prompt = page.getByRole("textbox", { name: "Image prompt", exact: true });
  await expect(prompt).toBeEnabled();
  await prompt.fill("A quiet botanical campaign");
  await page.getByRole("button", { name: "Video", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Video prompt", exact: true })
    .fill("Slow camera movement");
  await page.getByRole("button", { name: "Image", exact: true }).click();
  await expect(prompt).toHaveValue("A quiet botanical campaign");
  await expect(page.getByRole("button", { name: "Generate image", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Save prompt draft", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Prompt draft saved · revision 1");
  expect(service.writes).toHaveLength(1);
  expect(service.writes[0].expectedRevision).toBe(0);
  expect(service.saved().document.prompts.video).toBe("Slow camera movement");
  service.fail("unavailable");
  await prompt.fill("Keep this local revision");
  await page.getByRole("button", { name: "Save prompt draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  await expect(prompt).toHaveValue("Keep this local revision");
  service.fail("conflict");
  await page.getByRole("button", { name: "Save prompt draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your text has been kept here");
  await expect(prompt).toHaveValue("Keep this local revision");
  await expect(page.getByRole("button", { name: "Save prompt draft", exact: true })).toBeDisabled();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Reload saved draft", exact: true }).click();
  await expect(prompt).toHaveValue("Keep this local revision");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reload saved draft", exact: true }).click();
  await expect(prompt).toHaveValue("A quiet botanical campaign");
  expect(service.writes).toHaveLength(1);
});

test("changing project scope clears private prompts and enforces read-only controls", async ({
  page,
}) => {
  await backend(page);
  await page.goto(origin);
  const prompt = page.getByRole("textbox", { name: "Image prompt", exact: true });
  await expect(prompt).toBeEnabled();
  await prompt.fill("Private draft from the first fixture");
  await page.getByRole("button", { name: "Open other fixture project", exact: true }).click();
  await expect(prompt).toHaveValue("");
  await expect(prompt).toBeDisabled();
  await expect(page.getByText("View-only project access.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save prompt draft", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Video", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Video prompt", exact: true })).toHaveValue(
    "Read-only video direction",
  );
  await expect(page.getByRole("textbox", { name: "Video prompt", exact: true })).toBeDisabled();
  await expect(page.getByText("Unsaved prompt changes", { exact: true })).toHaveCount(0);
});

test("StrictMode replay does not expose an editable draft while its initial read is pending", async ({
  page,
}) => {
  let release!: () => void;
  const read = new Promise<void>((resolve) => {
    release = resolve;
  });
  await backend(page, read);
  await page.goto(origin);
  await expect(page.getByRole("button", { name: "Please wait…", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toBeDisabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
  release();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toBeEnabled();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
