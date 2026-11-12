import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../../scripts/ci/changed-platforms.mjs", import.meta.url));
let repository: string;
let initial: string;

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commit(path: string): { base: string; head: string } {
  const base = git("rev-parse", "HEAD");
  const target = join(repository, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${path}\n${base}\n`);
  git("add", "--", path);
  git("commit", "-qm", "test change");
  return { base, head: git("rev-parse", "HEAD") };
}

function classify(base: string, head: string) {
  const output = join(repository, "ci-output.txt");
  rmSync(output, { force: true });
  const result = spawnSync(process.execPath, [script], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, CI_BASE_SHA: base, CI_HEAD_SHA: head, GITHUB_OUTPUT: output },
  });
  expect(result.status, result.stderr).toBe(0);
  const payload = JSON.parse(result.stdout) as { application: boolean; native: boolean; reason: string };
  expect(readFileSync(output, "utf8")).toBe(`application=${payload.application}\nnative=${payload.native}\n`);
  return payload;
}

beforeAll(() => {
  repository = mkdtempSync(join(tmpdir(), "shape-ci-paths-"));
  git("init", "-q");
  git("config", "user.name", "CI classifier test");
  git("config", "user.email", "ci-classifier@example.invalid");
  git("config", "commit.gpgsign", "false");
  git("config", "core.hooksPath", "/dev/null");
  writeFileSync(join(repository, "README.md"), "test fixture\n");
  git("add", "README.md");
  git("commit", "-qm", "initial fixture");
  initial = git("rev-parse", "HEAD");
});

afterAll(() => { if (repository) rmSync(repository, { recursive: true, force: true }); });

describe("CI platform selection", () => {
  it("runs web checks without requiring Xcode for unrelated application changes", () => {
    const { base, head } = commit("src/features/workspace/WorkspaceShell.tsx");
    expect(classify(base, head)).toEqual({ application: true, native: false, reason: "changed-files" });
  });

  it("runs native checks independently for Swift-only changes", () => {
    const { base, head } = commit("apps/visionos/ShapeStudio/Features/Workspace/WorkspaceView.swift");
    expect(classify(base, head)).toEqual({ application: false, native: true, reason: "changed-files" });
  });

  it.each([
    "packages/scene-schema/src/index.ts",
    "src/lib/contracts/shape.ts",
    "apps/web/src/lib/contracts/shape.ts",
    "packages/api-contract/generated/ShapeModels.swift",
    "packages/design-tokens/tokens.json",
    "scripts/generate-contracts.ts",
    "scripts/lib/contract-generator.ts",
    "scripts/sync-native-contracts.mjs",
    "scripts/test-swift-contracts.ts",
    "scripts/ci/changed-platforms.mjs",
    ".github/workflows/quality.yml",
    "turbo.json",
  ])("runs both platforms when shared infrastructure changes: %s", (path) => {
    const { base, head } = commit(path);
    expect(classify(base, head)).toEqual({ application: true, native: true, reason: "changed-files" });
  });

  it.each(["package.json", "pnpm-lock.yaml", "packages/typescript-config/base.json"])("keeps JavaScript-only tooling independent of native compilation: %s", (path) => {
    const { base, head } = commit(path);
    expect(classify(base, head)).toEqual({ application: true, native: false, reason: "changed-files" });
  });

  it("considers both sides of renames so moving native files cannot skip native checks", () => {
    commit("apps/visionos/ShapeStudio/OldView.swift");
    const base = git("rev-parse", "HEAD");
    git("mv", "apps/visionos/ShapeStudio/OldView.swift", "RenamedView.swift");
    git("commit", "-qm", "rename native fixture");
    expect(classify(base, git("rev-parse", "HEAD"))).toEqual({ application: true, native: true, reason: "changed-files" });
  });

  it("preserves filenames with newlines rather than treating them as extra paths", () => {
    const { base, head } = commit("src/features/a\napps/visionos/NotANativeFile.ts");
    expect(classify(base, head)).toEqual({ application: true, native: false, reason: "changed-files" });
  });

  it.each(["", "0".repeat(40), "f".repeat(40)])("runs every platform when the comparison base is unavailable: %s", (base) => {
    expect(classify(base, initial)).toMatchObject({ application: true, native: true });
  });

  it("never interprets untrusted revision input as shell commands or git options", () => {
    const marker = join(repository, "injected");
    expect(classify(`$(touch '${marker}')`, initial)).toEqual({ application: true, native: true, reason: "unavailable-comparison" });
    expect(classify("--output=injected", initial)).toEqual({ application: true, native: true, reason: "unavailable-comparison" });
    expect(() => readFileSync(marker)).toThrow();
  });

  it("does not invent a changed platform for an empty diff", () => {
    expect(classify(initial, initial)).toEqual({ application: false, native: false, reason: "changed-files" });
  });
});
