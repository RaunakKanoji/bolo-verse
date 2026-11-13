# Feature 02 — brief-aware Gemini brainstorming

Updated 13 November 2026 (Asia/Kolkata). Scope: [Feature 02](../../context/feature-specs/02-gemini-brainstorming.md), with [implementation map](../superpowers/plans/2026-11-13-gemini-brainstorming.md). Feature 01's saved briefs are a prerequisite. No Feature 03 voice work is included.

## Behavior before and after

Previously, Gemini text generation was available only through the restricted legacy XR assistant; the project page had a saved brief but no brief-aware creative assistant. The new **Brainstorm with Gemini** panel uses the saved brief version, accepts a message or one of three quick prompts, and requests three concise creative directions. Each direction has a name, concept, visual direction, proposed deliverable and production suggestion. Results are labelled AI suggestions, not completed assets. No scene command/tool executor is imported or invoked.

Results and messages stay in component memory. A new request removes the previous reply so it cannot be mistaken for a new response. Failures retain the message and show recovery guidance. Source-version changes abort the pending browser request and hide old replies; access denial clears the panel and private brief editor. Copying a direction uses plain text. **Add to brief notes** appends to existing unsaved notes, rejects a 5000-character overflow, and still requires explicit **Save brief** to persist through the existing versioned route. No standalone direction-save button, conversation storage, localStorage, jobs or artifact publication was added.

## API and trust boundary

`POST /api/v1/projects/{projectId}/brainstorm` uses the existing v1 envelope and server-validated Clerk cookie/native bearer identity. Cookie writes require exact trusted Origin; a supplied Origin must always be trusted. Resource IDs come from the route, not the request body. Only persisted project creator/editor or workspace-owner permission may request ideas. Missing and unauthorized project UUIDs both return 403 per existing conventions; clients cannot send a request even when they may view an approved brief.

Example request:

```json
{"message":"Suggest three distinct campaign directions.","briefVersion":1}
```

The optional `briefVersion` must match the current saved brief. Request objects are strict, capped at 2000 message characters and the existing 16 KiB JSON body limit. History, caller-provided brief/context and arbitrary tool fields are rejected. No saved brief or stale version returns 409 before Gemini/quota use. Wrong content type returns 415, invalid JSON/fields/ID 400, oversized body 413, absent identity 401, quota 429, and unconfigured/unavailable services sanitized 503.

Structured success has exactly three directions. Illustrative response, not live evidence:

```json
{
  "ok": true,
  "data": {
    "reply": "Three possibilities grounded in your saved brief.",
    "directions": [
      {
        "name": "Craft story",
        "concept": "Introduce the verified craft behind the collection.",
        "visualDirection": "Warm light and tactile detail.",
        "proposedDeliverable": "A launch poster.",
        "productionSuggestion": "Photograph a close-up of the weave."
      },
      {
        "name": "Everyday silk",
        "concept": "Show the collection in a familiar daily setting.",
        "visualDirection": "Natural light and simple styling.",
        "proposedDeliverable": "A product reel.",
        "productionSuggestion": "Film a short detail-to-product reveal."
      },
      {
        "name": "Gift story",
        "concept": "Frame the collection as a thoughtful gifting choice.",
        "visualDirection": "Restrained packaging and tactile close-ups.",
        "proposedDeliverable": "A campaign poster.",
        "productionSuggestion": "Photograph a simple wrapped-product arrangement."
      }
    ],
    "format": "structured",
    "sourceBriefVersion": 1,
    "providerStatus": "live"
  },
  "requestId": "request-uuid"
}
```

A completed, bounded Gemini reply that fails JSON/direction validation returns `format: "plain_text"`, an empty `directions` array and the sanitized real provider text, clearly labelled in the UI. Blocked, truncated or invalid provider envelopes return an error, never invented directions. `providerStatus: "live"` denotes the HTTP adapter's successful provider response, not readiness or proof that this delivery was live-verified. Test fixtures use this wire format and remain fixtures.

The service loads the authorized saved brief server-side and uses the existing stable serialization. It transmits objective, audience, product, deliverable format, tone/language, title, constraints/prohibited claims and bounded supporting metadata/facts. Notes, references, actual fact IDs, identities, asset IDs, private storage keys and unrelated project data are omitted. Optional facts are limited to five, brand requirements to 1000 characters, key message to 500 and channels to five. Context above 24,000 serialized characters is rejected before spending quota; constraints/prohibitions are never silently truncated away. Obvious credential material and URLs are redacted before transmission and display. Decoded model JSON keys and values are sanitized before schema validation, preventing Unicode-escape bypasses; nested data beyond depth 16 is rejected. This is pattern/known-key redaction, not a complete sensitive-data classifier; creators remain responsible for brief content submitted to their configured provider.

After provider latency, SQL authorization is checked again and replies are discarded if access was revoked or a newer brief was saved. Responses are no-store. Only hashed quota keys/counts are persisted; prompts/replies are not logged or stored. Existing request IDs and sanitized HTTP error codes provide correlation without text telemetry.

## Gemini transport and limits

The adapter reuses the existing bounded `providerJson` transport and configured Gemini model/key validation. It sends a server-only `x-goog-api-key` header to the fixed Gemini `generateContent` endpoint, with a system instruction separating untrusted data from rules, JSON output schema and a 2048-token output cap. No tools or code execution are declared. The request convention follows Google's [generateContent reference](https://aistudio.google.com/api-reference/generate-content) and [structured-output documentation](https://aistudio.google.com/docs/structured-output); the [retry guide](https://aistudio.google.com/docs/troubleshooting) identifies transient status handling. These references establish the API shape, not a live account result.

Both attempts share the existing 25-second deadline and 65,536-byte response-stream bound. Brainstorming opts into at most one retry after an explicit 429/500/502/503/504 response, using 1–1.25 seconds of backoff/jitter. A longer/unsupported `Retry-After` prevents that retry. Ambiguous network errors, timeout, client rejection and malformed output are not retried automatically. Existing XR/speech callers retain their default single-attempt behavior. The browser allows 35 seconds for the whole API exchange.

The existing 20/hour account assistant quota and a 10/hour actor/project brainstorming quota commit atomically in the existing quota table. Failed quota checks roll back both counters. No-key, absent-brief, stale-version or oversized-context requests spend no quota. A logical request that reaches Gemini spends quota even when the provider fails; an explicit browser retry is a new request and may incur another charge. No migrations or dependency/lockfile changes were needed.

## Acceptance evidence

| Gate | Status | Actual command and evidence |
| --- | --- | --- |
| Focused provider/contracts/SQL | PASS | `pnpm exec vitest run tests/unit/brainstorm.test.ts tests/integration/brainstorm.test.ts` — 26 cases (15 unit, 11 PGlite/API). Existing XR assistant suites also passed during the focused run. Identity/connection/HTTP boundaries are mocked; permissions, quota SQL and repositories are real local PostgreSQL. |
| Full JavaScript workspace | PASS | `pnpm check` — all 14 tasks, 577 tests in 58 files, lint/type/format/environment/generated-artifact checks and both production builds. Final log `/tmp/shape-brainstorm-check.log`. |
| Brainstorm and brief browser | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-brainstorm-browser pnpm exec playwright test tests/e2e/brainstorm.spec.ts tests/e2e/project-briefs.spec.ts --max-failures=1` — 20 cases (nine new, 11 existing). Real components and isolated HTTP fixtures; no production auth bypass. |
| Complete browser regression | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-brainstorm-e2e pnpm exec playwright test --max-failures=1` — all 71 cases across 12 files passed. Actual app routes ran against the local development server; component cases use labelled HTTP fixtures. Desktop/mobile assistant screenshots inspected. Final log `/tmp/shape-brainstorm-e2e.log`. |
| Native shared contracts | PASS | `pnpm contracts:test:swift` — Swift 6 typecheck, 22 bidirectional fixtures, nine invalid payloads and existing native request/route checks. |
| Native core | PASS | `pnpm native:test` — 48 tests in nine suites. |
| Checked-in native project | PASS | `xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio -destination 'generic/platform=visionOS Simulator' -derivedDataPath /tmp/shape-project-briefs-xcode CODE_SIGNING_ALLOWED=NO build` — exit 0 / `BUILD SUCCEEDED`. Compilation only; no native interaction/device claim. |
| Live smoke guard | PASS | `node --conditions=react-server --import tsx scripts/smoke-brainstorm.ts` refused execution with usage (expected exit 1), without `--live`, origin, project UUID and session token. No request sent. |
| Scope, secret patterns and whitespace | PASS | `git diff --check`; feature files and additive artifacts reviewed, including independent redaction review and credential-pattern/log review. No staged changes. |
| Live Gemini + signed-in project demo | NOT RUN | Presence-only check found Gemini key/model, Clerk keys and database URL absent. Requires the configuration/accounts below. HTTP fixtures are not a live provider result. |
| Manual signed-in account QA, physical device, deployment/live migration | NOT RUN | No account/service configuration or external state was changed. |

Observed failures were corrected: missing retry behavior, missing provider/route/UI, an empty assistant status region conflicting with the existing brief regression, and encoded-secret/URL redaction before JSON decoding. Independent review reproduced the encoded-output issue, then reran its probe successfully after the fix and found no remaining scoped blocker. Initial browser startup hit sandbox loopback restrictions; local server access was permitted for subsequent passing runs. No unrelated implementation changes were made to address environment failures.

## Live prerequisites and under-90-second demo

Configure local `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL` and the exact trusted browser origin. Use the existing database migrations and a creator/editor account with a saved project brief. The chosen model must support the existing generateContent JSON schema request. Brief-only brainstorming needs no R2, Sarvam or image-model credentials.

Sign in, open the saved project brief, choose **Three campaign directions**, then **Ask Gemini**. Confirm three directions reference the brief's actual goal, audience and constraints. Choose **Add … to brief notes**, review the notes, explicitly save, and reload to show the note persisted while the ephemeral reply panel reset. Confirm a second project cannot read this brief and a client cannot POST. Test blank input, offline/network retry, stale source version and 429/503 recovery; the local browser/API fixtures already exercise these paths, while manual signed-in QA remains NOT RUN.

For a separately opt-in real request, set `BRAINSTORM_SMOKE_TOKEN` locally to a valid authorized Clerk session JWT (never put it in arguments, logs or a committed file), then run:

```sh
node --conditions=react-server --import tsx scripts/smoke-brainstorm.ts \
  --live http://127.0.0.1:3000 <authorized-project-uuid>
```

This calls the actual app route and may incur Gemini charges. It prints only sanitized status, format, source version, direction count and request ID. Preserve that output separately as live evidence; this delivery did not run it.

## Exact Feature 02 files

Created:

- `apps/web/src/lib/contracts/brainstorm.ts`
- `apps/web/src/server/brainstorm/service.ts`
- `apps/web/src/server/providers/gemini-brainstorm.ts`
- `apps/web/src/app/api/v1/projects/[projectId]/brainstorm/route.ts`
- `apps/web/src/features/projects/ProjectBrainstorm.tsx`
- `apps/web/src/features/projects/brainstorm.module.css`
- `tests/unit/brainstorm.test.ts`
- `tests/integration/brainstorm.test.ts`
- `tests/e2e/brainstorm.spec.ts`
- `tests/browser-fixtures/brainstorm-entry.tsx`
- `scripts/test-brainstorm-harness.mjs`
- `scripts/smoke-brainstorm.ts`
- `docs/superpowers/plans/2026-11-13-gemini-brainstorming.md`
- `docs/development/gemini-brainstorming-status.md`

Extended, preserving prior uncommitted work:

- `apps/web/src/features/projects/ProjectBrief.tsx` (mount panel, append unsaved notes, clear on access loss)
- `apps/web/src/server/providers/xr-http.ts` (opt-in one-retry transport)
- `apps/web/src/server/providers/xr-assistant.ts` (export existing Gemini configuration predicate)
- `apps/web/src/server/xr-assistant/service.ts` (allow existing budget to join the brainstorming transaction)
- `apps/web/src/lib/contracts/shape.ts` (additive schema/operation registration)
- `packages/api-contract/fixtures/Roundtrip.swift`
- `packages/api-contract/fixtures/roundtrip.json`
- `packages/api-contract/generated/models.ts`
- `packages/api-contract/generated/client.ts`
- `packages/api-contract/generated/ShapeModels.swift`
- `packages/api-contract/generated/ShapeAPIRoutes.swift`
- `packages/api-contract/openapi.json`
- `docs/api/openapi.yaml`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeModels.swift`
- `apps/visionos/ShapeStudioCore/Sources/ShapeStudioCore/Generated/ShapeAPIRoutes.swift`
- `context/progress-tracker.md`
- `progress-tracker.md`

No voice implementation, renderer, canonical scene v1, schema/migration, provider SDK, conversation database or native brainstorming UI was added. The existing `.gitignore`, Feature 00 project/XR/demo changes, Feature 01 files, repository-baseline plan and design `output/` remain untouched except the explicit Feature 01 extension paths above. Generated test/build output and private data are excluded.

Suggested Conventional Commit: `feat(ai): connect Gemini brainstorming to project briefs`.

Feature 02 depends on currently uncommitted Feature 01. Establish the reviewed Feature 01 checkpoint before splitting Feature 02 into a separate commit; shared files/artifacts currently contain both. Suggested staging paths are exactly the created/extended lists above. A new-file staging example (not executed):

```sh
git add -- apps/web/src/lib/contracts/brainstorm.ts \
  apps/web/src/server/brainstorm/service.ts \
  apps/web/src/server/providers/gemini-brainstorm.ts \
  'apps/web/src/app/api/v1/projects/[projectId]/brainstorm/route.ts' \
  apps/web/src/features/projects/ProjectBrainstorm.tsx \
  apps/web/src/features/projects/brainstorm.module.css \
  tests/unit/brainstorm.test.ts tests/integration/brainstorm.test.ts \
  tests/e2e/brainstorm.spec.ts tests/browser-fixtures/brainstorm-entry.tsx \
  scripts/test-brainstorm-harness.mjs scripts/smoke-brainstorm.ts \
  docs/superpowers/plans/2026-11-13-gemini-brainstorming.md \
  docs/development/gemini-brainstorming-status.md
```

Review and stage the listed shared/generated/tracker paths too, using patch staging where prior work must remain separate. Do not use `git add .`. Nothing was staged, committed, pushed, deployed or applied to a live database. Stop at Feature 02; live provider/account acceptance remains open.
