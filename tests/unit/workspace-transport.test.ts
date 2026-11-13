import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { workspaceRequest } from "../../apps/web/src/features/platform/use-workspace-data";
describe("workspace private transport", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("keeps denial status even when an upstream returns HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>Forbidden</html>", { status: 403 })),
    );
    await expect(
      workspaceRequest(
        "projects",
        z.object({ projects: z.array(z.string()) }),
        new AbortController().signal,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("validates success bodies instead of exposing untrusted records", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ ok: true, data: { projects: "private-invalid" }, requestId: "fixture" }),
        ),
    );
    await expect(
      workspaceRequest(
        "projects",
        z.object({ projects: z.array(z.string()) }),
        new AbortController().signal,
      ),
    ).rejects.toThrow("unexpected response");
  });
  it("makes no-store same-origin reads with caller cancellation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true, data: { projects: [] }, requestId: "fixture" }));
    vi.stubGlobal("fetch", fetcher);
    const controller = new AbortController();
    await expect(
      workspaceRequest("projects", z.object({ projects: z.array(z.string()) }), controller.signal),
    ).resolves.toEqual({ projects: [] });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/workspace/projects",
      expect.objectContaining({
        signal: controller.signal,
        cache: "no-store",
        credentials: "same-origin",
        method: "GET",
      }),
    );
  });
});
