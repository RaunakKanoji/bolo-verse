import nextEnv from "@next/env";
import { z } from "zod";
import { parseServerEnv } from "../apps/web/src/server/config/env";
import { demoPreflight } from "./lib/demo-preflight";

// No network, DB writes, credentials in arguments, or provider calls.
try {
  nextEnv.loadEnvConfig(process.cwd());
  parseServerEnv(process.env);
  console.log(JSON.stringify(demoPreflight(process.env), null, 2));
  if (!demoPreflight(process.env).configurationComplete) process.exitCode = 1;
} catch (error) {
  const fields = error instanceof z.ZodError
    ? [...new Set(error.issues.map(issue => issue.path.join(".")))].join(", ")
    : "configuration";
  console.error(`Demo preflight failed: invalid ${fields}. Values are omitted.`);
  process.exitCode = 1;
}
