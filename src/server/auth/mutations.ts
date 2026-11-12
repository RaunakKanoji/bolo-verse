import "server-only";
import type { z } from "zod";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "./errors";

const MAX_JSON_BYTES = 16_384;

/** Cookie-authenticated writes require an exact, explicitly configured browser origin. */
export function requireMutationOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !getServerEnv().ALLOWED_ORIGINS.includes(origin)) {
    throw new BoundaryError(403, "FORBIDDEN", "This request origin is not allowed.");
  }
}

export async function readMutationJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new BoundaryError(415, "INVALID_INPUT", "Send this request as application/json.");
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && !/^\d+$/.test(contentLength)) {
    throw new BoundaryError(400, "INVALID_INPUT", "The request body length is invalid.");
  }
  if (contentLength !== null && Number(contentLength) > MAX_JSON_BYTES) {
    throw new BoundaryError(413, "INVALID_INPUT", "The request body is too large.");
  }
  if (!request.body) throw new BoundaryError(400, "INVALID_INPUT", "A JSON request body is required.");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  let input: unknown;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_JSON_BYTES) {
        throw new BoundaryError(413, "INVALID_INPUT", "The request body is too large.");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    input = JSON.parse(text);
  } catch (error) {
    // Decoding can fail before the stream ends; cancel remaining bytes before release.
    // Cancellation failure must not replace the original bounded-input error.
    await reader.cancel().catch(() => undefined);
    if (error instanceof BoundaryError) throw error;
    throw new BoundaryError(400, "INVALID_INPUT", "The request body must contain valid JSON.");
  } finally {
    reader.releaseLock();
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new BoundaryError(400, "INVALID_INPUT", "Provide a valid project name and objective, without extra fields.");
  }
  return parsed.data;
}
