import type { z } from "zod";
import { apiResultSchema } from "@/lib/contracts/api";

export class CreationAccessError extends Error {
  readonly name = "CreationAccessError";
  constructor(readonly status: 401 | 403) {
    super("Your project access changed. Reopen an authorized project to continue.");
  }
}

/** Creation requests are bounded and never cache private project data. */
export async function creationRequest<T>(
  url: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
  upstream?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  upstream?.addEventListener("abort", abort, { once: true });
  if (upstream?.aborted) abort();
  const timer = setTimeout(abort, 30_000);
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    if (response.status === 401 || response.status === 403)
      throw new CreationAccessError(response.status);
    const parsed = apiResultSchema(schema).safeParse(await response.json());
    controller.signal.throwIfAborted();
    if (!parsed.success)
      throw new Error(
        "The creation service returned an invalid response. Refresh before retrying.",
      );
    if (!parsed.data.ok) throw new Error(parsed.data.error.message);
    if (!response.ok) throw new Error("The creation request failed. Refresh before retrying.");
    return parsed.data.data;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "The request was interrupted. Refresh history to check whether your job was accepted before retrying.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener("abort", abort);
  }
}
