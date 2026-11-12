// Simple fixed-window, in-memory rate limiter (default 30 requests/min per user per function).
// NOTE: memory is per Edge Function isolate, so this is best-effort; isolates can be
// recycled or run in parallel. Good enough for a hackathon. M7 may move this to a table.

const windows = new Map<string, { start: number; count: number }>();

/**
 * Returns true if the call is allowed.
 * @param key  e.g. `${fn}:${userId}`
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now - w.start >= windowMs) {
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  w.count += 1;
  return w.count <= limit;
}
