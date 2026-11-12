import { describe, expect, it } from "vitest";
import { createSessionFetch } from "../src/lib/session-transport";

describe("session-owned spatial requests", () => {
  it("renews a token before mutations and uses only the existing same-origin API", async () => {
    const events: string[] = [];
    let captured: RequestInit | undefined;
    const session = {
      id: "session_a",
      getToken: async (options?: { skipCache?: boolean }) => {
        events.push(options?.skipCache ? "renew" : "token");
        return "verified-by-backend";
      },
    };
    const fetcher = createSessionFetch(session, new AbortController().signal, (async (
      _path,
      init,
    ) => {
      events.push("fetch");
      captured = init;
      return Response.json({ ok: true });
    }) as typeof fetch);
    await fetcher("/api/v1/projects/123/spatial-scene", { method: "PUT" });
    expect(events).toEqual(["renew", "fetch"]);
    expect(new Headers(captured?.headers).get("authorization")).toBe("Bearer verified-by-backend");
    expect(captured?.credentials).toBe("same-origin");
    expect(captured?.cache).toBe("no-store");
    expect(captured?.redirect).toBe("error");
    await expect(fetcher("https://foreign.test/api/v1/projects")).rejects.toThrow(/same-origin/i);
  });
  it("never sends a request when its session ends while token renewal is pending", async () => {
    let resolveToken!: (token: string) => void;
    let requests = 0;
    const lifetime = new AbortController();
    const fetcher = createSessionFetch(
      {
        id: "session_a",
        getToken: () =>
          new Promise((resolve) => {
            resolveToken = resolve;
          }),
      },
      lifetime.signal,
      (async () => {
        requests++;
        return Response.json({});
      }) as typeof fetch,
    );
    const pending = fetcher("/api/v1/projects");
    lifetime.abort();
    resolveToken("old-session-token");
    await expect(pending).rejects.toThrow();
    expect(requests).toBe(0);
  });
  it("discards a late response after sign-out even if a transport ignores abort", async () => {
    let finish!: (response: Response) => void;
    const lifetime = new AbortController();
    const fetcher = createSessionFetch(
      { id: "session_a", getToken: async () => "token" },
      lifetime.signal,
      (() =>
        new Promise((resolve) => {
          finish = resolve;
        })) as typeof fetch,
    );
    const pending = fetcher("/api/v1/projects");
    await Promise.resolve();
    lifetime.abort();
    finish(Response.json({ private: "old account" }));
    await expect(pending).rejects.toThrow();
  });
});
