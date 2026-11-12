import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

// Load the existing root .env files before Next initializes its app-dir env
// cache. This also covers direct filtered app builds outside run-apps.mjs.
const root = fileURLToPath(new URL("..", import.meta.url));
nextEnv.loadEnvConfig(root, process.argv[2] === "dev");
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...process.argv.slice(2)], {
  cwd: fileURLToPath(new URL("../apps/web", import.meta.url)), env: process.env, stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
child.once("error", () => { console.error("Could not start the web application command."); process.exitCode = 1; });
child.once("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
