import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-client-review-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error(`Review harness timed out: ${output}`)),
      25_000,
    );
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const ready = /REVIEW_HARNESS_READY (\d+)/.exec(output);
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
      reject(new Error(`Review harness exited ${code}: ${output}`));
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
const versionId = "33333333-3333-4333-8333-333333333333",
  projectId = "11111111-1111-4111-8111-111111111111",
  grantId = "44444444-4444-4444-8444-444444444444";
const reviewPath = `/api/v1/reviews/${versionId}`,
  creatorPath = `/api/v1/projects/${projectId}/deliverables/${versionId}/review-grants`;
const date = "2026-11-13T00:00:00.000Z";
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWMwMjL6DwACxgGWgWwZRAAAAABJRU5ErkJggg==",
  "base64",
);
const ok = (data: unknown) => ({ ok: true, data, requestId: "review-http-fixture" });
async function backend(page: Page) {
  let revoked = false;
  const comments: Record<string, unknown>[] = [],
    decisions: Record<string, unknown>[] = [],
    actions: Record<string, unknown>[] = [];
  let hasGrant = false;
  const grant = () => ({
    grantId,
    reviewId: versionId,
    expiresAt: "2026-11-20T00:00:00.000Z",
    createdAt: date,
    revokedAt: revoked ? date : null,
    active: !revoked,
    reviewUrl: `/reviews/${versionId}`,
  });
  const review = () => ({
    reviewId: versionId,
    grantId,
    version: 1,
    title: "Private poster",
    caption: "For client review",
    publishedAt: date,
    expiresAt: "2026-11-20T00:00:00.000Z",
    preview: {
      url: `${reviewPath}/content`,
      mimeType: "image/png",
      byteSize: png.length,
      width: 1,
      height: 1,
    },
    comments,
    decision: decisions.at(-1) ?? null,
  });
  await page.route(`${origin}/api/v1/reviews`, (route) =>
    route.fulfill({
      json: ok({
        reviews: revoked
          ? []
          : [
              {
                reviewId: versionId,
                grantId,
                version: 1,
                title: "Private poster",
                expiresAt: "2026-11-20T00:00:00.000Z",
                decision: decisions.at(-1) ?? null,
              },
            ],
        hasMore: false,
      }),
    }),
  );
  await page.route(`${origin}${reviewPath}**`, async (route) => {
    if (revoked)
      return route.fulfill({
        status: 403,
        json: {
          ok: false,
          error: { code: "FORBIDDEN", message: "Revoked review", retryable: false },
          requestId: "fixture",
        },
      });
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/content")) return route.fulfill({ contentType: "image/png", body: png });
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      actions.push(input);
      expect(input.grantId).toBe(grantId);
      expect(input.expectedVersion).toBe(1);
      expect(input.actorId).toBeUndefined();
      if (path.endsWith("/comments") && !comments.some((item) => item.id === input.idempotencyKey))
        comments.push({
          id: input.idempotencyKey,
          grantId,
          comment: input.comment,
          timecodeSeconds: null,
          createdAt: date,
        });
      if (path.endsWith("/decision") && !decisions.length)
        decisions.push({
          id: input.idempotencyKey,
          grantId,
          decision: input.decision,
          comment: input.comment ?? null,
          createdAt: date,
        });
    }
    return route.fulfill({ json: ok({ review: review() }) });
  });
  await page.route(`${origin}${creatorPath}**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/revoke")) {
      revoked = true;
      return route.fulfill({ json: ok({ grant: grant() }) });
    }
    if (route.request().method() === "POST") {
      hasGrant = true;
      return route.fulfill({ status: 201, json: ok({ grant: grant() }) });
    }
    return route.fulfill({
      json: ok({
        feedback: {
          reviewId: versionId,
          version: 1,
          grants: hasGrant ? [grant()] : [],
          comments,
          decisions,
          latestDecision: decisions.at(-1) ?? null,
        },
      }),
    });
  });
  return {
    actions,
    revoke: () => {
      revoked = true;
    },
  };
}
async function openReview(page: Page) {
  await page.getByRole("button", { name: "Open fixture review" }).click();
  await expect(page.getByRole("heading", { name: "Private poster", exact: true })).toBeVisible();
}
test("granted version timeline shows v2 pending and keeps v1 change request after refresh", async ({
  page,
}) => {
  await backend(page);
  const oldId = "70000000-0000-4000-8000-000000000002";
  const history = [
    {
      reviewId: versionId,
      grantId,
      version: 2,
      title: "Private poster",
      expiresAt: "2026-11-20T00:00:00.000Z",
      decision: null,
    },
    {
      reviewId: oldId,
      grantId: oldId,
      version: 1,
      title: "Original poster",
      expiresAt: "2026-11-20T00:00:00.000Z",
      decision: {
        id: oldId,
        grantId: oldId,
        decision: "changes_requested",
        comment: "Adjust contrast",
        createdAt: date,
      },
    },
  ];
  await page.route(`${origin}${reviewPath}`, (route) =>
    route.fulfill({
      json: ok({
        review: {
          reviewId: versionId,
          grantId,
          version: 2,
          title: "Private poster",
          caption: "Updated",
          publishedAt: date,
          expiresAt: "2026-11-20T00:00:00.000Z",
          preview: {
            url: `${reviewPath}/content`,
            mimeType: "image/png",
            byteSize: png.length,
            width: 1,
            height: 1,
          },
          comments: [],
          decision: null,
          history,
        },
      }),
    }),
  );
  await page.goto(origin);
  await openReview(page);
  const timeline = page.getByRole("region", { name: "Your granted version history" });
  await expect(timeline.getByRole("listitem")).toHaveCount(2);
  await expect(timeline.getByRole("listitem").first()).toContainText(
    "v2 · Private poster · Pending review",
  );
  await expect(timeline.getByRole("link", { name: "v1 · Original poster" })).toHaveAttribute(
    "href",
    `/reviews/${oldId}`,
  );
  await expect(timeline).toContainText("Changes requested");
  await page.getByRole("button", { name: "Refresh review", exact: true }).click();
  await expect(timeline).toContainText("Pending review");
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeEnabled();
});
test("client inbox opens one version, decodes private image and persists comment/changes for creator refresh", async ({
  page,
}, testInfo) => {
  const api = await backend(page);
  await page.goto(origin);
  await expect(page.getByRole("heading", { name: "Your reviews", exact: true })).toBeVisible();
  await openReview(page);
  await expect(
    page.getByRole("img", { name: "Published review image", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Comment", { exact: true }).fill("Please use a darker background");
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect(page.getByText("Please use a darker background", { exact: true })).toBeVisible();
  await page.getByLabel("Decision note (optional)").fill("Adjust contrast");
  await page.getByRole("button", { name: "Request changes", exact: true }).click();
  await expect(page.getByText("Changes requested", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("client-review-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("client-review-mobile.png"), fullPage: true });
  await page.getByRole("button", { name: "Show fixture creator feedback" }).click();
  await expect(page.getByText("Latest decision: Changes requested", { exact: true })).toBeVisible();
  expect(api.actions).toHaveLength(2);
});
test("creator explicitly shares with one existing Clerk subject and can revoke", async ({
  page,
}) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "Show fixture creator feedback" }).click();
  await page.getByLabel("Reviewer Clerk user ID").fill("user_realClient");
  await page.getByRole("button", { name: "Share for review", exact: true }).click();
  await expect(page.getByRole("link", { name: "Authenticated review page" })).toHaveAttribute(
    "href",
    `/reviews/${versionId}`,
  );
  await page.getByRole("button", { name: "Revoke review access", exact: true }).click();
  await expect(page.getByText("Revoked", { exact: true })).toBeVisible();
});
test("revoked or expired access clears preview and cannot leave decision controls active", async ({
  page,
}) => {
  const api = await backend(page);
  await page.goto(origin);
  await openReview(page);
  const image = page.getByRole("img", { name: "Published review image", exact: true });
  await expect(image).toBeVisible();
  const url = await image.getAttribute("src");
  api.revoke();
  await page.getByRole("button", { name: "Refresh review", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Review unavailable", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("img")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(async (source) => {
        try {
          await fetch(source!);
          return false;
        } catch {
          return true;
        }
      }, url),
    )
    .toBe(true);
});
test("failed comment retains text and retry key without creating duplicate feedback", async ({
  page,
}) => {
  const api = await backend(page);
  let fail = true;
  const inputs: Record<string, unknown>[] = [];
  await page.route(`${origin}${reviewPath}/comments`, (route) => {
    inputs.push(route.request().postDataJSON());
    if (fail) {
      fail = false;
      return route.abort("failed");
    }
    return route.fallback();
  });
  await page.goto(origin);
  await openReview(page);
  await page.getByLabel("Comment", { exact: true }).fill("Retain this note");
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Comment", exact: true })).toHaveValue(
    "Retain this note",
  );
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect(page.getByText("Retain this note", { exact: true })).toBeVisible();
  expect(inputs[0].idempotencyKey).toBe(inputs[1].idempotencyKey);
  expect(api.actions).toHaveLength(1);
});
test("session loss during a decision discards the late response and private image", async ({
  page,
}) => {
  await backend(page);
  let waiting = false,
    release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`${origin}${reviewPath}/decision`, async (route) => {
    waiting = true;
    await gate;
    return route.fallback().catch(() => undefined);
  });
  await page.goto(origin);
  await openReview(page);
  try {
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await expect.poll(() => waiting).toBe(true);
    await page.getByRole("button", { name: "Sign out fixture session" }).click();
    release();
    await expect(page.getByText("Sign in to view reviews.", { exact: true })).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(0);
    await expect(page.getByText("Approved", { exact: true })).toHaveCount(0);
  } finally {
    release();
  }
});
test("approval is terminal and remains visible after a review refresh", async ({ page }) => {
  await backend(page);
  await page.goto(origin);
  await openReview(page);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Approved", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Refresh review", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Approved", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Request changes", exact: true })).toBeDisabled();
});
