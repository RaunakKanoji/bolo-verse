import { build } from "esbuild";
import { createServer } from "node:http";
import { basename, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const result = await build({
  absWorkingDir: root,
  entryPoints: ["tests/browser-fixtures/project-submission-entry.tsx"],
  bundle: true,
  write: false,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outfile: "test-results/project-submission-component-harness/entry.js",
  tsconfig: "apps/web/tsconfig.json",
  jsx: "automatic",
  alias: {
    "@clerk/nextjs": resolve(root, "tests/browser-fixtures/workspace-auth.ts"),
    "next/link": resolve(root, "tests/browser-fixtures/next-link.tsx"),
    "next/navigation": resolve(root, "tests/browser-fixtures/creation-navigation.ts"),
  },
  define: { "process.env.NODE_ENV": '"development"' },
  loader: { ".module.css": "local-css" },
  logLevel: "error",
});
if (process.argv.includes("--build-only")) {
  process.stdout.write("Project submission component harness bundle built successfully.\n");
  process.exit(0);
}
const files = new Map(result.outputFiles.map((file) => [`/${basename(file.path)}`, file.contents]));
const html =
  '<!doctype html><html lang="en" data-shape-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Project submission component fixture</title><link rel="stylesheet" href="/entry.css"><style>*{box-sizing:border-box}body{padding:24px;font:15px system-ui;background:var(--canvas);color:var(--text-primary)}main{max-width:1250px}button,input,textarea,select{font:inherit}button{cursor:pointer}</style></head><body><h1>Project submission component fixture</h1><p>HTTP fixtures only. No production authentication bypass, private data or provider calls.</p><main id="root"></main><script type="module" src="/entry.js"></script></body></html>';
const server = createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (path === "/") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(html);
    return;
  }
  const file = files.get(path);
  if (file) {
    response.setHeader(
      "Content-Type",
      path.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8",
    );
    response.end(file);
    return;
  }
  response.statusCode = 404;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ error: "No test fixture registered." }));
});
server.on("error", (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string")
    process.stdout.write(`SUBMISSION_HARNESS_READY ${address.port}\n`);
});
function stop() {
  server.closeAllConnections();
  server.close(() => process.exit(0));
}
process.once("SIGTERM", stop);
process.once("SIGINT", stop);
