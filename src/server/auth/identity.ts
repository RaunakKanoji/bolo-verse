import "server-only";
import { auth } from "@clerk/nextjs/server";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "./errors";

export async function getCurrentSubject(): Promise<string> {
  const env = getServerEnv();
  if (!env.CLERK_SECRET_KEY || !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || !env.DATABASE_URL) {
    throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Clerk and database configuration are required to access projects.");
  }
  // Clerk validates the session via proxy.ts. No header, query or demo user ID is accepted.
  const { userId } = await auth();
  if (!userId) {
    throw new BoundaryError(401, "UNAUTHORIZED", "Sign in to access your projects.");
  }
  return userId;
}
