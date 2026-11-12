import "server-only";
import type { ProviderId } from "@/lib/contracts";

export class ProviderUnconfiguredError extends Error {
  readonly code = "PROVIDER_UNCONFIGURED";
  readonly retryable = false;
  constructor(readonly provider: ProviderId, readonly missing: string[]) {
    super(`${provider} is not configured. Missing: ${missing.join(", ")}`);
    this.name = "ProviderUnconfiguredError";
  }
}

export class ProviderNotImplementedError extends Error {
  readonly code = "PROVIDER_NOT_IMPLEMENTED";
  readonly retryable = false;
  constructor(readonly provider: ProviderId) {
    super(`${provider} has configuration, but its live adapter is not implemented in M0.`);
    this.name = "ProviderNotImplementedError";
  }
}
