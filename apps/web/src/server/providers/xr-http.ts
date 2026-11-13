import "server-only";
import { BoundaryError } from "@/server/auth/errors";

export type ProviderFetch = typeof fetch;

/** Bound streaming responses before parsing, including absent/incorrect length headers. */
export async function readBoundedBytes(response: Response, limit: number): Promise<Uint8Array> {
  if (!response.body) throw new Error("Empty response");
  const length = response.headers.get("content-length");
  if (length && Number(length) > limit) {
    await response.body.cancel();
    throw new Error("Response limit");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) throw new Error("Response limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function providerJson(
  fetcher: ProviderFetch,
  url: string,
  init: RequestInit,
  maxBytes = 65_536,
  options: { retryTransient?: boolean } = {},
): Promise<unknown> {
  try {
    const timeout = AbortSignal.timeout(25_000);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    signal.throwIfAborted();
    let response = await fetcher(url, { ...init, signal, redirect: "error", cache: "no-store" });
    // Opt-in only: a single retry after an explicit transient HTTP response.
    // Network failures/timeouts may already have incurred charges and are never retried.
    // Both attempts share the original deadline; existing XR/speech callers stay single-shot.
    if (options.retryTransient && [429, 500, 502, 503, 504].includes(response.status) &&
      (!response.headers.has("retry-after") || /^0(?:\.\d+)?$|^1$/.test(response.headers.get("retry-after")!))) {
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.floor(Math.random() * 250)));
      signal.throwIfAborted();
      response = await fetcher(url, { ...init, signal, redirect: "error", cache: "no-store" });
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 429)
        throw new BoundaryError(
          429,
          "RATE_LIMITED",
          "The assistant provider is busy. Try again later.",
        );
      throw new Error("Provider rejected request");
    }
    const bytes = await readBoundedBytes(response, maxBytes);
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof BoundaryError) throw error;
    throw new BoundaryError(
      503,
      "SERVICE_UNAVAILABLE",
      "The assistant provider could not complete this request. Try again later.",
    );
  }
}
