import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { copyFile, mkdir, readFile } from "node:fs/promises";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const distribution = dirname(require.resolve("aframe"));
const packageRoot = resolve(distribution, "..");
const installed = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
if (installed.version !== "1.8.0") {
  throw new Error("Review XR runtime compatibility before changing the pinned A-Frame 1.8.0 bundle.");
}
const destination = resolve(import.meta.dirname, "../apps/web/public/vendor/aframe");
await mkdir(destination, { recursive: true });
await copyFile(resolve(distribution, "aframe-master.min.js"), resolve(destination, "aframe-1.8.0.min.js"));
await copyFile(resolve(packageRoot, "LICENSE"), resolve(destination, "LICENSE"));
