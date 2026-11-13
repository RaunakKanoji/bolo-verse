import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-project-images-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Publication harness timeout: ${output}`)),
      25_000,
    );
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /IMAGES_HARNESS_READY (\d+)/.exec(output);
      if (ready) {
        origin = `http://127.0.0.1:${ready[1]}`;
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
      reject(new Error(`Publication harness exited ${code}: ${output}`));
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
  assetId = "a046df5a-e5e4-4727-a191-2266e031bba9";
const path = `/api/v1/projects/${projectId}/deliverables`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==",
  "base64",
);
const asset = {
  id: assetId,
  projectId,
  mimeType: "image/png",
  byteSize: png.length,
  width: 1,
  height: 1,
  durationSeconds: null,
  createdAt: "2026-11-13T00:00:00.000Z",
  contentUrl: `/api/v1/assets/${assetId}/content`,
  nativeContentUrl: null,
};
const revisedAssetId = "a046df5a-e5e4-4727-a191-2266e031bbab";
const revisedPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVQImWMoLy//D8IMMAYAUvIJkXbKFyEAAAAASUVORK5CYII=",
  "base64",
);
const revisedAsset = {
  ...asset,
  id: revisedAssetId,
  byteSize: revisedPng.length,
  width: 2,
  height: 2,
  contentUrl: `/api/v1/assets/${revisedAssetId}/content`,
};
const ok = (data: unknown) => ({ ok: true, data, requestId: "publication-http-fixture" });
async function backend(page: Page) {
  const versions: Record<string, unknown>[] = [],
    requests: Record<string, unknown>[] = [];
  await page.route(`${origin}${path}/*/review-grants`, (route) => {
    const id = new URL(route.request().url()).pathname.split("/").at(-2)!;
    const version = versions.find((item) => item.deliverableId === id);
    return route.fulfill({
      json: ok({
        feedback: {
          reviewId: id,
          version: version?.version ?? 1,
          grants: [],
          comments: [],
          decisions: [],
          latestDecision: null,
        },
      }),
    });
  });
  await page.route(`${origin}/api/v1/projects/${projectId}/assets`, (route) =>
    route.fulfill({ json: ok({ assets: [asset], hasMore: false }) }),
  );
  await page.route(`${origin}${asset.contentUrl}`, (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  );
  await page.route(`${origin}${path}`, async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: ok({ deliverables: [...versions].reverse(), hasMore: false, canPublish: true }),
      });
    const input = route.request().postDataJSON();
    requests.push(input);
    let deliverable = versions.find((version) => version.deliverableId === input.idempotencyKey);
    if (!deliverable) {
      const chosen = input.assetId === revisedAssetId ? revisedAsset : asset;
      deliverable = {
        deliverableId: input.idempotencyKey,
        projectId,
        version: versions.length + 1,
        title: input.title.trim(),
        caption: input.caption?.trim() ?? "",
        status: "published",
        publishedAt: "2026-11-13T12:00:00.000Z",
        source: {
          schemaVersion: 2,
          sourceType: "uploaded_image",
          projectId,
          assetId: chosen.id,
          checksumSha256: chosen.id === assetId ? "a".repeat(64) : "b".repeat(64),
          ...(input.briefVersion ? { briefVersion: input.briefVersion } : {}),
          ...(input.sceneRevision
            ? { sceneRevision: input.sceneRevision, sceneRelation: "context_only" }
            : {}),
          ...(input.revision ? { revision: input.revision } : {}),
        },
        asset: chosen,
      };
      versions.push(deliverable);
    }
    return route.fulfill({ status: 201, json: ok({ deliverable }) });
  });
  return { versions, requests };
}
async function dialog(page: Page) {
  await page.getByRole("button", { name: "Select project image 1", exact: true }).click();
  await page.getByRole("button", { name: "Publish selected image", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Publish uploaded image" })).toBeVisible();
}
test("explicit publication creates immutable uploaded-image v1 and reloads its private preview/history", async ({
  page,
}, testInfo) => {
  const store = await backend(page);
  await page.goto(origin);
  await expect(page.getByText("No image versions published yet.", { exact: true })).toBeVisible();
  expect(store.requests).toHaveLength(0);
  await dialog(page);
  await page.getByLabel("Publication title", { exact: true }).fill("First poster");
  await page.getByLabel("Caption (optional)").fill("For discussion");
  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await expect(page.getByText("Published version 1.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "v1 · First poster", exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Published image v1", exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("published-history-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: testInfo.outputPath("published-history-mobile.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "v1 · First poster", exact: true })).toBeVisible();
  expect(store.requests).toHaveLength(1);
});
for (const interrupted of [false, true])
  test(`reviewed v1 resubmission preserves history and explicit sharing${interrupted ? " through a lost response retry" : ""}`, async ({
    page,
  }, testInfo) => {
    const store = await backend(page);
    await page.route(`${origin}/api/v1/projects/${projectId}/assets`, (route) =>
      route.fulfill({ json: ok({ assets: [asset, revisedAsset], hasMore: false }) }),
    );
    await page.route(`${origin}${revisedAsset.contentUrl}`, (route) =>
      route.fulfill({ contentType: "image/png", body: revisedPng }),
    );
    await page.goto(origin);
    await dialog(page);
    await page.getByRole("button", { name: "Publish version", exact: true }).click();
    const parent = store.versions[0].deliverableId as string,
      decisionId = "70000000-0000-4000-8000-000000000001";
    await page.route(`${origin}${path}/${parent}/review-grants`, (route) =>
      route.fulfill({
        json: ok({
          feedback: {
            reviewId: parent,
            version: 1,
            grants: [],
            comments: [],
            decisions: [
              {
                id: decisionId,
                grantId: null,
                decision: "changes_requested",
                comment: "Lighter background",
                createdAt: "2026-11-13T13:00:00.000Z",
              },
            ],
            latestDecision: {
              id: decisionId,
              grantId: null,
              decision: "changes_requested",
              comment: "Lighter background",
              createdAt: "2026-11-13T13:00:00.000Z",
            },
          },
        }),
      }),
    );
    await page.getByRole("button", { name: "Refresh published versions", exact: true }).click();
    await expect(
      page.getByText("Latest decision: Changes requested", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resubmit selected image", exact: true }),
    ).toBeDisabled();
    await page.getByRole("button", { name: "Select project image 2", exact: true }).click();
    await page.getByRole("button", { name: "Resubmit selected image", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Resubmit reviewed image" })).toBeVisible();
    await expect(
      page.getByText("Revision of v1. The previous image and feedback stay unchanged.", {
        exact: true,
      }),
    ).toBeVisible();
    if (interrupted) {
      let fail = true;
      await page.route(`${origin}${path}`, (route) => {
        if (route.request().method() !== "POST" || !fail) return route.fallback();
        fail = false;
        store.requests.push(route.request().postDataJSON());
        return route.abort("failed");
      });
    }
    await page.getByRole("button", { name: "Resubmit version", exact: true }).click();
    if (interrupted) {
      await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
      await page.getByRole("button", { name: "Resubmit version", exact: true }).click();
      expect(store.requests[1].idempotencyKey).toBe(store.requests[2].idempotencyKey);
    }
    await expect(
      page.getByText("Published version 2. Share this version for review explicitly.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(store.requests.at(-1)).toMatchObject({
      assetId: revisedAssetId,
      revision: { supersedesVersionId: parent, expectedVersion: 1, expectedDecisionId: decisionId },
    });
    await expect(page.getByText("Revision of v1", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Revision of v1", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Latest decision: Changes requested", { exact: true }),
    ).toBeVisible();
    expect(store.versions).toHaveLength(2);
    if (!interrupted) {
      await page.screenshot({
        path: testInfo.outputPath("revision-history-desktop.png"),
        fullPage: true,
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: testInfo.outputPath("revision-history-mobile.png"),
        fullPage: true,
      });
    }
  });
test("empty title is rejected and scene context is explicitly not rendered provenance", async ({
  page,
}) => {
  const store = await backend(page);
  await page.goto(origin);
  await dialog(page);
  await page.getByLabel("Publication title", { exact: true }).fill(" ");
  await expect(page.getByRole("button", { name: "Publish version", exact: true })).toBeDisabled();
  expect(store.requests).toHaveLength(0);
  await page.getByLabel("Publication title", { exact: true }).fill("Context poster");
  await page.getByLabel("Source brief version (optional)").fill("2");
  await page.getByLabel("Saved scene revision (context only, optional)").fill("3");
  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await expect(
    page.getByText(
      "Scene revision 3 is context only; this image was not rendered from the scene.",
      { exact: true },
    ),
  ).toBeVisible();
});
test("lost publication response preserves the form and exact retry key without duplicate versions", async ({
  page,
}) => {
  const store = await backend(page);
  let fail = true;
  await page.route(`${origin}${path}`, (route) => {
    if (route.request().method() !== "POST" || !fail) return route.fallback();
    fail = false;
    store.requests.push(route.request().postDataJSON());
    return route.abort("failed");
  });
  await page.goto(origin);
  await dialog(page);
  await page.getByLabel("Publication title", { exact: true }).fill("Retained title");
  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Publication title", { exact: true })).toHaveValue("Retained title");
  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await expect(page.getByText("Published version 1.", { exact: true })).toBeVisible();
  expect(store.requests[0].idempotencyKey).toBe(store.requests[1].idempotencyKey);
  expect(store.versions).toHaveLength(1);
});
test("publication access loss clears private selection, form and history", async ({ page }) => {
  await backend(page);
  await page.route(`${origin}${path}`, (route) =>
    route.request().method() === "GET"
      ? route.fallback()
      : route.fulfill({
          status: 403,
          json: {
            ok: false,
            error: { code: "FORBIDDEN", message: "Access changed", retryable: false },
            requestId: "fixture",
          },
        }),
  );
  await page.goto(origin);
  await dialog(page);
  await page.getByRole("button", { name: "Publish version", exact: true }).click();
  await expect(page.getByText(/Project image access is unavailable/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("img")).toHaveCount(0);
});
test("sign-out aborts publication and a late reply cannot reappear", async ({ page }) => {
  await backend(page);
  let waiting = false,
    release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${origin}${path}`, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    waiting = true;
    await gate;
    return route.fallback().catch(() => undefined);
  });
  await page.goto(origin);
  await dialog(page);
  try {
    await page.getByRole("button", { name: "Publish version", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    // Native dialog confines interaction; Escape explicitly closes/cancels before sign-out.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Sign out fixture session" }).click();
    release();
    await expect(page.getByText(/Sign in to view project images/)).toBeVisible();
    await expect(page.getByText(/Published version \d+\./)).toHaveCount(0);
  } finally {
    release();
  }
});
test("publication waits for an in-flight image upload that can change selection", async ({
  page,
}) => {
  await backend(page);
  const nextId = "a046df5a-e5e4-4727-a191-2266e031bbaa";
  let release!: () => void,
    waiting = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${origin}/api/v1/assets/upload-session`, (route) =>
    route.fulfill({
      status: 201,
      json: ok({
        upload: {
          id: nextId,
          assetId: nextId,
          projectId,
          expiresAt: "2026-11-13T10:00:00.000Z",
          uploadUrl: "https://storage.example.test/publication-upload",
          uploadContentType: "image/png",
        },
      }),
    }),
  );
  await page.route("https://storage.example.test/publication-upload", (route) =>
    route.fulfill({ status: 200 }),
  );
  await page.route(`${origin}/api/v1/assets/upload-session/${nextId}/finalize`, async (route) => {
    waiting = true;
    await gate;
    await route
      .fulfill({
        json: ok({
          asset: { ...asset, id: nextId, contentUrl: `/api/v1/assets/${nextId}/content` },
        }),
      })
      .catch(() => undefined);
  });
  await page.route(`${origin}/api/v1/assets/${nextId}/content`, (route) =>
    route.fulfill({ contentType: "image/png", body: png }),
  );
  await page.goto(origin);
  try {
    await page.getByRole("button", { name: "Select project image 1", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Publish selected image", exact: true }),
    ).toBeEnabled();
    await page
      .getByLabel("Choose project image")
      .setInputFiles({ name: "next.png", mimeType: "image/png", buffer: png });
    await page.getByRole("button", { name: "Upload image", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await expect(
      page.getByRole("button", { name: "Publish selected image", exact: true }),
    ).toBeDisabled();
    release();
    await expect(page.getByText("Image uploaded and ready.", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Publish selected image", exact: true }),
    ).toBeEnabled();
  } finally {
    release();
  }
});
test("creator can open feedback and revoke an old v1 assignment after publishing v5", async ({
  page,
}) => {
  await backend(page);
  await page.goto(origin);
  const ids = await page.evaluate(
    async ({ path, assetId }) => {
      const ids: string[] = [];
      for (let version = 1; version <= 5; version++) {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetId,
            title: `Poster ${version}`,
            idempotencyKey: crypto.randomUUID(),
          }),
        });
        ids.push((await response.json()).data.deliverable.deliverableId);
      }
      return ids;
    },
    { path, assetId },
  );
  let revoked = false;
  const grant = () => ({
    grantId: "44444444-4444-4444-8444-444444444444",
    reviewId: ids[0],
    expiresAt: "2026-11-20T00:00:00.000Z",
    revokedAt: revoked ? "2026-11-13T00:00:00.000Z" : null,
    createdAt: "2026-11-13T00:00:00.000Z",
    active: !revoked,
    reviewUrl: `/reviews/${ids[0]}`,
  });
  await page.route(`${origin}${path}/${ids[0]}/review-grants**`, (route) => {
    if (route.request().method() === "POST") {
      revoked = true;
      return route.fulfill({ json: ok({ grant: grant() }) });
    }
    return route.fulfill({
      json: ok({
        feedback: {
          reviewId: ids[0],
          version: 1,
          grants: [grant()],
          comments: [],
          decisions: [],
          latestDecision: null,
        },
      }),
    });
  });
  await page.getByRole("button", { name: "Refresh published versions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "v5 · Poster 5", exact: true })).toBeVisible();
  await page.getByText("Review access and feedback for v1", { exact: true }).click();
  await page.getByRole("button", { name: "Revoke review access", exact: true }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
  expect(revoked).toBe(true);
});
