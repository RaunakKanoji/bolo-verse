import "server-only";
import { createClerkClient } from "@clerk/backend";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "./errors";
import { getCurrentSubject } from "./identity";
import { requireMutationOrigin } from "./mutations";

const unauthorized = () => new BoundaryError(401, "UNAUTHORIZED", "Sign in again to access your projects.");

/** The publishable key identifies the same Clerk instance used by the native SDK. */
function expectedIssuer(publishableKey: string): string {
  const encoded = /^pk_(?:test|live)_([A-Za-z0-9+/=]+)$/.exec(publishableKey)?.[1];
  const decoded = encoded ? Buffer.from(encoded, "base64").toString("utf8") : "";
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\$$/.test(decoded)) {
    throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Clerk native authentication is not configured correctly.");
  }
  return `https://${decoded.slice(0, -1)}`;
}

/** Only v1 accepts explicit native bearer transport; legacy web policy is unchanged. */
export async function getV1Subject(request: Request, options: { mutation?: boolean } = {}): Promise<string> {
  const authorization = request.headers.get("authorization");
  if (authorization === null) {
    const subject = await getCurrentSubject();
    if (options.mutation || request.headers.has("origin")) requireMutationOrigin(request);
    return subject;
  }
  // A malformed or invalid supplied token must never fall back to ambient cookies.
  if (authorization.length > 16_384 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(authorization)) throw unauthorized();
  const env = getServerEnv();
  if (!env.CLERK_SECRET_KEY || !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.DATABASE_URL) {
    throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Clerk and database configuration are required to access projects.");
  }
  const issuer = expectedIssuer(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  // Deliberately omit cookies and all client-supplied forwarding headers. Identity
  // must be established from this bearer alone before Origin can be optional.
  const bearerRequest = new Request(request.url, { headers: { Authorization: authorization } });
  let subject: string;
  try {
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });
    const state = await clerk.authenticateRequest(bearerRequest, { acceptsToken: "session_token", issuer, jwtKey: env.CLERK_JWT_KEY });
    const identity = state.toAuth();
    if (!identity?.userId || !identity.sessionId) throw unauthorized();
    // Native session tokens can omit azp. A present web party must still be ours.
    const party = identity.sessionClaims?.azp;
    if (party !== undefined && (typeof party !== "string" || !env.ALLOWED_ORIGINS.includes(party))) throw unauthorized();
    subject = identity.userId;
  } catch {
    throw unauthorized();
  }
  if (request.headers.has("origin")) requireMutationOrigin(request);
  return subject;
}
