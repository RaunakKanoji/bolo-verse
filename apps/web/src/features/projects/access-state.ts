import "server-only";
import { BoundaryError } from "@/server/auth/errors";
import type { AccessState } from "./ProjectAccessNotice";

export function projectAccessState(error: unknown): AccessState {
  if (error instanceof BoundaryError) {
    if (error.status === 401) return "sign-in";
    if (error.status === 403 || error.status === 404) return "denied";
    if (error.code === "PROVIDER_UNCONFIGURED") return "unconfigured";
  }
  return "unavailable";
}
