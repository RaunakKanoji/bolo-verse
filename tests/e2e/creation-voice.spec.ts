import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { instrumentVoice, waitForVoiceData } from "../helpers/voice-browser";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-creation-voice-harness.mjs"], {
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
      const match = /CREATION_VOICE_HARNESS_READY (\d+)/.exec(output);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    harness!.once("error", reject);
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
const id = "e67ea056-e196-445c-8c9b-55b2058a5d58",
  foreign = "a046df5a-e5e4-4727-a191-2266e031bba9",
  timestamp = "2026-11-13T00:00:00.000Z";
const project = {
  id,
  name: "Launch",
  objective: "Craft launch",
  clientId: null,
  clientName: null,
  type: "Video Production",
  status: "active",
  priority: "normal",
  startDate: null,
  dueDate: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  revision: 1,
  progress: null,
  canEdit: true,
};
const snapshot = {
  projectId: id,
  revision: 2,
  updatedAt: timestamp,
  canEdit: true,
  document: {
    schemaVersion: 1,
    mode: "image",
    prompts: {
      image: "Keep image prompt",
      video: "",
      audio: "Keep audio prompt",
      model3d: "Keep model prompt",
    },
  },
};
const reply = (data: unknown) => ({ ok: true, data, requestId: "creation-voice-http-fixture" });
async function fixtures(page: Page, speech = "Add text: Spoken product details") {
  let aiCalls = 0;
  const puts: unknown[] = [];
  let current = structuredClone(snapshot);
  let session: {
    id: string;
    projectId: string;
    revision: number;
    title: string;
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
  } | null = null;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname;
    if (path === `/api/v1/workspace/projects/${id}`)
      return route.fulfill({ json: reply({ project, canEdit: true, tasks: [], activity: [] }) });
    if (path.includes("/creative-draft")) {
      if (request.method() === "PUT") {
        const input = request.postDataJSON();
        puts.push(input);
        if (input.expectedRevision !== current.revision)
          return route.fulfill({
            status: 409,
            json: {
              ok: false,
              error: { code: "CONFLICT", message: "Draft changed", retryable: false },
              requestId: "fixture",
            },
          });
        current = { ...current, revision: current.revision + 1, document: input.document };
      }
      return route.fulfill({ json: reply({ draft: current }) });
    }
    if (path === "/api/v1/brainstorm/sessions") {
      const input = request.postDataJSON();
      session = {
        id: input.idempotencyKey,
        projectId: input.projectId,
        revision: 0,
        title: input.title,
        pinned: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return route.fulfill({ json: reply({ session }) });
    }
    if (path.endsWith("/transcribe"))
      return route.fulfill({
        json: reply({ text: speech, language: "en-IN", mode: "live" }),
      });
    if (path.endsWith("/messages")) {
      aiCalls++;
      const input = request.postDataJSON();
      session!.revision += 2;
      return route.fulfill({
        json: reply({
          session,
          message: {
            id: input.idempotencyKey,
            sessionId: session!.id,
            message: input.message,
            status: "completed",
            createdAt: timestamp,
            content: {
              reply: "Crafted with care, made for your everyday.",
              concepts: [
                {
                  title: "Craft",
                  targetAudience: "Shoppers",
                  coreMessage: "Care",
                  contentFormat: "Caption",
                  creativeDirection: "Warm",
                  productionRequirements: [],
                  nextSteps: [],
                },
              ],
            },
          },
        }),
      });
    }
    if (path.includes("/brainstorm/sessions/"))
      return route.fulfill({ json: reply({ session, messages: [], ideas: [] }) });
    if (path === "/api/v1/workspace/assets")
      return route.fulfill({ json: reply({ assets: [], total: 0 }) });
    return route.fulfill({
      status: 503,
      json: {
        ok: false,
        error: {
          code: "PROVIDER_UNCONFIGURED",
          message: "Fixture integration unavailable",
          retryable: true,
        },
        requestId: "fixture",
      },
    });
  });
  return { aiCalls: () => aiCalls, puts: () => puts };
}
async function propose(page: Page, text: string) {
  await page.getByLabel("Creation command", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Propose action", exact: true }).click();
}
async function apply(page: Page) {
  await page.getByRole("button", { name: "Apply proposed action", exact: true }).click();
}
test("synthetic microphone plus fixture STT opens the actual storyboard panel only after reviewed Apply", async ({
  page,
}) => {
  await instrumentVoice(page);
  await fixtures(page, "Open the storyboard.");
  await page.route("**/api/projects/*/artifacts", (route) =>
    route.fulfill({
      json: reply({ versions: [], briefs: [], ideas: [], generation: "unavailable" }),
    }),
  );
  await page.goto(origin);
  await page.getByLabel("I agree to send a short recording", { exact: false }).check();
  await page.getByRole("button", { name: "Record creation command", exact: true }).click();
  await waitForVoiceData(page);
  await page.getByRole("button", { name: "Stop creation recording", exact: true }).click();
  await expect(page.getByLabel("Creation command", { exact: true })).toHaveValue(
    "Open the storyboard.",
  );
  expect(page.url()).toBe(origin + "/");
  await page.getByRole("button", { name: "Propose action", exact: true }).click();
  await expect(page.getByRole("region", { name: "Proposed creation action" })).toContainText(
    "saved text storyboard panel",
  );
  await apply(page);
  await expect(page).toHaveURL(`${origin}/projects/${id}?tab=storyboard`);
  await expect(page.getByRole("button", { name: "Storyboard", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("heading", { name: "Text storyboard", exact: true })).toBeVisible();
  await page.getByLabel("Scene 1 description", {exact: true}).fill("Unsaved scene");
  await page.getByRole("button", {name: "Storyboard", exact: true}).click();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", {name: "Production", exact: true}).click();
  await expect(page.getByRole("button", {name: "Storyboard", exact: true})).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Scene 1 description", {exact: true})).toHaveValue("Unsaved scene");
});
test("typed creation actions require a fresh proposal and save real CAS video notes without changing other modes", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto(origin);
  await propose(page, "Add text: A warm craft launch");
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
  await apply(page);
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "A warm craft launch",
  );
  await propose(page, "Change duration to 15 seconds");
  await page.getByLabel("Creation command", { exact: true }).fill("Change duration to 60 seconds");
  await expect(
    page.getByRole("button", { name: "Apply proposed action", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Propose action", exact: true }).click();
  await apply(page);
  await expect(page.getByLabel("Planning duration target (seconds)", { exact: true })).toHaveValue(
    "60",
  );
  await propose(page, "Save draft");
  expect(state.puts()).toHaveLength(0);
  await apply(page);
  await expect(
    page.getByText("Saved private video draft · revision 3", { exact: true }),
  ).toBeVisible();
  expect(state.puts()).toEqual([
    {
      expectedRevision: 2,
      document: {
        schemaVersion: 1,
        mode: "video",
        prompts: {
          image: "Keep image prompt",
          video:
            "A warm craft launch\n\n[Production planning target: 60 seconds; media timing unchanged]",
          audio: "Keep audio prompt",
          model3d: "Keep model prompt",
        },
      },
    },
  ]);
});
test("recording yields an editable transcript without action execution; Gemini text is used only after explicit Apply and review", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto(origin);
  await page.getByLabel("I agree to send a short recording", { exact: false }).check();
  await page.getByRole("button", { name: "Record creation command", exact: true }).click();
  await page.getByRole("button", { name: "Stop creation recording", exact: true }).click();
  await expect(page.getByLabel("Creation command", { exact: true })).toHaveValue(
    "Add text: Spoken product details",
  );
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Propose action", exact: true }).click();
  await apply(page);
  await propose(page, "Generate caption");
  expect(state.aiCalls()).toBe(0);
  await apply(page);
  await expect(
    page.getByRole("heading", { name: "AI caption suggestion", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Spoken product details",
  );
  expect(state.aiCalls()).toBe(1);
  await page.getByRole("button", { name: "Use caption in local draft", exact: true }).click();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Crafted with care, made for your everyday.",
  );
});
test("unknown commands and foreign assets never navigate; missing projects retain editable local notes", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(origin);
  await propose(page, "Open https://evil.test");
  await expect(page.getByRole("alert")).toContainText("supported phrase");
  await expect(
    page.getByRole("button", { name: "Apply proposed action", exact: true }),
  ).toHaveCount(0);
  await propose(page, `Open asset ${foreign}`);
  await apply(page);
  await expect(page.getByRole("alert")).toContainText(
    "not available in the selected editable project",
  );
  expect(page.url()).toBe(origin + "/");
  await page.getByRole("button", { name: "Remove fixture project", exact: true }).click();
  await page
    .getByLabel("Production notes", { exact: true })
    .fill("Local draft survives network failure");
  await propose(page, "Save draft");
  await apply(page);
  await expect(page.getByRole("alert")).toContainText("Choose an editable project");
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Local draft survives network failure",
  );
});
test("review actions confirm workflow navigation and never claim a submitted review", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(origin);
  await propose(page, "Submit for review");
  await apply(page);
  await expect(
    page.getByRole("dialog", { name: "Open review submission workflow?", exact: true }),
  ).toBeVisible();
  expect(page.url()).toBe(origin + "/");
  await page.getByRole("button", { name: "Open Deliverables for review", exact: true }).click();
  await expect(page).toHaveURL(`${origin}/projects/${id}?tab=deliverables`);
});

test("navigating to Spatial Studio retains unsaved notes when the user cancels", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(origin);
  await page
    .getByLabel("Production notes", { exact: true })
    .fill("Keep this unsaved production plan");
  await propose(page, "Create scene");
  const dialog = page.waitForEvent("dialog", { timeout: 5000 });
  await apply(page);
  const confirmation = await dialog;
  await confirmation.dismiss();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Keep this unsaved production plan",
  );
  expect(page.url()).toBe(origin + "/");
});

test("loading saved video notes requires a reviewable replacement and Cancel keeps local notes", async ({
  page,
}) => {
  await fixtures(page);
  await page.route(`**/api/v1/projects/${id}/creative-draft`, (route) =>
    route.fulfill({
      json: reply({
        draft: {
          ...snapshot,
          document: {
            ...snapshot.document,
            prompts: { ...snapshot.document.prompts, video: "Previously saved production plan" },
          },
        },
      }),
    }),
  );
  await page.goto(origin);
  await page.getByLabel("Production notes", { exact: true }).fill("Keep my unsaved local plan");
  await page.getByRole("button", { name: "Load saved video draft", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Replace local production notes?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keep local notes", exact: true }).click();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Keep my unsaved local plan",
  );
  await page.getByRole("button", { name: "Load saved video draft", exact: true }).click();
  await page.getByRole("button", { name: "Confirm loading saved draft", exact: true }).click();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Previously saved production plan",
  );
});

test("ambiguous caption errors retain notes and reuse the same durable attempt key", async ({
  page,
}) => {
  await fixtures(page);
  const keys: string[] = [];
  await page.route("**/api/v1/brainstorm/sessions/*/messages", (route) => {
    keys.push(route.request().postDataJSON().idempotencyKey);
    return route.fulfill({
      status: 503,
      json: {
        ok: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The AI attempt could not be confirmed",
          retryable: true,
        },
        requestId: "fixture",
      },
    });
  });
  await page.goto(origin);
  await page
    .getByLabel("Production notes", { exact: true })
    .fill("Keep these notes after an ambiguous provider error");
  await propose(page, "Generate caption");
  await apply(page);
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
  await apply(page);
  await expect(
    page.getByRole("button", { name: "Apply proposed action", exact: true }),
  ).toBeEnabled();
  expect(keys).toHaveLength(2);
  expect(new Set(keys).size).toBe(1);
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Keep these notes after an ambiguous provider error",
  );
  await expect(
    page.getByRole("heading", { name: "AI caption suggestion", exact: true }),
  ).toHaveCount(0);
});

test("changing identity aborts a late private caption and clears the previous draft", async ({
  page,
}) => {
  await fixtures(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started: () => void = () => {};
  const begun = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route("**/api/v1/brainstorm/sessions/*/messages", async (route) => {
    const input = route.request().postDataJSON(),
      sessionId = new URL(route.request().url()).pathname.split("/")[5];
    started();
    await gate;
    await route
      .fulfill({
        json: reply({
          session: {
            id: sessionId,
            title: "Creation production notes",
            projectId: id,
            pinned: false,
            revision: 2,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          message: {
            id: input.idempotencyKey,
            sessionId,
            message: input.message,
            status: "completed",
            createdAt: timestamp,
            content: {
              reply: "Late private caption from former identity",
              concepts: [
                {
                  title: "Craft",
                  targetAudience: "Shoppers",
                  coreMessage: "Care",
                  contentFormat: "Caption",
                  creativeDirection: "Warm",
                  productionRequirements: [],
                  nextSteps: [],
                },
              ],
            },
          },
        }),
      })
      .catch(() => undefined);
  });
  await page.goto(origin);
  await page
    .getByLabel("Production notes", { exact: true })
    .fill("Private notes from former identity");
  await propose(page, "Generate caption");
  await apply(page);
  await begun;
  await page.getByRole("button", { name: "Switch fixture identity", exact: true }).click();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
  release();
  await expect(
    page.getByText("Late private caption from former identity", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "AI caption suggestion", exact: true }),
  ).toHaveCount(0);
});

test("a read-only success response revokes the editor context and clears prior private caption and notes", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(origin);
  await page.getByLabel("Production notes", { exact: true }).fill("Previously editable notes");
  await propose(page, "Generate caption");
  await apply(page);
  await expect(
    page.getByRole("heading", { name: "AI caption suggestion", exact: true }),
  ).toBeVisible();
  await page.route(`**/api/v1/projects/${id}/creative-draft`, (route) =>
    route.fulfill({ json: reply({ draft: { ...snapshot, canEdit: false } }) }),
  );
  await page.getByRole("button", { name: "Load saved video draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("access changed");
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Creation command", { exact: true })).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "AI caption suggestion", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Apply proposed action", exact: true }),
  ).toHaveCount(0);
});

test("open asset navigates only after the authorized response matches both the asset and selected project", async ({
  page,
}) => {
  await fixtures(page);
  await page.route("**/api/v1/workspace/assets?**", (route) =>
    route.fulfill({
      json: reply({
        total: 1,
        assets: [
          {
            id: foreign,
            projectId: id,
            projectName: "Launch",
            name: "Private image",
            mimeType: "image/png",
            category: "image",
            byteSize: 8,
            width: null,
            height: null,
            createdAt: timestamp,
            contentUrl: `/api/v1/assets/${foreign}/content`,
            downloadUrl: `/api/v1/workspace/assets/${foreign}/download`,
            nativeContentUrl: null,
            collection: "",
            archived: false,
            revision: 0,
            canEdit: true,
          },
        ],
      }),
    }),
  );
  await page.goto(origin);
  await propose(page, `Open asset ${foreign}`);
  expect(page.url()).toBe(origin + "/");
  await apply(page);
  await expect(page).toHaveURL(`${origin}/app/projects/${id}/assets/${foreign}`);
});

test("deleting all saved production text remains dirty and guards navigation", async ({ page }) => {
  await fixtures(page);
  await page.route(`**/api/v1/projects/${id}/creative-draft`, (route) =>
    route.fulfill({
      json: reply({
        draft: {
          ...snapshot,
          document: {
            ...snapshot.document,
            prompts: { ...snapshot.document.prompts, video: "Saved baseline production notes" },
          },
        },
      }),
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "Load saved video draft", exact: true }).click();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Saved baseline production notes",
  );
  await page.getByLabel("Production notes", { exact: true }).fill("");
  await propose(page, "Create scene");
  const dialog = page.waitForEvent("dialog", { timeout: 5000 });
  await apply(page);
  await (await dialog).dismiss();
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
  expect(page.url()).toBe(origin + "/");
});

test("accepted full-document Spatial navigation asks once before discarding local notes", async ({
  page,
}) => {
  await fixtures(page);
  await page.goto(origin);
  await page
    .getByLabel("Production notes", { exact: true })
    .fill("Local plan before entering Spatial Studio");
  await propose(page, "Create scene");
  let dialogs = 0;
  page.on("dialog", (dialog) => {
    dialogs++;
    void dialog.accept();
  });
  await apply(page);
  await expect(page).toHaveURL(`${origin}/workspace/${id}`);
  expect(dialogs).toBe(1);
});
