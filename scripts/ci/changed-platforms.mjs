import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

// Pure Git/Node classification: CI can select jobs before installing dependencies.
// Pass event values through environment variables, never interpolate them as code.
const sharedPrefixes = [
  "packages/scene-schema/",
  "packages/api-contract/",
  "packages/design-tokens/",
  "src/lib/contracts/",
  "apps/web/src/lib/contracts/",
  "scripts/ci/",
  ".github/workflows/",
];
const sharedFiles = new Set([
  "scripts/generate-contracts.ts",
  "scripts/lib/contract-generator.ts",
  "scripts/test-swift-contracts.ts",
  "scripts/generate-tokens.mjs",
  "scripts/sync-native-contracts.mjs",
  "scripts/generate-visionos-project.rb",
  "tests/unit/ci-changes.test.ts",
  "turbo.json",
  "turbo.jsonc",
]);

function classifyPaths(paths) {
  let application = false;
  let native = false;
  for (const path of paths) {
    if (sharedFiles.has(path) || sharedPrefixes.some((prefix) => path.startsWith(prefix))) {
      application = true;
      native = true;
    } else if (path.startsWith("apps/visionos/")) {
      native = true;
    } else {
      // All remaining paths retain ordinary application checks, including new
      // JavaScript packages. A web-only dependency change does not require Xcode.
      application = true;
    }
  }
  return { application, native, reason: "changed-files" };
}

function comparison() {
  const base = process.env.CI_BASE_SHA ?? "";
  const head = process.env.CI_HEAD_SHA ?? "";
  const isCommit = (value) => /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value) && !/^0+$/.test(value);
  if (!isCommit(base) || !isCommit(head)) return null;
  const options = { encoding: "buffer", stdio: ["ignore", "pipe", "pipe"], timeout: 15_000, maxBuffer: 8 * 1024 * 1024 };
  try {
    // Verify both object types; tags, missing history and option-like input do
    // not become a partial comparison that could incorrectly skip a platform.
    for (const commit of [base, head]) {
      const kind = execFileSync("git", ["cat-file", "-t", commit], options).toString("utf8").trim();
      if (kind !== "commit") return null;
    }
    // Disabling rename detection retains both old and new paths. NUL separators
    // preserve filenames containing newlines instead of inventing extra paths.
    const bytes = execFileSync("git", ["diff", "--name-only", "--no-relative", "--no-renames", "-z", base, head, "--"], options);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

const paths = comparison();
const result = paths === null
  ? { application: true, native: true, reason: "unavailable-comparison" }
  : classifyPaths(paths);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `application=${result.application}\nnative=${result.native}\n`, "utf8");
}
console.log(JSON.stringify(result));
