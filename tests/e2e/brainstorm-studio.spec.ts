import { expect, test } from "@playwright/test";
test("brainstorm keeps unsaved drafting and ideas usable when services are unavailable", async ({
  page,
}) => {
  await page.route("**/api/v1/brainstorm/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: {
          code: "PROVIDER_UNCONFIGURED",
          message: "Workspace is not connected.",
          retryable: true,
        },
        requestId: "fixture",
      }),
    }),
  );
  await page.goto("/brainstorm");
  await expect(page.getByRole("heading", { name: "Brainstorm Studio", exact: true })).toBeVisible();
  await expect(page.getByLabel("Search sessions")).toBeVisible();
  await expect(page.getByLabel("Prompt template").locator("option")).toHaveCount(11);
  await page.getByLabel("Brainstorm message", { exact: true }).fill("Use a warm morning commute.");
  await page.getByLabel("Prompt template").selectOption("storyboard-plan");
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue(/Generate Storyboard Plan \[storyboard-plan:v1\]/);
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue(/Additional instructions: Use a warm morning commute\./);
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue(/text-only storyboard/);
  await page.getByLabel("Brainstorm message", { exact: true }).fill("A warm product launch");
  await page.getByRole("button", { name: "Send to Gemini", exact: true }).click();
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue(
    "A warm product launch",
  );
  await page.getByLabel("Idea title", { exact: true }).fill("Warm launch");
  await page
    .getByLabel("Idea description", { exact: true })
    .fill("Show handmade details in a short video.");
  await page.getByRole("button", { name: "Save idea", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Warm launch", exact: true })).toBeVisible();
  await expect(page.getByText("Unsaved · local", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("AI-generated suggestion", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "New session", exact: true }).click();
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue("");
  await page
    .getByRole("button", { name: /Untitled session/ })
    .first()
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test("brainstorm fixture persists sessions, reviews voice transcripts and saves generated concepts", async ({
  page,
}) => {
  const sessions: Record<
    string,
    {
      id: string;
      title: string;
      projectId: string | null;
      pinned: boolean;
      revision: number;
      createdAt: string;
      updatedAt: string;
    }
  > = {};
  const details: Record<string, { messages: unknown[]; ideas: unknown[] }> = {};
  let aiCalls = 0;
  let transcripts = 0;
  const creationKeys = new Set<string>();
  const reply = (data: unknown) => ({ ok: true, data, requestId: "explicit-browser-fixture" });
  await page.route("**/api/v1/workspace/projects", (route) => {
    if (route.request().method() === "POST") {
      const input = route.request().postDataJSON();
      creationKeys.add(input.idempotencyKey);
      return route.fulfill({ json: reply({ project: { id: input.idempotencyKey } }) });
    }
    return route.fulfill({ json: reply({ projects: [] }) });
  });
  await page.route("**/api/v1/brainstorm/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname,
      parts = path.split("/"),
      id = parts[5];
    if (path.endsWith("/sessions") && req.method() === "GET")
      return route.fulfill({ json: reply({ sessions: Object.values(sessions) }) });
    if (path.endsWith("/sessions") && req.method() === "POST") {
      const input = req.postDataJSON();
      const now = new Date().toISOString();
      const session = {
        id: input.idempotencyKey,
        title: input.title,
        projectId: input.projectId ?? null,
        pinned: false,
        revision: 0,
        createdAt: now,
        updatedAt: now,
      };
      sessions[session.id] = session;
      details[session.id] = { messages: [], ideas: [] };
      return route.fulfill({ json: reply({ session }) });
    }
    const session = sessions[id];
    if (!session)
      return route.fulfill({
        status: 403,
        json: {
          ok: false,
          error: { code: "FORBIDDEN", message: "Fixture session missing", retryable: false },
          requestId: "fixture",
        },
      });
    if (path.endsWith("/transcribe")) {
      transcripts++;
      return route.fulfill({
        json: reply({ text: "Plan a craft launch", language: "en-IN", mode: "live" }),
      });
    }
    if (path.endsWith("/messages")) {
      aiCalls++;
      const input = req.postDataJSON();
      session.revision += 2;
      const message = {
        id: input.idempotencyKey,
        sessionId: id,
        message: input.message,
        status: "completed",
        createdAt: new Date().toISOString(),
        content: {
          reply: "A craft-led launch concept",
          concepts: [
            {
              title: "Made with care",
              targetAudience: "Design-conscious shoppers",
              coreMessage: "Handcrafted detail",
              contentFormat: "Short video",
              creativeDirection: "Warm close-ups",
              productionRequirements: ["Macro lens"],
              nextSteps: ["Draft a shot list"],
            },
          ],
        },
      };
      details[id].messages.push(message);
      return route.fulfill({ json: reply({ session, message }) });
    }
    if (path.endsWith("/ideas")) {
      const input = req.postDataJSON();
      session.revision++;
      const idea = {
        id: input.idempotencyKey,
        sessionId: id,
        title: input.title,
        description: input.description,
        tags: input.tags,
        category: input.category,
        sourceMessageId: input.sourceMessageId ?? null,
        createdAt: new Date().toISOString(),
      };
      details[id].ideas.push(idea);
      return route.fulfill({ json: reply({ session, idea }) });
    }
    if (req.method() === "PATCH") {
      const input = req.postDataJSON();
      Object.assign(session, {
        ...(input.title ? { title: input.title } : {}),
        ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
      });
      session.revision++;
      return route.fulfill({ json: reply({ session }) });
    }
    return route.fulfill({ json: reply({ session, ...details[id] }) });
  });
  await page.goto("/brainstorm");
  await page.getByLabel("Session title", { exact: true }).fill("Craft launch");
  await page.getByRole("button", { name: "Save session", exact: true }).click();
  await expect(page.getByText("Saved session", { exact: true })).toBeVisible();
  await page.getByLabel("I agree to send a short recording", { exact: false }).check();
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(page.getByLabel("Brainstorm message", { exact: true })).toHaveValue(
    "Plan a craft launch",
  );
  expect(transcripts).toBe(1);
  expect(aiCalls).toBe(0);
  await page
    .getByLabel("Brainstorm message", { exact: true })
    .fill("Plan a low-budget craft launch");
  await page.getByRole("button", { name: "Send to Gemini", exact: true }).click();
  await expect(page.getByText("AI-generated suggestion", { exact: true })).toBeVisible();
  expect(aiCalls).toBe(1);
  await page.getByRole("button", { name: "Save Made with care as idea", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Made with care", exact: true })).toHaveCount(2);
  await expect(page.getByText("Saved to workspace", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Pin session", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Pinned sessions", exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: /Craft launch/ })
    .first()
    .click();
  await expect(page.getByText("A craft-led launch concept", { exact: true })).toBeVisible();
  await expect(page.getByText("Saved to workspace", { exact: true })).toBeVisible();
  await page.screenshot({ path: "/tmp/brainstorm-studio-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Convert to project", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open project", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Convert to project", exact: true }).click();
  await expect(page.getByRole("button", { name: "Convert to project", exact: true })).toBeEnabled();
  expect(creationKeys.size).toBe(1);
});

test("cancelling voice while a session save is pending never requests microphone permission", async ({
  page,
}) => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    (window as unknown as { micCalls: number }).micCalls = 0;
    navigator.mediaDevices.getUserMedia = (constraints) => {
      (window as unknown as { micCalls: number }).micCalls++;
      return original(constraints);
    };
  });
  await page.route("**/api/v1/brainstorm/sessions", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { ok: true, data: { sessions: [] }, requestId: "fixture" } });
    const input = route.request().postDataJSON();
    await gate;
    const now = new Date().toISOString();
    return route.fulfill({
      json: {
        ok: true,
        data: {
          session: {
            id: input.idempotencyKey,
            title: input.title,
            projectId: null,
            pinned: false,
            revision: 0,
            createdAt: now,
            updatedAt: now,
          },
        },
        requestId: "fixture",
      },
    });
  });
  await page.goto("/brainstorm");
  await page.getByLabel("I agree to send a short recording", { exact: false }).check();
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  release();
  await expect(page.getByRole("button", { name: "Record voice message", exact: true })).toHaveText(
    "Voice",
  );
  expect(await page.evaluate(() => (window as unknown as { micCalls: number }).micCalls)).toBe(0);
});
