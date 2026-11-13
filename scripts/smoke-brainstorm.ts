import nextEnv from "@next/env";
import { ResourceIdSchema } from "../apps/web/src/lib/contracts/api";
import { BrainstormResponseSchema } from "../apps/web/src/lib/contracts/brainstorm";
import { readBoundedBytes } from "../apps/web/src/server/providers/xr-http";

// Explicit opt-in only. May incur Gemini charges; no raw prompt/reply/token is printed.
class SmokeError extends Error {}
async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const [flag, address, id] = process.argv.slice(2);
  if (flag !== "--live" || !address || !ResourceIdSchema.safeParse(id).success) throw new SmokeError("Usage: --live <app-origin> <authorized-project-uuid>. Set BRAINSTORM_SMOKE_TOKEN to a valid Clerk session JWT.");
  const origin = new URL(address);
  if (!['https:', 'http:'].includes(origin.protocol) || (origin.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new SmokeError("Use an HTTPS origin or local loopback origin without credentials, path, query or fragment.");
  const token = process.env.BRAINSTORM_SMOKE_TOKEN;
  if (!token || token.length > 16384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new SmokeError("A valid BRAINSTORM_SMOKE_TOKEN is required; never pass credentials in arguments.");
  const response = await fetch(`${origin.origin}/api/v1/projects/${id}/brainstorm`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Suggest three concise campaign directions grounded in the saved brief." }),
    signal: AbortSignal.timeout(40000), redirect: "error", cache: "no-store",
  });
  const result = BrainstormResponseSchema.safeParse(JSON.parse(new TextDecoder().decode(await readBoundedBytes(response, 65536))));
  if (!result.success) throw new SmokeError(`Smoke failed: unexpected response (HTTP ${response.status}).`);
  if (!result.data.ok) throw new SmokeError(`Smoke failed: ${result.data.error.code} (HTTP ${response.status}).`);
  if (!response.ok) throw new SmokeError(`Smoke failed (HTTP ${response.status}).`);
  console.log(JSON.stringify({ result: "PASS", requestId: result.data.requestId, providerStatus: result.data.data.providerStatus,
    format: result.data.data.format, sourceBriefVersion: result.data.data.sourceBriefVersion, directionCount: result.data.data.directions.length }));
}
main().catch((error: unknown) => {
  // Only our own fixed messages are safe; fetch/driver messages can contain credentials.
  const message = error instanceof SmokeError ? error.message : "Live smoke could not complete. Check the server configuration, session and connection.";
  console.error(message); process.exitCode = 1;
});
