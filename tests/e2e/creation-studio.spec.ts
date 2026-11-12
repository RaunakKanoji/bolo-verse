import { expect, test } from "@playwright/test";

test("creation route aliases preserve the working local canvas and honest public generation state", async ({
  page,
}) => {
  for (const route of ["/create", "/studio/image"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: "Make it your own." })).toBeVisible();
    await expect(page.getByRole("img", { name: "Image adjustment preview" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Generate image", exact: true })).toBeDisabled();
  }
});

import { spawn, type ChildProcess } from "node:child_process";
let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-creation-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Creation harness timed out: ${output}`)),
      25_000,
    );
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /CREATION_HARNESS_READY (\d+)/.exec(output);
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
    harness!.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Creation harness exited ${code}: ${output}`));
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
const projectId = "e67ea056-e196-445c-8c9b-55b2058a5d58";
const jobId = "d046df5a-e5e4-4727-a191-2266e031bba9";
const assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
const date = "2026-11-12T10:00:00.000Z";
const ok = (data: unknown) => ({ ok: true, data, requestId: "creation-browser-fixture" });
async function fixtureApi(page: import("@playwright/test").Page) {
  await page.route(`${origin}/studio/campaign-studies.png`, (route) =>
    route.fulfill({
      path: "apps/web/public/studio/campaign-studies.png",
      contentType: "image/png",
    }),
  );
  let status = "queued";
  let rejectNext = false;
  let revoked = false;
  let historyReads = 0;
  const submissions: Record<string, unknown>[] = [];
  const job = () => ({
    id: jobId,
    projectId,
    status,
    prompt: "A violet glass bottle",
    modelId: "gemini-2.5-flash-image",
    aspectRatio: "4:5",
    referenceAssetId: null,
    outputAssetId: status === "ready" ? assetId : null,
    errorCode: null,
    errorMessage: null,
    createdAt: date,
    updatedAt: date,
  });
  await page.route(`${origin}/api/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/v1/creation/capabilities")
      return route.fulfill({
        json: ok({
          availability: "configured",
          reason: "Deterministic fixture only; no provider calls.",
          models: [
            {
              id: "gemini-2.5-flash-image",
              label: "Fixture image",
              aspectRatios: ["1:1", "16:9", "4:5", "9:16"],
              referenceImage: true,
            },
          ],
          maxReferenceBytes: 10 * 1024 * 1024,
          maxPromptCharacters: 4000,
        }),
      });
    if (path === "/api/v1/capabilities")
      return route.fulfill({
        json: ok({
          schemaVersion: 1,
          modes: ["image", "video", "audio", "model3d"].map((id) => ({
            id,
            label: id,
            availability: "not_implemented",
            reason: "V1 legacy catalog.",
            settings: [],
          })),
        }),
      });
    if (path.endsWith("/creative-draft"))
      return route.fulfill({
        json: ok({
          draft: {
            projectId: path.split("/")[4],
            revision: 0,
            document: {
              schemaVersion: 1,
              mode: "image",
              prompts: { image: "", video: "", audio: "", model3d: "" },
            },
            updatedAt: null,
            canEdit: true,
          },
        }),
      });
    if (path === "/api/v1/generations") {
      submissions.push(route.request().postDataJSON());
      if (rejectNext) {
        rejectNext = false;
        return route.fulfill({
          status: 503,
          json: {
            ok: false,
            error: {
              code: "UNAVAILABLE",
              message: "Fixture transport interrupted. Refresh history before retrying.",
              retryable: true,
            },
            requestId: "fixture",
          },
        });
      }
      return route.fulfill({ status: 202, json: ok({ job: job() }) });
    }
    if (path.endsWith("/generations")) {
      historyReads++;
      if (revoked)
        return route.fulfill({
          status: 403,
          json: {
            ok: false,
            error: { code: "FORBIDDEN", message: "Project access was revoked.", retryable: false },
            requestId: "fixture",
          },
        });
      return route.fulfill({
        json: ok({ jobs: path.includes(projectId) && submissions.length ? [job()] : [] }),
      });
    }
    if (path.endsWith("/cancel")) {
      status = "cancelled";
      return route.fulfill({ json: ok({ job: job() }) });
    }
    if (path.endsWith("/assets"))
      return route.fulfill({ json: ok({ assets: [], hasMore: false }) });
    if (path === `/api/xr/assets/${assetId}` || path === `/api/v1/assets/${assetId}/content`)
      return route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
          "base64",
        ),
      });
    return route.fulfill({
      status: 404,
      json: {
        ok: false,
        error: { code: "NOT_FOUND", message: "Fixture route not found", retryable: false },
        requestId: "fixture",
      },
    });
  });
  return {
    submissions,
    revokeHistory: () => {
      revoked = true;
    },
    historyReads: () => historyReads,
    rejectNext: () => {
      rejectNext = true;
    },
    ready: () => {
      status = "ready";
    },
  };
}
test("project image generation uses durable jobs, polls real status and selects a decoded private result", async ({
  page,
}, testInfo) => {
  const api = await fixtureApi(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("A violet glass bottle");
  await page.getByLabel("Image aspect ratio", { exact: true }).selectOption("4:5");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect(page.getByRole("region", { name: "Generation history", exact: true })).toContainText(
    "Queued",
  );
  expect(api.submissions).toHaveLength(1);
  expect(api.submissions[0]).toMatchObject({
    projectId,
    prompt: "A violet glass bottle",
    modelId: "gemini-2.5-flash-image",
    aspectRatio: "4:5",
    referenceAssetId: null,
  });
  expect(api.submissions[0].idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  api.ready();
  await page.getByRole("button", { name: "Use generated image", exact: true }).click();
  await expect(
    page.getByText("Authorized project asset. Edits stay in this browser."),
  ).toBeVisible();
  const preview = page.getByRole("img", { name: "Image adjustment preview", exact: true });
  await expect(preview).toBeVisible();
  const decoded = await preview.evaluate(async (element) => {
    const url = getComputedStyle(element).backgroundImage.slice(5, -2);
    const image = new Image();
    image.src = url;
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(decoded).toEqual({ width: 1, height: 1 });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download original image", exact: true }).click();
  const download = await downloadEvent;
  const location = testInfo.outputPath("generated-original.png");
  await download.saveAs(location);
  const { readFile } = await import("node:fs/promises");
  const actualBytes = await readFile(location);
  expect(actualBytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  await page.getByRole("button", { name: "Switch fixture project", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Use generated image", exact: true })).toHaveCount(
    0,
  );
});

test("a queued image job can be cancelled and retry creates a new explicitly confirmed request", async ({
  page,
}) => {
  const api = await fixtureApi(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("A violet glass bottle");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await page.getByRole("button", { name: "Cancel generation", exact: true }).click();
  await expect(page.getByRole("region", { name: "Generation history", exact: true })).toContainText(
    "Cancelled",
  );
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Retry as new generation", exact: true }).click();
  expect(api.submissions).toHaveLength(1);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Retry as new generation", exact: true }).click();
  await expect.poll(() => api.submissions.length).toBe(2);
  expect(api.submissions[1].idempotencyKey).not.toBe(api.submissions[0].idempotencyKey);
});

test("a reference upload sends checked image bytes to private storage and uses only the finalized asset ID", async ({
  page,
}) => {
  const api = await fixtureApi(page);
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7M0AAAAASUVORK5CYII=",
    "base64",
  );
  let reservation: Record<string, unknown> | undefined;
  let uploaded: Buffer | null = null;
  let finalized = false;
  await page.route(`${origin}/api/v1/assets/upload-session`, (route) => {
    reservation = route.request().postDataJSON();
    return route.fulfill({
      json: ok({
        upload: {
          id: jobId,
          projectId,
          assetId,
          expiresAt: "2026-11-12T10:05:00.000Z",
          uploadUrl: "https://storage.example.test/upload",
          uploadContentType: "image/png",
        },
      }),
    });
  });
  await page.route("https://storage.example.test/upload", (route) => {
    uploaded = route.request().postDataBuffer();
    return route.fulfill({
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "",
    });
  });
  await page.route(`${origin}/api/v1/assets/upload-session/${jobId}/finalize`, (route) => {
    finalized = true;
    return route.fulfill({
      json: ok({
        asset: {
          id: assetId,
          projectId,
          mimeType: "image/png",
          byteSize: bytes.length,
          width: 1,
          height: 1,
          durationSeconds: null,
          createdAt: date,
          nativeContentUrl: null,
          contentUrl: `/api/v1/assets/${assetId}/content`,
        },
      }),
    });
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("A violet glass bottle");
  await page
    .getByLabel("Choose private reference image", { exact: true })
    .setInputFiles({ name: "reference.png", mimeType: "image/png", buffer: bytes });
  await expect(page.getByLabel("Project reference image", { exact: true })).toHaveValue(assetId);
  expect(uploaded).toEqual(bytes);
  expect(finalized).toBe(true);
  const { createHash } = await import("node:crypto");
  expect(reservation).toMatchObject({
    projectId,
    fileName: "reference.png",
    byteSize: bytes.length,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
  });
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect.poll(() => api.submissions.length).toBe(1);
  expect(api.submissions[0].referenceAssetId).toBe(assetId);
});

test("a Clerk session change disposes private prompts, generated images and cached history", async ({
  page,
}) => {
  const api = await fixtureApi(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("Private account direction");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  api.ready();
  await page.getByRole("button", { name: "Use generated image", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Image adjustment preview", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out fixture account", exact: true }).click();
  await expect(
    page.getByText("Sign in again to open this private project.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: "Image adjustment preview", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Generation history", exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Sign in other fixture account", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toHaveValue("");
  await expect(
    page.getByText("Authorized project asset. Edits stay in this browser.", { exact: true }),
  ).toHaveCount(0);
});

test("an uncertain submission never retries automatically and preserves the idempotency key on an explicit retry", async ({
  page,
}) => {
  const api = await fixtureApi(page);
  api.rejectNext();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("A violet glass bottle");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Image generation settings", exact: true }).getByRole("alert"),
  ).toContainText("Refresh history before retrying");
  expect(api.submissions).toHaveLength(1);
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  await expect.poll(() => api.submissions.length).toBe(2);
  expect(api.submissions[1].idempotencyKey).toBe(api.submissions[0].idempotencyKey);
});

test("verified project access revocation removes private drafts, cached history and selected image without a refetch loop", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = { created: [] as string[], revoked: [] as string[] };
    (window as unknown as { fixtureImageUrls: typeof state }).fixtureImageUrls = state;
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob) => {
      const url = create.call(URL, blob);
      state.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      state.revoked.push(url);
      revoke.call(URL, url);
    };
  });
  const api = await fixtureApi(page);
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(origin);
  await page
    .getByRole("textbox", { name: "Image prompt", exact: true })
    .fill("Private direction before revoked access");
  await page.getByRole("button", { name: "Generate image", exact: true }).click();
  api.ready();
  await page.getByRole("button", { name: "Use generated image", exact: true }).click();
  await expect(
    page.getByText("Authorized project asset. Edits stay in this browser.", { exact: true }),
  ).toBeVisible();
  const preview = page.getByRole("img", { name: "Image adjustment preview", exact: true });
  await expect(preview).toBeVisible();
  const previousBlob = await page.evaluate(() =>
    (window as unknown as { fixtureImageUrls: { created: string[] } }).fixtureImageUrls.created.at(
      -1,
    )!,
  );
  expect(previousBlob).toMatch(/^blob:/);
  api.revokeHistory();
  await page.getByRole("button", { name: "Refresh generation history", exact: true }).click();
  await expect(
    page.getByText("Your project access changed. Reopen an authorized project to continue.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Image prompt", exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Generation history", exact: true })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("img", { name: "Image adjustment preview", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("A violet glass bottle", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url);
        return false;
      } catch {
        return true;
      }
    }, previousBlob),
  ).toBe(true);
  const reads = api.historyReads();
  await page.waitForTimeout(2200);
  expect(api.historyReads()).toBe(reads);
});
