import nextEnv from "@next/env";
import { createClerkClient } from "@clerk/backend";
import { getServerEnv } from "../src/server/config/env";
import { withDatabase } from "../src/server/db/client";
import { seedSampleProject } from "../src/server/db/seed";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const subject = process.argv[2];
  if (!subject || !/^user_[a-zA-Z0-9]+$/.test(subject)) {
    throw new Error("Usage: pnpm db:seed user_<existing Clerk subject>");
  }
  const env = getServerEnv();
  if (!env.DATABASE_URL || !env.CLERK_SECRET_KEY) {
    throw new Error("Configure DATABASE_URL and CLERK_SECRET_KEY before seeding.");
  }
  // Seeding grants no fake identity: this must resolve to an existing user in this instance.
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  let resolvedId: string;
  try {
    resolvedId = (await clerk.users.getUser(subject)).id;
  } catch {
    throw new Error("Could not resolve that existing Clerk account. Check the subject and configured Clerk instance.");
  }
  if (resolvedId !== subject) throw new Error("Clerk account resolution did not match the supplied subject.");
  const projectId = await withDatabase((database) => seedSampleProject(database, resolvedId));
  console.log(`Seeded fictional sample project ${projectId}. Brief remains proposed; no outputs or approvals were created.`);
}

main().catch((error: unknown) => {
  // Driver failures can contain connection strings. Print only our setup messages.
  const message = error instanceof Error && (
    error.message.startsWith("Usage:") || error.message.startsWith("Configure ") ||
    error.message.startsWith("Could not resolve") || error.message.startsWith("Clerk account resolution")
  ) ? error.message : "Seed failed. Check configuration and apply the checked-in database migrations first.";
  console.error(message);
  process.exitCode = 1;
});
