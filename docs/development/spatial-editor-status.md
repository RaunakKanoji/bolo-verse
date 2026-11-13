# Feature 04 — canonical spatial editor delivery

13 November 2026 (Asia/Kolkata). Scope: [Feature 04](../../context/feature-specs/04-spatial-editor.md), following the [implementation map](../superpowers/plans/2026-11-13-spatial-editor.md). Existing uncommitted Features 00–03 and design outputs are preserved. No files were staged or committed; no push, live migration, account change, storage write or deployment occurred.

## Behavior

The existing R3F editor already placed, selected and transformed ready assets, kept undo/redo history, showed save status, preserved dirty edits on failures/conflicts and used explicit revision CAS. These behaviors remain; this feature adds:

- **Refresh assets**, using the existing authorized ready-project catalog. New uploads from the existing project Creative Studio become available without discarding scene edits or history. Malformed/foreign catalogs are rejected; failures retain the previous library and scene. Only supported ready assets in the current project can be placed through the command adapter.
- Text hints explaining numeric commit and explicit Save. Invalid displayed numeric drafts now prevent Save and focus the first invalid input. Previously the old valid document could be saved while invalid numbers remained visible.
- A visible fallback before renderer mount when WebGL2 is unavailable. The previous R3F HTML-canvas fallback remained hidden in browsers supporting HTML canvas without WebGL.
- A small strict `dispatchEditorCommand(state, input, availableAssetIds)` adapter for `PLACE_ASSET`, `SELECT_OBJECT`, `SET_TRANSFORM`, `UNDO`, `REDO`. Existing editor state owns transforms/history; XYZW quaternion validation is reused. The adapter has no Save, microphone, provider, network or persistence action. Manual placement/transforms/undo/redo use it. Future voice integration must explicitly review proposals and invalidate them on session/context change; this is not a live canonical voice integration.
- Separate public `/workspace/demo` with a clearly labelled built-in procedural cube. It uses the same R3F canvas and bounded numeric controls, but has **no project ID, asset ID, API/media request, Save or persistence**. Refresh resets it. It neither changes a project scene nor pretends an asset is ready.
- Capture-phase dirty-link protection before Next client navigation; cross-application links still perform full navigation.

Canonical scene v1, existing CAS repositories, API authorization, native contracts, A-Frame and the recording lab are unchanged. No dependency or migration was added. Preview bounds remain four visible supported assets/40 MiB total, 20 MiB each; missing/unsupported objects are preserved.

The existing Creative Studio **Upload private reference** control currently shares the image-generation capability gate. Using that control requires the existing `GEMINI_API_KEY`/supported `GEMINI_IMAGE_MODEL` configuration as well as storage and project access, even though upload itself does not generate an image. Independent image-upload availability remains Feature 05 work. This feature refreshes ready assets from the existing catalog and does not claim Feature 05 is complete. An already-ready authorized asset does not require an image-provider call to place/save.

## Exact changed files for Feature 04

Created:

- `apps/spatial-web/src/editor/commands.ts`
- `apps/spatial-web/src/editor/LocalSpatialDemo.tsx`
- `apps/spatial-web/src/app/workspace/demo/page.tsx`
- `apps/spatial-web/tests/commands.test.ts`
- `apps/spatial-web/tests/asset-library.test.ts`
- `docs/superpowers/plans/2026-11-13-spatial-editor.md`
- `docs/development/spatial-editor-status.md`

Modified:

- `apps/spatial-web/src/editor/SpatialEditor.tsx`
- `apps/spatial-web/src/editor/SpatialCanvas.tsx`
- `apps/spatial-web/src/lib/api.ts`
- `apps/spatial-web/src/app/workspace/page.tsx`
- `tests/browser-fixtures/spatial-workspace-entry.tsx` — test-only GPU-disposal counters; never imported by production routes.
- `tests/e2e/spatial-workspace.spec.ts`
- `tests/integration/spatial-scenes.test.ts`
- `progress-tracker.md`
- `context/progress-tracker.md`

`state.ts`, `@shape/scene-schema`, `server/db/spatial-scenes.ts` and existing asset upload/finalization were inspected and reused without changes.

## Existing API and security boundary

No endpoint was added. `GET /api/v1/projects/{projectId}/assets` returns `{ok:true,data:{assets:[…],hasMore:false},requestId:…}`. The ready-asset projection contains relative authorized content paths, never private object keys or identity grants. The client strictly validates the envelope, UUIDs, project membership of each result and matching asset/content-path identity. It uses no-store requests through the existing Clerk session transport.

An explicit save still uses `PUT /api/v1/projects/{projectId}/spatial-scene`:

```json
{
  "expectedRevision": 1,
  "document": {
    "sceneId": "11111111-1111-4111-8111-111111111111",
    "version": 1,
    "objects": [{
      "id": "placed-object",
      "assetId": "22222222-2222-4222-8222-222222222222",
      "position": [1.25, 0, -1],
      "rotation": [0, 0.7071067811865476, 0, 0.7071067811865476],
      "scale": [1, 1, 1.5],
      "visible": true
    }]
  }
}
```

These UUIDs are documentation placeholders, not seeded assets. Success returns `{ok:true,data:{scene:{projectId,sceneId,revision:2,document,canEdit:true,updatedAt}},requestId}`. Concurrent/stale writes return 409, unavailable/foreign asset references 400, denied projects/viewer writes 403, invalid identity 401, oversized bodies 413, exhausted write budgets 429, and missing configuration 503.

Existing controls verified through SQL tests: server-only Clerk identity, no invalid-bearer cookie fallback, trusted Origin/browser versus native-bearer policy, strict Zod/32,768-byte mutation input, SQL project visibility/editability, same-project ready references rechecked inside the write, revision CAS, durable 60 writes/minute budget and sanitized no-store errors. Browser role controls and the local adapter supplement those server checks. They do not grant permission. Client requests abort on teardown/session switch; old responses cannot replace newer local edits. Preview loading remains bounded, same-origin and disposable.

## Verification ledger

| Status | Command / evidence |
| --- | --- |
| PASS | `pnpm exec vitest run apps/spatial-web/tests tests/integration/spatial-scenes.test.ts` — 29 tests in eight files, including strict dispatch/catalog, transforms, readonly, foreign/staging/missing assets, unauthorized access, atomic concurrent-save 409s and ready-only catalog. |
| PASS | Final `pnpm check` — 14 tasks, 587 tests in 60 files, both production builds, lint/types/format/environment/generated contract and native drift checks. Log `/tmp/shape-spatial-final-check.log` (33.52 seconds, exit 0). |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-spatial-e2e3 pnpm exec playwright test tests/e2e/spatial-workspace.spec.ts --max-failures=1` — 17 cases before the final dirty-navigation regression. Actual GLB/PNG decoding, R3F pointer and numeric transforms, undo/redo, CAS save/refresh, read-only controls, dirty 409/failed-network recovery, delayed save edits, stale/failed reload, new catalog, unsupported objects, missing WebGL and cleanup/remount passed. |
| PASS | Desktop project editor and desktop/mobile procedural demo screenshots visually inspected; files under `/tmp/shape-spatial-e2e3/`. GPU geometry/material/texture disposal counters observe real Three objects in the isolated fixture bundle. |
| PASS | Independent scoped source review found no material blocker. Reviewer did not claim a separate live/browser run. |
| PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-spatial-full-e2e pnpm exec playwright test --max-failures=1` — all 92 Chromium cases in 13 files, including 18 spatial cases and existing project/brief/brainstorm/voice/XR/recording flows; exit 0, 3.2 minutes. Log `/tmp/shape-spatial-full-e2e.log`. |
| PASS | Final `git diff --check`; scoped source/diff inspection found no credentials, private object keys, unrelated source edits, dependency changes or generated build output. `git diff --cached --stat` is empty. Earlier feature changes remain uncommitted. |
| NOT RUN | Live Clerk/Neon/R2 creator/viewer acceptance, real account/ready-asset provisioning, cloud upload and private content roundtrip. Environment presence-only inspection confirms Clerk keys, `DATABASE_URL`, R2 account/access/secret/bucket are absent; no secret values were printed. |
| NOT RUN | New Swift/Xcode/headset/device interaction: no native or shared contract source changed. Native drift passes in `pnpm check`; prior native compilation is historical evidence only. |

The new command/catalog tests first failed because the adapter/refresh method did not exist; both then passed. The empty-library browser test failed before the demo/refresh controls, and the demo route failed before implementation. The missing-WebGL regression reproduced hidden fallback text and then passed after the renderer preflight. The invalid-numeric regression reproduced a successful save with invalid displayed drafts and then passed after the save guard. An intermediate `pnpm check` failed a new test's missing `this` type annotation; the annotation and internal Next Link lint findings were fixed before the successful full check.

HTTP/session/storage fixtures and Chromium's software WebGL are **local simulated service boundaries**, not live Clerk/Neon/R2 or physical GPU/device verification. API authorization/concurrency are separately exercised against disposable PGlite with the checked-in migrations. No fabricated production asset or auth bypass was introduced.

## Live prerequisites and 90-second manual demo

Use an explicitly disposable/local demo project and genuine existing Clerk creator account. Configure Clerk public/secret keys, `DATABASE_URL`, private `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and the exact public origin through the existing environment setup. Apply existing migrations only with separate authorization. No new migration is required by this feature.

1. Open the project from `/app/projects`, choose **Open 3D editor**; use the web gateway `/workspace/{projectId}`, not the internal spatial server root.
2. If there are no ready assets, open the same project's **Creative Studio**. When its existing image-generation/storage capability gate is configured, choose **Upload private reference** and a permitted PNG/JPEG/WebP; this uses authenticated upload/finalization without generating. Return and choose **Refresh assets**. Alternatively use an already-ready asset provisioned through the existing secure workflow in the disposable project. Do not insert synthetic ready rows or object keys. The separate **local procedural demo** is available for interaction practice, never persistence acceptance.
3. Place the ready image/model, select its object, enter Position X `1.25`, Rotation Y `45`, Scale Z `1.5` and press Enter for each. Show Undo/Redo and **Unsaved changes**.
4. Choose **Save scene**, show **All changes saved** and the incremented revision. Refresh the page and select the object; show the same position, rotation and scale.
5. In a second creator tab save another transform, then save a stale edit in the first: show the conflict with the first tab's edit retained. Choose Keep editing or explicitly discard/reload.
6. Denied account cannot open/read/mutate the project; viewer can inspect but cannot Save. During an offline save, show the failure and unchanged edits, reconnect and retry. Enter Position X `31` or Scale `0`: the field and Save guard reject it.

Real-account steps above are NOT RUN here. Required external configuration is the remaining acceptance prerequisite. Canonical voice recording/provider execution remains outside this editor hardening slice under Feature 03's live legacy gate.

## Review and suggested staging

Suggested Conventional Commit: `fix(spatial): harden canonical scene editing and persistence`.

After approval, stage only the created/modified paths above. Use `git add -p -- progress-tracker.md context/progress-tracker.md` to review the Feature 04 hunks because both trackers already contain earlier uncommitted feature work. Do not stage the whole repository, earlier Features 00–03, `.gitignore`, `output/`, build/test artifacts or credentials. No staging or commit was performed.

Suggested code/test/docs staging paths after approval:

```sh
git add -- apps/spatial-web/src/app/workspace/page.tsx apps/spatial-web/src/app/workspace/demo/page.tsx apps/spatial-web/src/editor/commands.ts apps/spatial-web/src/editor/LocalSpatialDemo.tsx apps/spatial-web/src/editor/SpatialEditor.tsx apps/spatial-web/src/editor/SpatialCanvas.tsx apps/spatial-web/src/lib/api.ts apps/spatial-web/tests/commands.test.ts apps/spatial-web/tests/asset-library.test.ts tests/browser-fixtures/spatial-workspace-entry.tsx tests/e2e/spatial-workspace.spec.ts tests/integration/spatial-scenes.test.ts docs/superpowers/plans/2026-11-13-spatial-editor.md docs/development/spatial-editor-status.md
git add -p -- progress-tracker.md context/progress-tracker.md
```
