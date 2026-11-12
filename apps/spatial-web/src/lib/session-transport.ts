export type SpatialSession = {
  id: string;
  getToken: (options?: { skipCache?: boolean }) => Promise<string | null>;
};

/** A session owns its requests. Tokens remain transient request headers, never cached here. */
export function createSessionFetch(
  session: SpatialSession,
  lifetime: AbortSignal,
  fetcher: typeof fetch = fetch,
): typeof fetch {
  return async (path, init) => {
    if (typeof path !== "string" || !/^\/api\/v1\/(?:[a-zA-Z0-9_-]+\/?)+$/.test(path))
      throw new Error("A same-origin API path is required.");
    const signal = init?.signal ? AbortSignal.any([lifetime, init.signal]) : lifetime;
    signal.throwIfAborted();
    const method = (init?.method ?? "GET").toUpperCase();
    // The provider renews ambient cookies; writes also obtain a freshly minted token
    // so an expired ambient cookie cannot prevent the backend verifying this request.
    const token = await session.getToken({ skipCache: method !== "GET" && method !== "HEAD" });
    signal.throwIfAborted();
    if (!token) throw new Error("Your session is unavailable.");
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetcher(path, {
      ...init,
      headers,
      signal,
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    });
    signal.throwIfAborted();
    return response;
  };
}
