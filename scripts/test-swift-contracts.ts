import { deepStrictEqual, notEqual, strictEqual } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ShapeApiSchemas } from "../src/lib/contracts/shape";

const scratch = await mkdtemp(join(tmpdir(), "shape-contracts-"));
const models = "packages/api-contract/generated/ShapeModels.swift";
const routes = "packages/api-contract/generated/ShapeAPIRoutes.swift";
const executable = join(scratch, "roundtrip");
const compilerOptions = ["swiftc", "-swift-version", "6", "-module-cache-path", join(scratch, "cache")];
function command(args: string[]) {
  const result = spawnSync("xcrun", args, { encoding: "utf8", timeout: 60_000 });
  if (result.error || result.status !== 0) throw new Error(`${args.join(" ")} failed: ${result.error?.message ?? result.stderr}`);
}
try {
  command([...compilerOptions, "-typecheck", models, routes, "packages/design-tokens/generated/ShapeTokens.swift"]);
  command([...compilerOptions, models, routes, "packages/api-contract/fixtures/Roundtrip.swift", "-o", executable]);
  const fixtures = JSON.parse(await readFile("packages/api-contract/fixtures/roundtrip.json", "utf8")) as { schema: keyof typeof ShapeApiSchemas; value: unknown }[];
  for (const fixture of fixtures) {
    ShapeApiSchemas[fixture.schema].parse(fixture.value);
    const result = spawnSync(executable, [fixture.schema], { input: JSON.stringify(fixture.value), encoding: "utf8" });
    strictEqual(result.status, 0, result.stderr);
    const decoded: unknown = JSON.parse(result.stdout);
    deepStrictEqual(decoded, fixture.value, `${fixture.schema} changed during Swift roundtrip`);
    ShapeApiSchemas[fixture.schema].parse(decoded);
  }
  const base = fixtures[0].value as Record<string, unknown>;
  const missingNull = { ...base }; delete missingNull.updatedAt;
  const invalid = [
    { schema: "CreativeDraftSnapshot", value: missingNull },
    { schema: "CreativeDraftSnapshot", value: { ...base, secret: "unexpected" } },
    { schema: "CreativeDraftSnapshot", value: { ...base, document: { ...(base.document as object), mode: "unsupported" } } },
    { schema: "CreativeDraftSnapshot", value: { ...base, document: { ...(base.document as object), schemaVersion: 2 } } },
    { schema: "ErrorResponse", value: { ...(fixtures[5].value as object), ok: true } },
    { schema: "UpdateProject", value: { name: null } },
  ];
  const scene = JSON.parse(await readFile("packages/api-contract/fixtures/canonical-scene.json", "utf8")) as { objects: Record<string, unknown>[] };
  for (const replacement of [{ position: [0, 0] }, { rotation: [0, 0, 0, 1, 0] }, { scale: [1, "bad", 1] }]) {
    invalid.push({ schema: "CanonicalSpatialScene", value: { ...scene, objects: [{ ...scene.objects[0], ...replacement }] } });
  }
  const invalidConstruction = spawnSync(executable, ["constructMalformedVector"], { encoding: "utf8" });
  notEqual(invalidConstruction.status, 0, "Swift encoded a malformed constructed vector");
  for (const fixture of invalid) {
    const result = spawnSync(executable, [fixture.schema], { input: JSON.stringify(fixture.value), encoding: "utf8" });
    notEqual(result.status, 0, `${fixture.schema} accepted malformed transport data`);
  }
  const constructed = spawnSync(executable, ["construct"], { input: "", encoding: "utf8" });
  strictEqual(constructed.status, 0, constructed.stderr);
  deepStrictEqual(ShapeApiSchemas.SaveCreativeDraft.parse(JSON.parse(constructed.stdout)), { expectedRevision: 4, document: { schemaVersion: 1, mode: "audio", prompts: { image: "", video: "", audio: "नमस्ते", model3d: "" } } });
  const route = spawnSync(executable, ["route"], { input: "", encoding: "utf8" });
  strictEqual(route.status, 0, route.stderr);
  strictEqual(route.stdout, "/api/v1/projects/a%2Fb%20%3F");
  console.log(`Swift 6 typecheck passed; ${fixtures.length} bidirectional JSON fixtures, ${invalid.length} invalid payloads, native request construction and route encoding verified. No native app/device test performed.`);
} finally {
  await rm(scratch, { recursive: true, force: true });
}
