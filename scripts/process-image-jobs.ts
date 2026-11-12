import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
// Requires `--conditions=react-server` to load the same server-only worker as Next.
const { runImageGenerationBatch } = await import("../apps/web/src/server/services/image-generation");
try {
  console.log(JSON.stringify(await runImageGenerationBatch(5)));
} catch {
  console.error("The image worker could not complete its batch. Check database and provider configuration.");
  process.exitCode = 1;
}
