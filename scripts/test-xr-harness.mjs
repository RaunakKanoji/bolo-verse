import { build } from "esbuild";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  absWorkingDir: root,
  entryPoints: ["tests/browser-fixtures/xr-workspace-entry.tsx"],
  bundle: true, write: false, platform: "browser", format: "esm", target: "es2022",
  outfile: "test-results/xr-component-harness/entry.js",
  tsconfig: "apps/web/tsconfig.json", jsx: "automatic",
  // The harness has no Next router/compiler. Navigation is covered against the
  // real Next server; use an ordinary anchor only at this framework boundary.
  alias: { "next/link": resolve(root, "tests/browser-fixtures/next-link.tsx"), "@clerk/nextjs": resolve(root, "tests/browser-fixtures/voice-clerk.ts") },
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".module.css": "local-css" },
  logLevel: "error",
});
if (process.argv.includes("--build-only")) {
  process.stdout.write("XR component harness bundle built successfully.\n");
  process.exit(0);
}
const files = new Map(result.outputFiles.map(file => [`/${basename(file.path)}`, file.contents]));
files.set("/vendor/aframe/aframe-1.8.0.min.js", await readFile(resolve(root, "apps/web/public/vendor/aframe/aframe-1.8.0.min.js")));
const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>XR component test harness</title><link rel="stylesheet" href="/entry.css"><style>body{margin:0;padding:24px;font:15px system-ui,sans-serif;background:#f5f7fb;color:#1d1d1f}h1{font-size:20px}button,input,textarea,select{font:inherit}.fixture-note{padding:12px;border:1px solid #dfe4ec;margin-bottom:20px}</style></head><body><h1>XR component test harness</h1><p class="fixture-note">Test fixtures only. No authentication, private project data or live providers.</p><main id="root"></main><script type="module" src="/entry.js"></script></body></html>';
const server = createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (path === "/") { response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(html); return; }
  const file = files.get(path);
  if (file) { response.setHeader("Content-Type", path.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8"); response.end(file); return; }
  // Fixture data and API requests must be explicitly intercepted by each test.
  // No fallback database/auth route is provided by this server.
  response.statusCode = 404;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ error: "No test fixture registered for this request." }));
});
server.on("error", error => { process.stderr.write(`${error.message}\n`); process.exit(1); });
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string") process.stdout.write(`XR_HARNESS_READY ${address.port}\n`);
});
function stop() { server.closeAllConnections(); server.close(() => process.exit(0)); }
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
