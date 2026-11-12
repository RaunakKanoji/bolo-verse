import nextEnv from "@next/env";
import { z } from "zod";
import { parseServerEnv } from "../src/server/config/env";

nextEnv.loadEnvConfig(process.cwd());
try {
  parseServerEnv(process.env);
  console.log("Server environment is valid. Unconfigured integrations remain unavailable.");
} catch (error) {
  const fields = error instanceof z.ZodError
    ? [...new Set(error.issues.map((issue) => issue.path.join(".")))].join(", ")
    : "configuration";
  // Never print raw input, URLs, tokens or provider credentials in build logs.
  console.error(`Invalid server environment: ${fields}. Check the environment documentation.`);
  process.exitCode = 1;
}
