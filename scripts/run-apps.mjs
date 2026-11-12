import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const root = fileURLToPath(new URL("..", import.meta.url));
const [mode, ...args] = process.argv.slice(2);
if (!["dev", "start"].includes(mode)) {
  console.error("Usage: pnpm dev|start [--hostname host] [--port port]");
  process.exit(1);
}
nextEnv.loadEnvConfig(root, mode === "dev");
let hostname = "127.0.0.1";
let port = Number(process.env.PORT || 3000);
for (let index = 0; index < args.length; index += 2) {
  const value = args[index + 1];
  if (!value) throw new Error("A hostname or port value is required.");
  if (["--hostname", "-H"].includes(args[index])) hostname = value;
  else if (["--port", "-p"].includes(args[index])) port = Number(value);
  else throw new Error("Only --hostname and --port are supported.");
}
if (!Number.isInteger(port) || port < 1 || port > 65534) throw new Error("Port must be an integer from 1 to 65534.");
const spatialPort = Number(process.env.SPATIAL_PORT || port + 1);
if (!Number.isInteger(spatialPort) || spatialPort < 1 || spatialPort > 65535 || spatialPort === port) throw new Error("Spatial port must be a distinct valid port.");
const browserOrigin = `http://${hostname.includes(":") ? `[${hostname}]` : hostname}:${port}`;
const common = { ...process.env, NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || browserOrigin };
const spatialOrigin = `http://127.0.0.1:${spatialPort}`;
const internalHost = hostname === "0.0.0.0" ? "127.0.0.1" : hostname === "::" ? "::1" : hostname;
const webOrigin = `http://${internalHost.includes(":") ? `[${internalHost}]` : internalHost}:${port}`;
if (mode === "dev") execFileSync(process.execPath, ["scripts/prepare-xr.mjs"], { cwd: root, stdio: "inherit" });
const children = new Set();
let stopping = false;
let stopTimer;
function signalChildren(signal) {
  // Next CLI owns and shuts down its development worker. Signal only our
  // direct children; process-group signals can be forbidden in managed shells.
  for (const child of children) child.kill(signal);
}
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  signalChildren("SIGTERM");
  stopTimer = setTimeout(() => signalChildren("SIGKILL"), 5000);
}
// Resolve both binaries before either server starts, so a missing installation
// cannot leave the other application running.
const binaries = Object.fromEntries(["web", "spatial-web"].map((app) => [app, createRequire(new URL(`../apps/${app}/package.json`, import.meta.url)).resolve("next/dist/bin/next")]));
function launch(app, bind, appPort, env) {
  const child = spawn(process.execPath, [binaries[app], mode, "--hostname", bind, "--port", String(appPort)], {
    cwd: fileURLToPath(new URL(`../apps/${app}`, import.meta.url)), env, stdio: "inherit",
  });
  children.add(child);
  child.once("error", () => { children.delete(child); console.error(`Could not start ${app}.`); stop(1); });
  child.once("exit", (code) => {
    children.delete(child);
    if (!stopping) stop(code || 1);
    if (!children.size && stopTimer) clearTimeout(stopTimer);
  });
}
const spatialEnv = { ...common, WEB_INTERNAL_ORIGIN: webOrigin };
// The spatial shell needs only session transport to the web API, no provider,
// database, storage or Clerk server credentials.
for (const key of Object.keys(spatialEnv)) {
  if (/^(?:CLERK_|DATABASE_|R2_|GEMINI_|SARVAM_|SHOTSTACK_)/.test(key)) delete spatialEnv[key];
}
try {
  launch("spatial-web", "127.0.0.1", spatialPort, spatialEnv);
  launch("web", hostname, port, { ...common, SPATIAL_WEB_ORIGIN: spatialOrigin });
} catch (error) { stop(1); throw error; }
process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));
