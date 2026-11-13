import { spawn, type ChildProcess } from "node:child_process";
import { test, expect, type Page } from "@playwright/test";
import type { StudioAsset, StudioProject } from "../../apps/web/src/lib/contracts/workspace";
let origin = "";
let harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-workspace-harness.mjs"], {
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
      const ready = /WORKSPACE_HARNESS_READY (\d+)/.exec(output);
      if (ready) {
        origin = `http://127.0.0.1:${ready[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
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
  clientId = "a046df5a-e5e4-4727-a191-2266e031bba9",
  taskId = "b046df5a-e5e4-4727-a191-2266e031bba9";
const timestamp = "2026-11-13T00:00:00.000Z";
test("project deep links open the requested review workflow and reject unknown tabs", async ({
  page,
}) => {
  await page.goto(`${origin}/?tab=deliverables`);
  await page
    .getByRole("navigation", { name: "Fixture screens" })
    .getByRole("button", { name: "detail", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Deliverables", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto(`${origin}/?tab=untrusted-section`);
  await page
    .getByRole("navigation", { name: "Fixture screens" })
    .getByRole("button", { name: "detail", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
const project = {
  id,
  name: "Launch campaign",
  objective: "Create the product film",
  clientId: null,
  type: "Video Production",
  status: "active",
  priority: "normal",
  startDate: null,
  dueDate: "2026-12-01",
  clientName: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  revision: 1,
  progress: null,
  canEdit: true,
};
const client = {
  id: clientId,
  name: "Mira",
  organization: "Mira Studio",
  email: "mira@example.test",
  phone: "",
  notes: "Brand launch",
  createdAt: timestamp,
  updatedAt: timestamp,
  revision: 1,
  activeProjects: 1,
  pendingReviews: 0,
  lastActivityAt: null,
};
const task = {
  id: taskId,
  projectId: id,
  projectName: project.name,
  title: "Plan the shoot",
  status: "todo",
  priority: "high",
  dueDate: null,
  ownerLabel: "Producer",
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
};
const ok = (data: unknown) => ({ ok: true, data, requestId: "workspace-fixture" });
test("a genuine camera take uploads with a stable retry and clears private choices on denied upload", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["camera", "microphone"]);
  await backend(page);
  const bodies: Buffer[] = [],
    keys: string[] = [];
  let denied = false;
  await page.route(`${origin}/api/v1/workspace/recordings?*`, async (route) => {
    const key = new URL(route.request().url()).searchParams.get("idempotencyKey")!;
    keys.push(key);
    bodies.push(route.request().postDataBuffer()!);
    if (bodies.length === 1) return route.abort("failed");
    if (denied)
      return route.fulfill({
        status: 403,
        json: {
          ok: false,
          error: { code: "FORBIDDEN", message: "Access changed", retryable: false },
          requestId: "fixture",
        },
      });
    return route.fulfill({
      status: 201,
      json: ok({
        asset: {
          id: key,
          projectId: id,
          mimeType: "video/webm",
          byteSize: bodies.at(-1)!.length,
          width: null,
          height: null,
          durationSeconds: null,
          createdAt: timestamp,
          contentUrl: `/api/v1/assets/${key}/content`,
          nativeContentUrl: null,
        },
      }),
    });
  });
  await page.goto(origin);
  await page.getByRole("button", { name: "recording", exact: true }).click();
  await page.getByRole("button", { name: "Enable preview", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start recording", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Start recording", exact: true }).click();
  await expect(page.getByText("00:01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Stop recording", exact: true }).click();
  await expect(page.getByRole("link", { name: "Save recording", exact: true })).toBeVisible();
  await page.getByLabel("Recording project", { exact: true }).selectOption(id);
  await page.getByRole("button", { name: "Add recording to project", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Add recording to project", exact: true }).click();
  await expect(
    page.getByText("Recording added to the project asset library.", { exact: true }),
  ).toBeVisible();
  expect(keys[0]).toBe(keys[1]);
  expect(bodies[0]).toEqual(bodies[1]);
  expect(bodies[0].subarray(0, 4).toString("hex")).toBe("1a45dfa3");
  denied = true;
  await page.getByRole("button", { name: "Add recording to project", exact: true }).click();
  await expect(page.getByLabel("Recording project", { exact: true })).toHaveValue("");
  await expect(
    page
      .getByLabel("Recording project", { exact: true })
      .getByRole("option", { name: project.name, exact: true }),
  ).toHaveCount(0);
});
test("spatial entry distinguishes a failed private scene catalog from an empty project", async ({
  page,
}) => {
  await backend(page);
  await page.route(`${origin}/api/v1/workspace/projects`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        ok: false,
        error: { code: "SERVICE_UNAVAILABLE", message: "Catalog offline", retryable: true },
        requestId: "fixture",
      },
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "spatial", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Project scenes could not load");
  await expect(
    page.getByRole("heading", { name: "Your scenes start with a project", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry scenes", exact: true })).toBeVisible();
});
test("review hub removes a revoked card when its private thumbnail access is denied", async ({
  page,
}) => {
  await backend(page);
  const reviewId = "33333333-3333-4333-8333-333333333333",
    grantId = "44444444-4444-4444-8444-444444444444";
  await page.route(`${origin}/api/v1/reviews`, (route) =>
    route.fulfill({
      json: ok({
        reviews: [
          {
            reviewId,
            grantId,
            version: 1,
            title: "Revoked private poster",
            expiresAt: "2026-11-20T00:00:00.000Z",
            decision: null,
          },
        ],
        hasMore: false,
      }),
    }),
  );
  await page.route(`${origin}/api/v1/reviews/${reviewId}`, (route) =>
    route.fulfill({
      status: 403,
      json: {
        ok: false,
        error: { code: "FORBIDDEN", message: "Revoked", retryable: false },
        requestId: "fixture",
      },
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "review", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No submissions to review", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Revoked private poster", exact: true }),
  ).toHaveCount(0);
});
async function backend(page: Page) {
  const projects: StudioProject[] = [{ ...project, status: "active", priority: "normal" }];
  const tasks: (typeof task)[] = [];
  const clients = [{ ...client }];
  const writes: unknown[] = [];
  const assets: StudioAsset[] = [];
  await page.route(`${origin}/api/v1/workspace/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1/workspace/", "");
    const method = route.request().method();
    const body = method === "GET" ? null : route.request().postDataJSON();
    if (body) writes.push(body);
    if (path === "overview")
      return route.fulfill({
        json: ok({
          metrics: {
            activeProjects: projects.length,
            pendingReviews: 0,
            completedDeliverables: 0,
            upcomingDeadlines: 1,
          },
          projects,
          tasks,
          activity: [],
        }),
      });
    if (path === "projects" && method === "POST") {
      const p = { ...project, ...body, id: "c046df5a-e5e4-4727-a191-2266e031bba9" };
      delete p.idempotencyKey;
      projects.push(p);
      return route.fulfill({ json: ok({ project: p }) });
    }
    if (path === "projects")
      return route.fulfill({
        json: ok({
          projects: projects.filter(
            (p) =>
              !url.searchParams.get("search") ||
              p.name.toLowerCase().includes(url.searchParams.get("search")!.toLowerCase()),
          ),
          total: projects.length,
        }),
      });
    if (path === `projects/${id}/tasks` && method === "POST") {
      const t = { ...task, ...body };
      delete t.idempotencyKey;
      tasks.push(t);
      return route.fulfill({ json: ok({ task: t }) });
    }
    if (path === `projects/${id}/tasks/${taskId}`) {
      tasks[0] = { ...tasks[0], ...body, revision: 2 };
      delete (tasks[0] as Record<string, unknown>).expectedRevision;
      return route.fulfill({ json: ok({ task: tasks[0] }) });
    }
    if (path === `projects/${id}` && method === "PATCH") {
      Object.assign(projects[0], body);
      delete (projects[0] as unknown as Record<string, unknown>).expectedRevision;
      projects[0].revision++;
      return route.fulfill({ json: ok({ project: projects[0] }) });
    }
    if (path === `projects/${id}/duplicate`) {
      const duplicate = {
        ...projects[0],
        id: "d046df5a-e5e4-4727-a191-2266e031bba9",
        name: body.name,
      };
      projects.push(duplicate);
      return route.fulfill({ json: ok({ project: duplicate }) });
    }
    if (path === `projects/${id}`)
      return route.fulfill({
        json: ok({ project: projects[0], canEdit: true, tasks, activity: [] }),
      });
    if (path === "clients" && method === "POST") {
      const c = { ...client, ...body };
      delete c.idempotencyKey;
      clients.push(c);
      return route.fulfill({ json: ok({ client: c }) });
    }
    if (path === "clients") return route.fulfill({ json: ok({ clients, total: clients.length }) });
    if (path === `clients/${clientId}` && method === "PATCH") {
      Object.assign(clients[0], body);
      delete (clients[0] as unknown as Record<string, unknown>).expectedRevision;
      clients[0].revision++;
      return route.fulfill({ json: ok({ client: clients[0] }) });
    }
    if (path === `clients/${clientId}`)
      return route.fulfill({ json: ok({ client: clients[0], projects, activity: [] }) });
    if (path === "assets")
      return route.fulfill({
        json: ok({
          assets: assets.filter(
            (asset) => String(asset.archived) === url.searchParams.get("archived"),
          ),
          total: assets.length,
        }),
      });
    if (path.startsWith("assets/") && method === "PATCH") {
      const asset = assets.find((asset) => path === `assets/${asset.id}`)!;
      Object.assign(asset, body);
      delete (asset as unknown as Record<string, unknown>).expectedRevision;
      asset.revision++;
      return route.fulfill({ json: ok({ asset }) });
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
  return { writes, projects, tasks, assets };
}
test("project form persists explicit fields and list filters display matching records", async ({
  page,
}) => {
  const state = await backend(page);
  await page.goto(origin);
  await expect(page.getByRole("heading", { name: "Launch campaign" })).toBeVisible();
  await page.getByRole("button", { name: "New Project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("New social campaign");
  await page.getByLabel("Description", { exact: true }).fill("Introduce our new product");
  await page.getByLabel("Project type", { exact: true }).selectOption("Social Media Campaign");
  await page.getByLabel("Creative brief notes").fill("Audience: local makers");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes[0]).toMatchObject({
    name: "New social campaign",
    objective: "Introduce our new product\n\nCreative brief notes:\nAudience: local makers",
    type: "Social Media Campaign",
  });
  await page.getByLabel("Search projects").fill("New social");
  await expect(page.getByRole("heading", { name: "Launch campaign" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "New social campaign" })).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("completed");
  await expect(page.getByRole("heading", { name: "No matching projects" })).toBeVisible();
});
test("project detail creates and updates saved tasks", async ({ page }) => {
  const state = await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "detail", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Launch campaign" })).toBeVisible();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByLabel("Task title", { exact: true }).fill("Plan the shoot");
  await page.getByLabel("Task priority").selectOption("high");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("Plan the shoot", { exact: true })).toBeVisible();
  await page.getByLabel("Status for Plan the shoot").selectOption("done");
  await expect.poll(() => state.tasks[0]?.status).toBe("done");
  expect(state.writes.at(-1)).toEqual({ expectedRevision: 1, status: "done" });
});
test("client directory creates contact and detail keeps real project links", async ({ page }) => {
  const state = await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "clients", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mira", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  await page.getByLabel("Client name", { exact: true }).fill("Amir");
  await page.getByLabel("Email", { exact: true }).fill("amir@example.test");
  await page.getByRole("dialog").getByRole("button", { name: "Add client", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.at(-1)).toMatchObject({ name: "Amir", email: "amir@example.test" });
  await page.getByRole("button", { name: "client detail", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mira", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(page.getByRole("link", { name: "Launch campaign", exact: true })).toHaveAttribute(
    "href",
    `/projects/${id}`,
  );
});
test("asset empty state opens project-scoped upload and mobile layout stays bounded", async ({
  page,
}, info) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "assets", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your creative library starts here" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Upload files", exact: true }).click();
  await expect(page.getByLabel("Upload to project")).toBeVisible();
  await page.getByRole("button", { name: "Close Upload project assets" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("assets-mobile.png"), fullPage: true });
});
test("session switch closes unsaved private forms and discards old records", async ({ page }) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "New Project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Private unsaved launch");
  await page.route(`${origin}/api/v1/workspace/projects*`, (route) =>
    route.fulfill({
      status: 403,
      json: {
        ok: false,
        error: { code: "FORBIDDEN", message: "Access changed", retryable: false },
        requestId: "fixture",
      },
    }),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("fixture-session-switch")));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Launch campaign" })).toHaveCount(0);
  await expect(page.getByText("Access changed")).toBeVisible();
});

test("asset metadata edits and archive confirmation preserve immutable files", async ({ page }) => {
  const state = await backend(page);
  state.assets.push({
    id: taskId,
    projectId: id,
    projectName: project.name,
    name: "Production brief.pdf",
    mimeType: "application/pdf",
    category: "document",
    byteSize: 2048,
    width: null,
    height: null,
    createdAt: timestamp,
    contentUrl: null,
    nativeContentUrl: null,
    downloadUrl: null,
    collection: "",
    archived: false,
    revision: 0,
    canEdit: true,
  });
  await page.goto(origin);
  await page.getByRole("button", { name: "assets", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Production brief.pdf" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download asset" })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit collection", exact: true }).click();
  await page.getByLabel("Collection name", { exact: true }).fill("Production");
  await page.getByRole("button", { name: "Save collection" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.at(-1)).toEqual({ expectedRevision: 0, collection: "Production" });
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  expect(state.assets[0].archived).toBe(false);
  await page.getByRole("button", { name: "Confirm archive" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.at(-1)).toEqual({ expectedRevision: 1, archived: true });
  expect(state.assets[0].id).toBe(taskId);
});
test("dashboard service failures leave contextual empty work surfaces and never invented metrics", async ({
  page,
}) => {
  await backend(page);
  await page.route(`${origin}/api/v1/workspace/overview`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        ok: false,
        error: {
          code: "UNAVAILABLE",
          message: "Workspace data is temporarily unavailable.",
          retryable: true,
        },
        requestId: "fixture",
      },
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "dashboard", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Good morning, Asha" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your creative workspace starts here." }),
  ).toBeVisible();
  await expect(page.getByText("Workspace data is temporarily unavailable.")).toBeVisible();
  await expect(page.getByLabel("Workspace overview").locator("strong")).toHaveText([
    "—",
    "—",
    "—",
    "—",
  ]);
  await expect(page.getByRole("heading", { name: "Upcoming tasks" })).toBeVisible();
});

test("asset write denial removes private card and confirmation context", async ({ page }) => {
  const state = await backend(page);
  state.assets.push({
    id: taskId,
    projectId: id,
    projectName: project.name,
    name: "Private plan",
    mimeType: "application/pdf",
    category: "document",
    byteSize: 2048,
    width: null,
    height: null,
    createdAt: timestamp,
    contentUrl: null,
    nativeContentUrl: null,
    downloadUrl: null,
    collection: "",
    archived: false,
    revision: 0,
    canEdit: true,
  });
  await page.route(`${origin}/api/v1/workspace/assets/${taskId}`, (route) =>
    route.fulfill({
      status: 403,
      json: {
        ok: false,
        error: { code: "FORBIDDEN", message: "Access changed", retryable: false },
        requestId: "fixture",
      },
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "assets", exact: true }).click();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("button", { name: "Confirm archive" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Private plan", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Access changed")).toBeVisible();
});

test("late private read from a previous session cannot repopulate projects", async ({ page }) => {
  await backend(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let switched = false;
  let waiting = false;
  await page.route(`${origin}/api/v1/workspace/projects*`, async (route) => {
    if (switched) return route.fulfill({ json: ok({ projects: [], total: 0 }) });
    waiting = true;
    await gate;
    await route.fulfill({ json: ok({ projects: [project], total: 1 }) }).catch(() => undefined);
  });
  await page.goto(origin);
  try {
    await expect.poll(() => waiting).toBe(true);
    switched = true;
    await page.evaluate(() => window.dispatchEvent(new Event("fixture-session-switch")));
    await expect(page.getByRole("heading", { name: "No projects yet" })).toBeVisible();
    release();
    await expect(page.getByRole("heading", { name: "Launch campaign" })).toHaveCount(0);
  } finally {
    release();
  }
});

test("project Brainstorm shows actual linked sessions and saved ideas", async ({ page }) => {
  await backend(page);
  const session = {
    id: clientId,
    title: "Launch directions",
    projectId: id,
    pinned: true,
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await page.route(`${origin}/api/v1/brainstorm/sessions`, (route) =>
    route.fulfill({ json: ok({ sessions: [session] }) }),
  );
  await page.route(`${origin}/api/v1/brainstorm/sessions/${clientId}`, (route) =>
    route.fulfill({
      json: ok({
        session,
        messages: [],
        ideas: [
          {
            id: taskId,
            sessionId: clientId,
            title: "Maker stories",
            description: "A series of local maker interviews",
            tags: ["social"],
            category: "concept",
            sourceMessageId: null,
            createdAt: timestamp,
          },
        ],
      }),
    }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "detail", exact: true }).click();
  await page.getByRole("button", { name: "Brainstorm", exact: true }).click();
  await expect(page.getByRole("button", { name: "Launch directions", exact: true })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Launch directions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Maker stories", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue session" })).toHaveAttribute(
    "href",
    `/brainstorm?projectId=${id}&sessionId=${clientId}`,
  );
});

test("creation entry keeps real editor routes and project context", async ({ page }) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "creation", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create something extraordinary." })).toBeVisible({
    timeout: 3000,
  });
  await page.getByLabel("Creation project", { exact: true }).selectOption(id);
  await expect(page.getByRole("link", { name: "Start Image Design", exact: true })).toHaveAttribute(
    "href",
    `/studio/create?projectId=${id}`,
  );
  await expect(
    page.getByRole("link", { name: "Start Spatial Content", exact: true }),
  ).toHaveAttribute("href", `/workspace/${id}`);
  await expect(
    page.getByRole("heading", { name: "Editing integrations", exact: true }),
  ).toBeVisible();
});
test("changing creation project confirms before discarding local production notes", async ({
  page,
}) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "creation", exact: true }).click();
  await page.getByLabel("Creation project", { exact: true }).selectOption(id);
  await page.getByLabel("Production notes", { exact: true }).fill("Keep my launch notes");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByLabel("Creation project", { exact: true }).selectOption("");
  await expect(page.getByLabel("Creation project", { exact: true })).toHaveValue(id);
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue(
    "Keep my launch notes",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Creation project", { exact: true }).selectOption("");
  await expect(page.getByLabel("Creation project", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Production notes", { exact: true })).toHaveValue("");
});
test("settings appearance works locally and profile uses actual identity source", async ({
  page,
}) => {
  await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Workspace Settings", exact: true })).toBeVisible({
    timeout: 3000,
  });
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByLabel("Appearance", { exact: true }).selectOption("light");
  expect(await page.evaluate(() => document.documentElement.dataset.shapeTheme)).toBe("light");
  await page.getByRole("button", { name: "profile", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Asha Rao", exact: true })).toBeVisible();
  await expect(page.getByText("asha@example.test", { exact: true })).toBeVisible();
});

test("asset dialog uploads a selected production file through the private endpoint", async ({
  page,
}) => {
  await backend(page);
  const writes: { type: string; bytes: string; key: string | null }[] = [];
  await page.route(`${origin}/api/v1/workspace/uploads?*`, (route) => {
    const url = new URL(route.request().url());
    writes.push({
      type: route.request().headers()["content-type"],
      bytes: route.request().postDataBuffer()!.toString(),
      key: url.searchParams.get("idempotencyKey"),
    });
    expect(url.searchParams.get("projectId")).toBe(id);
    return route.fulfill({
      json: ok({
        asset: {
          id: taskId,
          projectId: id,
          mimeType: "application/pdf",
          byteSize: 13,
          width: null,
          height: null,
          durationSeconds: null,
          createdAt: timestamp,
          contentUrl: null,
          nativeContentUrl: null,
        },
      }),
    });
  });
  await page.goto(origin);
  await page.getByRole("button", { name: "assets", exact: true }).click();
  await page.getByRole("button", { name: "Upload files", exact: true }).click();
  await page.getByLabel("Upload to project").selectOption(id);
  await expect(page.getByLabel("Choose production file")).toBeVisible({ timeout: 3000 });
  await page.getByLabel("Choose production file").setInputFiles({
    name: "brief.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page.getByRole("button", { name: "Upload production file", exact: true }).click();
  await expect(
    page.getByText("Production asset uploaded and ready.", { exact: true }),
  ).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].type).toBe("application/pdf");
  expect(writes[0].bytes).toBe("%PDF-1.4\n%%EOF");
  expect(writes[0].key).toMatch(/^[0-9a-f-]{36}$/);
});

test("project rename duplicate and archive each use persisted revision-aware actions", async ({
  page,
}) => {
  const state = await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Project name", { exact: true }).fill("Renamed launch");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Renamed launch", exact: true })).toBeVisible();
  expect(state.writes.at(-1)).toEqual({ expectedRevision: 1, name: "Renamed launch" });
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  await page.getByRole("button", { name: "Create duplicate", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Renamed launch copy", exact: true }),
  ).toBeVisible();
  await page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Renamed launch", exact: true }) })
    .getByRole("button", { name: "Archive", exact: true })
    .click();
  expect(state.projects[0].status).toBe("active");
  await page.getByRole("button", { name: "Confirm archive", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.projects[0].status).toBe("archived");
  await page.getByRole("button", { name: "Archived", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Renamed launch", exact: true })).toBeVisible();
});
test("client edit saves contact metadata with revision without invitations", async ({ page }) => {
  const state = await backend(page);
  await page.goto(origin);
  await page.getByRole("button", { name: "client detail", exact: true }).click();
  await page.getByRole("button", { name: "Edit client", exact: true }).click();
  await page.getByLabel("Organization", { exact: true }).fill("Mira Collective");
  await page.getByRole("button", { name: "Save client", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.at(-1)).toMatchObject({
    expectedRevision: 1,
    organization: "Mira Collective",
  });
  await expect(page.getByText("Mira Collective", { exact: true }).first()).toBeVisible();
});

test("shared project edit preserves the existing linked client outside own directory", async ({
  page,
}) => {
  const state = await backend(page);
  state.projects[0].clientId = clientId;
  state.projects[0].clientName = "Project owner client";
  await page.route(`${origin}/api/v1/workspace/clients?*`, (route) =>
    route.fulfill({ json: ok({ clients: [], total: 0 }) }),
  );
  await page.goto(origin);
  await page.getByRole("button", { name: "detail", exact: true }).click();
  await page.getByRole("button", { name: "Edit Project", exact: true }).click();
  await expect(page.getByLabel("Client", { exact: true })).toHaveValue(clientId, { timeout: 3000 });
  await page.getByLabel("Description", { exact: true }).fill("Refined production objective");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(state.writes.at(-1)).not.toHaveProperty("clientId");
  expect(state.projects[0].clientId).toBe(clientId);
});
