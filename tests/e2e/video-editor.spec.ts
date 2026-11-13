import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-video-editor-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(output));
    }, 90000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /VIDEO_EDITOR_HARNESS_READY (\d+)/.exec(output);
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
const projectId = "e67ea056-e196-445c-8c9b-55b2058a5d58",
  assetId = "a046df5a-e5e4-4727-a191-2266e031bba9",
  jobId = "65e9a873-d8a9-4914-9b2b-6396df71e42f",
  timestamp = "2026-11-13T00:00:00.000Z";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAASCAIAAAC1qksFAAAAH0lEQVR4nGMo8NhHU8QwasGoBaMWjFowasGoBfSwAACk7Umu4FdDvQAAAABJRU5ErkJggg==",
  "base64",
);
const asset = {
  id: assetId,
  projectId,
  mimeType: "image/png",
  byteSize: png.length,
  width: 32,
  height: 18,
  durationSeconds: null,
  createdAt: timestamp,
  nativeContentUrl: null,
  contentUrl: `/api/v1/assets/${assetId}/content`,
};
const project = {
  id: projectId,
  name: "Fixture private video",
  objective: "Video fixture",
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
const capabilities = {
  availability: "configured",
  reason: null,
  environment: "sandbox",
  maxDurationSeconds: 60,
  maxClips: 50,
  outputMimeType: "video/mp4",
};
const reply = (data: unknown) => ({ ok: true, data, requestId: "video-http-fixture" });
async function fixtures(page: Page, withVideo = false) {
  const webm = withVideo
    ? Buffer.from(
        await page.evaluate(async () => {
          const canvas = document.createElement("canvas");
          canvas.width = 32;
          canvas.height = 18;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#aa55ff";
          ctx.fillRect(0, 0, 32, 18);
          const stream = canvas.captureStream(10),
            recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
          const chunks: Blob[] = [];
          recorder.ondataavailable = (event) => chunks.push(event.data);
          const result = new Promise<number[]>((resolve) => {
            recorder.onstop = () =>
              void new Blob(chunks, { type: "video/webm" })
                .arrayBuffer()
                .then((bytes) => resolve(Array.from(new Uint8Array(bytes))));
          });
          recorder.start();
          await new Promise((resolve) => setTimeout(resolve, 1200));
          recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          return result;
        }),
      )
    : null;
  const videoId = "7ce02134-dd74-49c5-b3d7-85c36a44fb03";
  const videoAsset = webm
    ? {
        ...asset,
        id: videoId,
        mimeType: "video/webm",
        byteSize: webm.length,
        contentUrl: `/api/v1/assets/${videoId}/content`,
      }
    : null;
  let draft = {
    projectId,
    revision: 0,
    document: null as unknown,
    updatedAt: null as string | null,
    canEdit: true,
  };
  const puts: unknown[] = [],
    renders: Record<string, unknown>[] = [];
  let jobs: unknown[] = [];
  let conflict = false,
    deny = false,
    ambiguous = false;
  await page.addInitScript(() => {
    const originalCreate = URL.createObjectURL.bind(URL),
      originalRevoke = URL.revokeObjectURL.bind(URL),
      owned = new Set<string>();
    URL.createObjectURL = (blob: Blob) => {
      const url = originalCreate(blob);
      if (["image/png", "image/jpeg", "image/webp", "video/webm", "video/mp4"].includes(blob.type))
        owned.add(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => {
      owned.delete(url);
      originalRevoke(url);
    };
    Object.defineProperty(window, "fixtureOwnedVideoUrls", { get: () => owned.size });
  });
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (deny)
      return route.fulfill({
        status: 403,
        json: {
          ok: false,
          error: { code: "FORBIDDEN", message: "Project access changed", retryable: false },
          requestId: "fixture",
        },
      });
    if (path === "/api/v1/workspace/projects")
      return route.fulfill({ json: reply({ projects: [project], total: 1 }) });
    if (path === `/api/v1/projects/${projectId}/assets`)
      return route.fulfill({
        json: reply({ assets: videoAsset ? [asset, videoAsset] : [asset], hasMore: false }),
      });
    if (videoAsset && path === videoAsset.contentUrl)
      return route.fulfill({ contentType: "video/webm", body: webm! });
    if (path === asset.contentUrl) return route.fulfill({ contentType: "image/png", body: png });
    if (path === `/api/v1/projects/${projectId}/video-editor`) {
      if (request.method() === "PUT") {
        const input = request.postDataJSON();
        puts.push(input);
        if (conflict)
          return route.fulfill({
            status: 409,
            json: {
              ok: false,
              error: {
                code: "CONFLICT",
                message: "Draft changed. Reload before saving.",
                retryable: false,
              },
              requestId: "fixture",
            },
          });
        expect(input.expectedRevision).toBe(draft.revision);
        draft = {
          ...draft,
          revision: draft.revision + 1,
          document: input.document,
          updatedAt: timestamp,
        };
      }
      return route.fulfill({ json: reply({ draft, capabilities }) });
    }
    if (path.endsWith("/renders")) {
      if (request.method() === "POST") {
        const input = request.postDataJSON();
        renders.push(input);
        if (ambiguous)
          return route.fulfill({
            status: 503,
            json: {
              ok: false,
              error: {
                code: "SERVICE_UNAVAILABLE",
                message: "Render attempt could not be confirmed",
                retryable: true,
              },
              requestId: "fixture",
            },
          });
        const job = {
          id: jobId,
          projectId,
          draftRevision: draft.revision,
          status: "queued",
          environment: "sandbox",
          failureCode: null,
          errorMessage: null,
          outputAsset: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        jobs = [job];
        return route.fulfill({ json: reply({ job }) });
      }
      return route.fulfill({ json: reply({ jobs }) });
    }
    return route.fulfill({
      status: 404,
      json: {
        ok: false,
        error: { code: "NOT_FOUND", message: "No fixture", retryable: false },
        requestId: "fixture",
      },
    });
  });
  return {
    puts,
    renders,
    conflict: () => {
      conflict = true;
    },
    deny: () => {
      deny = true;
    },
    ambiguous: () => {
      ambiguous = true;
    },
  };
}
async function readyClip(page: Page) {
  await page.getByRole("button", { name: `Add source ${assetId}`, exact: true }).click();
  await expect(page.getByText("Shotstack Studio ready", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  await expect(page.locator("[data-shotstack-studio] canvas")).toHaveCount(1);
}
test("actual SDK canvas/timeline, bounded controls and asset-ID CAS save never dispatch an implicit render", async ({
  page,
}) => {
  const state = await fixtures(page, true);
  await page.goto(origin);
  await readyClip(page);
  await page.getByLabel("Clip 1 duration", { exact: true }).fill("4");
  await page
    .getByRole("button", { name: "Add source 7ce02134-dd74-49c5-b3d7-85c36a44fb03", exact: true })
    .click();
  await page.getByLabel("Clip 2 duration", { exact: true }).fill("0.5");
  await page.getByLabel("Clip 2 trim", { exact: true }).fill("0.1");
  await page.getByLabel("Clip 2 volume", { exact: true }).fill("0.4");
  await page.getByRole("button", { name: "Add caption", exact: true }).click();
  await page.getByLabel("Text 1", { exact: true }).fill("Private caption");
  await expect(page.getByText("Shotstack Studio ready", { exact: true })).toBeVisible({
    timeout: 45000,
  });
  await expect(page.locator("[data-shotstack-timeline] .ss-clip--error")).toHaveCount(0);
  await page.screenshot({ path: "/private/tmp/shape-video-editor-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Play preview", exact: true }).click();
  await page.getByRole("button", { name: "Pause preview", exact: true }).click();
  await page.getByRole("button", { name: "Save video draft", exact: true }).click();
  await expect(
    page.getByText("Saved private video draft · revision 1", { exact: false }),
  ).toBeVisible();
  expect(state.puts).toHaveLength(1);
  expect(JSON.stringify(state.puts)).toContain(assetId);
  expect(JSON.stringify(state.puts)).not.toContain("blob:");
  expect(JSON.stringify(state.puts)).not.toContain("http");
  expect(state.renders).toHaveLength(0);
  await page.getByRole("button", { name: "Reload saved edit", exact: true }).click();
  await expect(page.getByLabel("Text 1", { exact: true })).toHaveValue("Private caption");
  await expect(page.locator("[data-shotstack-timeline] .ss-clip").first()).toBeVisible();
});
test("render confirmation discloses transfer/environment and ambiguous retries retain a stable request key", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto(origin);
  await readyClip(page);
  await page.getByRole("button", { name: "Save video draft", exact: true }).click();
  await expect(page.getByRole("button", { name: "Render video", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Render video", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Render with Shotstack?", exact: true });
  await expect(dialog).toContainText("sandbox");
  await expect(dialog).toContainText("charges");
  expect(state.renders).toHaveLength(0);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(state.renders).toHaveLength(0);
  state.ambiguous();
  await page.getByRole("button", { name: "Render video", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm Shotstack render", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be confirmed");
  await dialog.getByRole("button", { name: "Confirm Shotstack render", exact: true }).click();
  expect(state.renders).toHaveLength(2);
  expect(state.renders[0].idempotencyKey).toBe(state.renders[1].idempotencyKey);
  expect(state.renders[0].consent).toBe("shotstack-render-v1");
});
test("CAS conflicts retain the edit, dirty navigation cancels, and denied reload clears private resources", async ({
  page,
}) => {
  const state = await fixtures(page);
  await page.goto(origin);
  await readyClip(page);
  state.conflict();
  await page.getByRole("button", { name: "Save video draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Draft changed");
  await expect(page.getByLabel("Clip 1 duration", { exact: true })).toHaveValue("5");
  page.once("dialog", (dialog) => void dialog.dismiss());
  await page.getByRole("link", { name: "Leave editor fixture", exact: true }).click();
  expect(page.url()).toBe(`${origin}/`);
  state.deny();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Reload saved edit", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("access changed");
  await expect(page.getByLabel("Clip 1 duration", { exact: true })).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "fixtureOwnedVideoUrls")))
    .toBe(0);
  await expect(page.locator("[data-shotstack-studio] canvas")).toHaveCount(0);
});
test("StrictMode remount and identity change release owned sources without duplicate canvases, including narrow viewports", async ({
  page,
}) => {
  await fixtures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin);
  await readyClip(page);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.getByRole("button", { name: "Toggle video editor", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "fixtureOwnedVideoUrls")))
    .toBe(0);
  await page.getByRole("button", { name: "Toggle video editor", exact: true }).click();
  await readyClip(page);
  await page.getByRole("button", { name: "Switch fixture identity", exact: true }).click();
  await expect(page.getByLabel("Clip 1 duration", { exact: true })).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "fixtureOwnedVideoUrls")))
    .toBe(0);
});
