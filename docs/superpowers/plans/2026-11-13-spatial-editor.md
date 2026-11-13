# Canonical spatial editor implementation plan

> **For agentic workers:** Use executing-plans for inline implementation, then independent code review. Preserve the existing dirty workspace; the supplied feature protocol authorizes implementation and forbids commits without approval.

**Goal:** Harden the existing canonical editor and verify its persistence/recovery boundary.

**Architecture:** Keep R3F and pure editor state in spatial-web; existing web APIs remain authoritative. Reuse strict quaternion scene v1, CAS, ready-asset authorization and bounded private previews. Add no backend, dependency, migration or native contract.

**Spec:** `context/feature-specs/04-spatial-editor.md`.

## Implementation map / current behavior

- `SpatialEditor.tsx` already has placement, numeric transforms, selected state, undo/redo, save status, dirty-navigation warning and confirmed reload. It cannot refresh its bootstrapped asset catalog and has no command adapter.
- `state.ts` validates transforms and preserves edits during save; `spatial-scenes.ts` enforces ready project assets, edit permission and atomic expected revision. Reuse unchanged unless a behavioral test proves a blocker.
- `SpatialCanvas.tsx` owns a demand-driven R3F canvas, private preview requests and disposal. Add an explicitly local procedural preview using the same canvas, never fabricated project assets.
- `lib/api.ts` validates bootstrap envelopes; extract reusable project asset parsing for an explicit library refresh.
- Authorized upload/finalization already exists from the creative milestone. Link users to the existing project studio, then refresh ready assets. Do not implement Feature 05.
- Gateway and session teardown already have browser coverage. Extend `tests/e2e/spatial-workspace.spec.ts`, its fixture entry, spatial unit tests and existing SQL suite as needed.
- Add `editor/commands.ts`, `editor/LocalSpatialDemo.tsx`, `app/workspace/demo/page.tsx`; expose no arbitrary browser event or HTTP execution boundary. Adapter has no Save action and does not imply live voice integration.
- Update root/context progress trackers and `docs/development/spatial-editor-status.md` with exact evidence.

## Constraints and review focus

- Preserve unsaved changes after network failure, conflict, delayed save and refresh.
- Reject unknown/foreign/unpreviewable asset placement; server remains authoritative.
- Local demo has a visibly procedural object, no API/media access, project ID or Save.
- Late responses after unmount/session switch cannot publish state; maintain one renderer owner.
- No credentials/accounts are currently configured. Real demo provisioning and live Clerk/Neon/R2 acceptance are NOT RUN; do not fabricate ready rows or perform external changes.

## Task 1: validated commands and ready catalog

- [x] Add failing focused tests for allowlisted dispatch using existing state functions, invalid targets/fields/bounds/read-only mutations, and strict refreshed project assets.
- [x] Implement `dispatchEditorCommand(state, input, availableAssetIds)` returning state and optional selectedId; allow Place, Select, Transform, Undo, Redo only. Validate with Zod; require catalog membership for placement. Transform rotation remains XYZW.
- [x] Implement API `listAssets(projectId, signal)` using existing strict asset envelope and project/content identity validation. Route existing UI placement/transforms through the adapter, add Refresh assets and project studio navigation without changing document/history.
- [x] Run focused spatial unit/SQL tests.

## Task 2: local demo and browser recovery

- [x] Add failing browser tests for no-asset demo/navigation, catalog refresh/rejection, failed save then retry, in-flight save edits, numeric bounds, delayed reload, missing WebGL and teardown/remount.
- [x] Add a separate `/workspace/demo` procedural mode with no canonical asset IDs/persistence. Reuse the existing canvas and transform interaction, provide clear local-only copy and numeric controls.
- [x] Repair only blockers reproduced by these tests. Keep explicit Save, existing CAS/conflict semantics and existing quaternion v1.
- [x] Run full spatial browser suite; inspect screenshots and renderer/resource teardown evidence.

## Task 3: acceptance and delivery

- [x] Independent scoped review; fix material findings with regressions.
- [x] Run `pnpm check`, relevant full browser regressions, `git diff --check`, and review changed files for secrets/unrelated changes.
- [x] Record PASS/FAIL/NOT RUN, API examples/security, exact changed files, manual 90-second demo, minimal live prerequisites and suggested staging/commit. Stop at Feature 04; do not commit/push/deploy/migrate.

## Execution ledger

- Task 1 complete: missing command/catalog tests observed RED, then GREEN; final focused spatial unit/SQL run passed 29 tests in eight files. Existing authorization/CAS services and scene schema needed no source changes.
- Task 2 complete: demo/empty catalog, WebGL fallback and invalid-number Save regressions observed RED then GREEN. Separate procedural mode shares canvas/controls with no fabricated identity. Actual bounded GLB/PNG previews, transforms, undo/save/reload, failed/stale requests, GPU disposal/remount, readonly and navigation cancellation passed in 18 spatial Chromium cases.
- Task 3 complete: independent review found no material scoped blocker. Final pnpm check passed 14 tasks, 587 tests/60 files and both builds; all 92 Chromium tests/13 files passed. Desktop/mobile screenshots inspected; final whitespace/staging checks passed.
- Scope decision: existing private-reference upload UI is capability-gated by image generation; document its configuration prerequisite instead of implementing Feature 05. Refresh uses existing ready assets; no provider call is needed for already-ready placement.
- Live gate NOT RUN: Clerk/Neon/R2 configuration, accounts and actual authorized ready asset absent. No seeding/external writes, native source changes, staging, commit, push, live migration or deployment. Canonical live voice remains gated; only its local command adapter is provided.
- Evidence and exact paths: docs/development/spatial-editor-status.md. Stop at Feature 04.
