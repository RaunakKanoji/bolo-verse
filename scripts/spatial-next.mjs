import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

// Public Clerk configuration must be compiled into both browser clients from
// the same local environment; the spatial runtime receives no backend secrets.
const root = fileURLToPath(new URL("..", import.meta.url));
nextEnv.loadEnvConfig(root, process.argv[2] === "dev");
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/^(?:CLERK_|DATABASE_|R2_|GEMINI_|SARVAM_|SHOTSTACK_)/.test(key)) delete env[key];
}
const require = createRequire(new URL("../apps/spatial-web/package.json", import.meta.url));
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), ...process.argv.slice(2)], {
  cwd: fileURLToPath(new URL("../apps/spatial-web", import.meta.url)), env, stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
child.once("error", () => { console.error("Could not start the spatial application command."); process.exitCode = 1; });
child.once("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
