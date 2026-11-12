import "server-only";
import type { ApiResult } from "@/lib/contracts";

export class BoundaryError extends Error {
  constructor(
    readonly status: number,
    readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "INVALID_INPUT" | "PROVIDER_UNCONFIGURED" | "SERVICE_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "BoundaryError";
  }
}

export function successResponse<T>(data: T, requestId: string): Response {
  const body: ApiResult<T> = { ok: true, data, requestId };
  return Response.json(body, { headers: { "Cache-Control": "no-store" } });
}

export function errorResponse(error: unknown, requestId: string): Response {
  const known = error instanceof BoundaryError;
  const status = known ? error.status : 503;
  const body: ApiResult<never> = {
    ok: false,
    error: {
      code: known ? error.code : "SERVICE_UNAVAILABLE",
      message: known ? error.message : "The workspace service is temporarily unavailable.",
      retryable: status === 503,
    },
    requestId,
  };
  // Never serialize driver/auth errors: they may contain credentials or SQL data.
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
