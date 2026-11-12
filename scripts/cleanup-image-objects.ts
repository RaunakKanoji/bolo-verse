import { loadEnvConfig } from "@next/env";

// Invoke with node --conditions=react-server --import tsx. Default is read-only.
loadEnvConfig(process.cwd());
try {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some((argument) => argument !== "--apply")) throw new Error("Usage: jobs:cleanup [--apply]");
  const { runImageCleanupBatch } = await import("../apps/web/src/server/services/image-cleanup");
  const result = await runImageCleanupBatch({ apply: args.includes("--apply") });
  console.log(JSON.stringify(result));
  if (result.failed) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith("Usage:") ? error.message : "Image cleanup could not complete. Check private storage and database configuration.");
  process.exitCode = 1;
}
