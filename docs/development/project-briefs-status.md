# Feature 01 — project brief authoring

Updated 13 November 2026 (Asia/Kolkata). Implements only [Feature 01](../../context/feature-specs/01-project-briefs.md); [implementation map](../superpowers/plans/2026-11-13-project-briefs.md).

Previously, the repository had a rich strict `BriefPayloadSchema`, seeded `brief_versions` and project permissions, but no brief authoring route or project form. The existing project page now loads, edits, saves and refreshes versioned briefs. Edits remain local through network errors and 409 conflicts, with explicit saved-version comparison before rebasing or replacing them. Reload/unload and same-window link navigation warn about unsaved text. Access denial clears the loaded brief; editor-to-client downgrade immediately replaces internal text with the approved-only response.

## Contract and storage choices

The existing objective, audience, product, format (`poster`/`reel`/`script`), aspect ratio, tone, language, facts with stable IDs, prohibited claims and constraints remain supported. Optional title, brand requirements, key message, channels, HTTPS reference URLs, date-only deadline and notes extend that rich payload. Existing rows without these fields remain valid. Unchanged multiline facts/claims/constraints retain their array boundaries and IDs when other fields change. New line-list edits intentionally use one item per line. Empty briefs prefill only the project objective, bounded to its 1000-character brief limit; persisted content always takes precedence.

No second brief/project table, migration or dependency was added. A request's UUID idempotency key is the existing version-row ID. All brief writers lock the authorized project row, compare the latest version, then insert `expectedVersion + 1` under the existing unique project/version constraint. Matching actor/project/payload/version retries return the original saved result, including after newer writes; changed request reuse returns 409. Prior payload rows are never updated by this feature. Stable validated JSON serialization is available for future AI context; it does not invoke AI or make brief text trusted instructions.

## API examples

`GET /api/v1/projects/{projectId}/brief` returns the existing envelope:

```json
{"ok":true,"data":{"brief":null,"version":0,"savedAt":null,"canEdit":true},"requestId":"request-uuid"}
```

`PUT` at the same route uses a new UUID for each logical save, reused unchanged after an ambiguous failure:

```json
{
  "expectedVersion": 0,
  "idempotencyKey": "b2000000-0000-4000-8000-000000000001",
  "brief": {
    "schemaVersion": 1,
    "title": "Silk launch brief",
    "objective": "Introduce the collection",
    "audience": "Design-conscious shoppers",
    "product": "Violet Silk",
    "format": "poster",
    "aspectRatio": "1:1",
    "tone": "Warm and clear",
    "language": "en-IN",
    "facts": [],
    "prohibitedClaims": [],
    "constraints": ["Use approved logo"],
    "deadline": "2026-12-01",
    "notes": "Discuss with client"
  }
}
```

Success is 200 with `data: {brief, version: 1, savedAt: "<ISO timestamp>", canEdit: true}`. Stale versions and mismatched retry keys return sanitized `409 CONFLICT`. New versions are `proposed`; this feature never approves a brief automatically.

Every read uses Clerk cookie identity or the established verified native session bearer policy, with SQL project authorization. Owner/creator/editor may write. Explicitly assigned clients read only approved versions, even when a newer internal draft exists; unassigned workspace members gain no access. Missing and forbidden UUIDs both return 403 under existing project conventions; malformed IDs return 400, absent identity 401, wrong content type 415, oversized bodies 413, and service failures sanitized 503. Browser writes require exact trusted Origin. Strict shared Zod validation rejects extra fields, credential-bearing/non-HTTPS URLs, malformed dates and oversized fields. The shared request schema and browser additionally enforce the aggregate 32,768-byte UTF-8 limit before sending. Responses are no-store and contain no author/workspace identity or storage keys. The general v1 project DTO includes no brief text.

## Verification checklist

| Gate | Status | Actual command / evidence |
| --- | --- | --- |
| Focused contracts and real local PostgreSQL/API | PASS | `pnpm exec vitest run tests/unit/project-briefs.test.ts tests/integration/project-briefs.test.ts` — 25 tests across two files. PGlite runs all checked-in SQL migrations; only external identity and connection boundaries are mocked. |
| Workspace gate | PASS | `pnpm check` — all 14 tasks, 551 tests in 56 files, lint/types/format/environment/artifact checks and both production builds. |
| Brief browser behavior | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-project-briefs-final pnpm exec playwright test tests/e2e/project-briefs.spec.ts --max-failures=1` — all 11 cases passed; isolated real React component/HTTP fixtures, not live authentication. Desktop/mobile screenshots inspected. |
| Broader browser regression | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-project-briefs-regression pnpm exec playwright test tests/e2e/shape-shell.spec.ts tests/e2e/foundation.spec.ts tests/e2e/xr-foundation.spec.ts tests/e2e/recording-navigation.spec.ts tests/e2e/spatial-workspace.spec.ts tests/e2e/project-briefs.spec.ts --max-failures=1` — all 33 selected cases passed (23 existing + the first 10 brief cases). Actual app routes used the existing local development server; component cases use isolated fixtures. |
| Final approved-summary browser case | PASS | Included in the final 11-case brief run. Across both browser runs, 34 distinct cases passed; repeated cases are not counted twice. |
| Shared Swift contracts | PASS | `pnpm contracts:test:swift` — Swift 6 typecheck, 19 bidirectional JSON fixtures, nine invalid payloads, native request and route checks. |
| Native core | PASS | `pnpm native:test` — all 48 tests in nine suites after allowing local compiler cache access. |
| Checked-in native app compilation | PASS after environment recovery | `xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio -destination 'generic/platform=visionOS Simulator' -derivedDataPath /tmp/shape-project-briefs-xcode CODE_SIGNING_ALLOWED=NO build` initially failed generating UIKit's precompiled module with `No space left on device`. Only this task's temporary derived-data directory was removed. After host free space increased to 4.2 GiB, the same command was rerun and completed with `BUILD SUCCEEDED` (exit 0). This is unsigned simulator-target compilation, not app interaction or device verification. |
| Whitespace and scope/secret review | PASS | `git diff --check`; reviewed new brief source and additive artifacts and searched feature files for credential patterns. Final `pnpm exec tsc --noEmit` and focused ESLint passed after the last browser-test addition. No staging/commit occurred. |
| Real signed-in creator/client demo | NOT RUN | Local Clerk and database configuration are absent. Requires configured Clerk publishable/server keys, development creator/client/outsider accounts, `DATABASE_URL`, applied existing migrations and exact trusted browser origin. No provider or R2 account is required for brief-only authoring. |
| Native UI/headset, live services, live migrations, deployment | NOT RUN | Outside this feature's local fixture verification; no external service was changed. |

Observed test failures led to fixes for unsupported metadata, malformed URLs, aggregate UTF-8 size, actionable network recovery, permission downgrade and multiline round trips. The initial full check failed the socket test under sandbox restrictions; permitted loopback rerun passed. A later full check and the first native build hit host disk exhaustion; only task-owned Xcode output was removed, then the full JavaScript gate passed again. After additional host free space became available, the unsigned native app build also passed. A browser artifact collision with concurrent work was resolved by isolated output directories. No unrelated production fix was introduced for those environment failures. An independent read-only review found three issues; each was fixed with regressions, and re-review found no remaining blocker in this scope.

## Manual QA and 90-second demo

With the prerequisites above configured, sign in as a creator, create/open a project, enter title/audience/product/tone (objective is prefilled), save and reload. Confirm the identical fields and version 1. Open a second tab, save version 2 there, then try the old tab: expect 409 with its text retained. Refresh the saved brief, compare and explicitly keep/merge or replace edits. In browser developer tools, take the network offline during save, verify text remains and retry safely after reconnecting. Try blank audience and an invalid reference URL; no invalid save should be sent. As an explicitly assigned client, confirm only an already approved version is shown and direct PUT returns 403; without an approved version the summary is empty. An unrelated account must receive 403 and no brief text. These live account steps remain NOT RUN.

Approval authoring is outside Feature 01, so newly proposed briefs do not become client-visible through this feature. Browser Back/Forward is not intercepted; save before history navigation. Draft text is memory-only and does not survive a confirmed navigation. The brief is an inline project section rather than a new navigation/tab framework. No native brief authoring UI was added; generated types/routes remain synchronized.

## Exact feature files

Created:

- `apps/web/src/app/api/v1/projects/[projectId]/brief/route.ts`
- `apps/web/src/features/projects/ProjectBrief.tsx`
- `apps/web/src/lib/contracts/project-briefs.ts`
- `apps/web/src/server/db/project-briefs.ts`
- `scripts/test-project-brief-harness.mjs`
- `tests/browser-fixtures/project-brief-entry.tsx`
- `tests/e2e/project-briefs.spec.ts`
- `tests/integration/project-briefs.test.ts`
- `tests/unit/project-briefs.test.ts`
- `docs/superpowers/plans/2026-11-13-project-briefs.md`
- `docs/development/project-briefs-status.md`

Modified:

- `apps/web/src/app/app/projects/[projectId]/page.tsx`
- `apps/web/src/features/projects/ProjectForm.tsx` (replace outdated future-brief helper text)
- `apps/web/src/features/projects/projects.module.css`
- `apps/web/src/lib/contracts/documents.ts`
- `apps/web/src/lib/contracts/shape.ts`
- `packages/api-contract/fixtures/Roundtrip.swift`
- `packages/api-contract/fixtures/roundtrip.json`
- `packages/api-contract/generated/ShapeAPIRoutes.swift`
- `packages/api-contract/generated/ShapeModels.swift`
- `packages/api-contract/generated/client.ts`
- `packages/api-contract/generated/models.ts`
- `packages/api-contract/openapi.json`
- `docs/api/openapi.yaml`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeAPIRoutes.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeModels.swift`
- `context/progress-tracker.md`
- `progress-tracker.md` (feature entry only; concurrent Feature 00 entry preserved)

Existing/concurrent unrelated `.gitignore`, legacy project-route changes, XR assistant/test edits, project access/mutation tests, `docs/DEMO_*`, repository-baseline plan and `output/` files were preserved. No lockfile changes, secrets or generated build/test output are part of this feature. Nothing was staged or committed.

Suggested Conventional Commit: `feat(briefs): add authorized project brief authoring`.

After review, stage only the exact feature paths above (review tracker hunks so the concurrent baseline remains separate). Example core staging command, not executed:

```sh
git add -- 'apps/web/src/app/api/v1/projects/[projectId]/brief/route.ts' \
  'apps/web/src/app/app/projects/[projectId]/page.tsx' \
  apps/web/src/features/projects/ProjectBrief.tsx \
  apps/web/src/features/projects/ProjectForm.tsx \
  apps/web/src/features/projects/projects.module.css \
  apps/web/src/lib/contracts/documents.ts \
  apps/web/src/lib/contracts/project-briefs.ts \
  apps/web/src/lib/contracts/shape.ts \
  apps/web/src/server/db/project-briefs.ts \
  scripts/test-project-brief-harness.mjs \
  tests/browser-fixtures/project-brief-entry.tsx \
  tests/e2e/project-briefs.spec.ts \
  tests/integration/project-briefs.test.ts \
  tests/unit/project-briefs.test.ts
```

Also include the exact generated/fixture/documentation paths listed above. Do not use `git add .` in this shared dirty checkout. Stop at this feature boundary; live account acceptance and device verification remain open.
