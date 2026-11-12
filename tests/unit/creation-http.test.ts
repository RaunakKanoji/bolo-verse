import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { creationRequest } from "@/features/creation/creation-http";

afterEach(() => vi.unstubAllGlobals());
it("returns only a validated successful creation response and sends private no-store requests", async () => {
  const fetcher = vi.fn(
    async () => new Response(JSON.stringify({ ok: true, data: { id: "job" }, requestId: "test" })),
  );
  vi.stubGlobal("fetch", fetcher);
  await expect(
    creationRequest("/api/private", z.strictObject({ id: z.string() })),
  ).resolves.toEqual({ id: "job" });
  expect(fetcher).toHaveBeenCalledWith(
    "/api/private",
    expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
  );
});
it("keeps provider failures actionable and rejects malformed response data", async () => {
  vi.stubGlobal(
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "UNAVAILABLE",
            message: "Image provider is unavailable.",
            retryable: true,
          },
          requestId: "test",
        }),
        { status: 503 },
      ),
  );
  await expect(creationRequest("/api/private", z.strictObject({ id: z.string() }))).rejects.toThrow(
    "Image provider is unavailable.",
  );
  vi.stubGlobal(
    "fetch",
    async () => new Response(JSON.stringify({ ok: true, data: { id: 8 }, requestId: "test" })),
  );
  await expect(creationRequest("/api/private", z.strictObject({ id: z.string() }))).rejects.toThrow(
    "invalid response",
  );
});
it("forwards cancellation to the private HTTP request", async () => {
  const controller = new AbortController();
  let sent: AbortSignal | undefined;
  vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
    sent = options.signal as AbortSignal;
    return await new Promise((_resolve, reject) =>
      sent!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))),
    );
  });
  const result = creationRequest("/api/private", z.object({}), {}, controller.signal);
  controller.abort();
  await expect(result).rejects.toThrow("interrupted");
  expect(sent?.aborted).toBe(true);
});

it.each([401, 403])(
  "preserves verified HTTP %i access denial even when the response body is invalid",
  async (status) => {
    vi.stubGlobal("fetch", async () => new Response("Authentication required", { status }));
    await expect(creationRequest("/api/private", z.object({}))).rejects.toMatchObject({
      name: "CreationAccessError",
      status,
    });
  },
);
