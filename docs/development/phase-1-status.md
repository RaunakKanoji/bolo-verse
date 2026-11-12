# Unified platform Phase 0 and Phase 1 delivery

Date: 12 November 2026. Scope: the [unified platform prompt](../product/UNIFIED_PLATFORM_SPEC.md), Phase 0 audit and Phase 1 monorepo foundation. The audit/plan was committed before implementation as `2e5f2b1`; the initial repository history remains intact. Work is local on `feat/unified-monorepo-foundation`. Implementation commits: `8795545` (workspace/contracts) and `84389cb` (independent CI). The main checkout at `/Users/admin/Code/VR` is on this branch with frozen dependencies installed; environment validation and contract/native-copy checks passed there. The original initial commit remains an ancestor.

## Delivered behavior and decisions

The existing web application, browser A-Frame workspace, recording lab and native SwiftUI/RealityKit app remain in place. The root application now consumes real pnpm packages for canonical scenes, strict compiler settings and ESLint configuration. `pnpm check` runs the Turbo dependency graph; existing development, build, test and database commands remain available.

The canonical v1 implementation moved byte-for-byte into `@shape/scene-schema`, with the old module re-exporting it for compatibility. Its wire format, API version and generated Swift artifacts did not change. A deterministic OpenAPI mirror at `docs/api/openapi.yaml` is generated from the existing registry and checked for drift.

The Next application stays at the root until a functional R3F migration justifies `apps/web` and `apps/spatial-web`. Native Swift and neutral generated artifacts remain outside JavaScript workspace packages. No empty apps/services or unused rendering dependencies were added. [ADR 0001](../adr/0001-incremental-workspace.md), [scene compatibility](../adr/0002-scene-version-compatibility.md) and [renderer boundaries](../adr/0003-renderer-boundaries.md) document these choices.

Environment diagnostics reuse server validation and report field names without raw credential values. Strict Turbo environment filtering retains hosted-deployment markers so it cannot enable the local demo accidentally. Root build, tests, environment and generated-artifact checks are uncached; only deterministic package lint/typecheck use local caching.

CI classifies committed paths using validated Git revisions and argument arrays. Web and native checks are independent; shared contracts/tokens/scene definitions trigger both. Missing comparison history runs both conservatively. Native compilation is not part of the ordinary web build graph.

## Files created

| Area | Files |
| --- | --- |
| Workspace graph and diagnostics | `turbo.json`, `scripts/check-environment.ts` |
| Shared scene package | `packages/scene-schema/{package.json,src/index.ts,tsconfig.json,eslint.config.mjs,README.md}` |
| Compiler configuration | `packages/typescript-config/{package.json,base.json,README.md}` |
| Lint configuration | `packages/eslint-config/{package.json,next.mjs,typescript.mjs,README.md}` |
| CI selection and regression checks | `scripts/ci/changed-platforms.mjs`, `tests/unit/{ci-changes,workspace-scene-package,workspace-tooling}.test.ts` |
| Architecture | `docs/architecture/{system-overview,domain-model,authentication,scene-format,realtime,voice-commands}.md` |
| Platform boundaries | `docs/platforms/{web,browser-xr,visionos}.md` |
| Decisions | `docs/adr/{0001-incremental-workspace,0002-scene-version-compatibility,0003-renderer-boundaries}.md` |
| API publication | `docs/api/{README.md,openapi.yaml}` |
| Development and evidence | `docs/development/{local-setup,deployment,phase-1-status}.md` |
| Phase 0 source and plan | `docs/product/UNIFIED_PLATFORM_SPEC.md`, `docs/superpowers/plans/2026-11-12-unified-monorepo-foundation.md` |

## Files modified

- Root workspace/build configuration: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `vitest.config.ts`, `.gitignore`.
- Compatibility/code generation: `src/lib/contracts/spatial-scene.ts`, `scripts/generate-contracts.ts`.
- CI: `.github/workflows/quality.yml`.
- Guidance/status: `README.md`, `AGENTS.md`, `progress-tracker.md`, all six existing `context/*.md` guidance/tracker documents and the Phase 0 plan's completion checklist.

No native implementation, database schema, migration, provider adapter, generated Swift model or existing web component changed in this phase.

## Dependencies

Only one new external dependency: `turbo@2.11.11`, plus its lockfile-selected platform binary. pnpm generated exact release-age exceptions for that release and its platform binaries; existing build allowlists and A-Frame pins remain intact. The three new private internal packages use `workspace:*`; they reuse the existing Zod, TypeScript and ESLint versions. Swift package dependencies are unchanged.

## Verification

| Check | Result in this phase |
| --- | --- |
| Baseline unit/PostgreSQL suite | 394 tests passed before implementation. |
| Frozen lockfile installation | Passed in both the isolated and main checkouts. |
| Full `pnpm check` | 11 tasks successful, including package lint/types, root lint/types/formatting, environment/drift checks, 425 tests in 36 files, and Next production build. Two package checks came from the verified local cache. |
| New behavioral regression checks | 3 package/schema parity, 5 actual Turbo environment guard, and 23 Git-based CI classification tests; included in the 425 total. |
| Package/task boundaries | Root plus three actual workspace packages; no Swift package in the graph. Shared compiler config changes invalidate both scene-package check hashes; restoring the file restores both hashes. |
| Contract preservation | Moved scene implementation is byte-identical to the previous source. All six generated outputs and native copies match their sources; published OpenAPI mirror matches the existing document. |
| Swift contract verification | Swift 6 typecheck, 11 bidirectional JSON fixtures, 9 invalid payloads, native request construction and route encoding passed. |
| Native core | 48 tests across 9 suites passed. |
| Production Chromium regression | All 32 cases passed against the Next production server: editing/export, responsive shells, drafts, real A-Frame rendering/manipulation and recording. |
| Independent review | Architecture/security/configuration and final scheduling reviews found no remaining blocker. |

The first combined run launched compilers and unbounded PostgreSQL test workers together and timed out seven setup hooks. The unchanged suite passed with four workers. Static gates now run before tests, Vitest is bounded to the smaller of four or available CPUs, and the production build runs last. Assertions and timeouts were preserved. Two lint warnings and a typed test-fixture error found by the combined gate were corrected before the successful final run.

## Limits and next milestones

This phase is a locally verified foundation, not the integrated spatial MVP. Current native canonical scenes and legacy A-Frame layouts remain separate representations. Organizations administration, R3F editing, explicit v2 scene migration, asset conversion/upload, generation orchestration, shared command registry, native voice capture, realtime presence and full client delivery workflows remain later increments.

No remote CI execution, deployment, remote push, live database mutation or live Clerk/R2/AI-provider acceptance was performed. Existing browser tests use bounded HTTP fixtures, synthetic microphone input and simulated XR sessions. No new simulator UI run or physical-device test is claimed; earlier native simulator/build evidence is preserved in [native validation](../shape-studio/native-validation.md). Native rendering sources and generated transport models are unchanged.

The next planned increment is shared backend/domain work: add organization/profile requirements using existing identity/project permissions, reviewable migrations and tenant tests. Later scene/R3F work must explicitly bridge the current canonical and legacy representations. See the [milestones and file-level plan](../superpowers/plans/2026-11-12-unified-monorepo-foundation.md) and [local setup](local-setup.md).
