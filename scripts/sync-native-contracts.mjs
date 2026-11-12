import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const destination = resolve(root, "apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated");
const check = process.argv.includes("--check");
const sources = [
  "packages/api-contract/generated/ShapeModels.swift",
  "packages/api-contract/generated/ShapeAPIRoutes.swift",
  "packages/design-tokens/generated/ShapeTokens.swift",
];
for (const source of sources) {
  const expected = await readFile(resolve(root, source), "utf8");
  const output = resolve(destination, source.split("/").at(-1));
  if (check) {
    if (await readFile(output, "utf8").catch(() => "") !== expected) throw new Error(`Native contract drift: ${source}`);
  } else {
    await mkdir(destination, { recursive: true });
    await writeFile(output, expected);
  }
}
console.log(`${check ? "Checked" : "Synced"} ${sources.length} native contract/token sources.`);
