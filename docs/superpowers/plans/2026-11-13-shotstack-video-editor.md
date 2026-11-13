# Shotstack video editor implementation plan

> **For agentic workers:** Use focused parallel ownership for the independently testable UI, private persistence and provider adapter; root integrates and verifies. Preserve accumulated dirty work and do not stage, commit, deploy, provision or migrate live services.

**Goal:** Integrate Shotstack into Shape Studio's Video Creation workflow, as selected by the user.

**Architecture:** Embed the actual Studio SDK in a lazy client component, alongside strict bounded Shape media-edit v1 controls. Persist actor-private project drafts with revision checks and durable render snapshots in the sole web backend. Resolve authorized ready asset IDs into temporary server-only source capabilities, dispatch once after explicit consent, then import bounded MP4 output into private R2 before exposing an authorized asset projection.

**Stack:** Existing Next16/React19/strict TypeScript/Clerk/Drizzle/Neon/private R2/pnpm; add a pinned `@shotstack/shotstack-studio` dependency for the real embedded editor. Existing image, spatial, A-Frame, recording and native behavior remain intact.

**Spec:** User selected the recommended in-app integration after the SDK/server-adapter approach was presented. Official references: [SDK](https://shotstack.io/docs/guide/studio-sdk/), [Edit API](https://shotstack.io/docs/api/), [authoring conventions](https://shotstack.io/docs/guide/agents/conventions/).

## Constraints and decisions

- User's selected approach is SDK + server adapter. MCP setup and external Studio short links are outside this increment. No provider key enters browser state, URLs, logs or saved edit JSON.
- Preserve strict existing `MediaEditDocument` v1. Initial supported subset: ready project PNG/JPEG/WebP images and MP4/WebM videos, sequential nonoverlapping source clips, text/caption overlays, trim, volume, aspect ratios. Maximum60 seconds/50 clips/50 overlays; reject unsupported SDK changes rather than silently dropping them. No generative prompts/models, arbitrary URLs, custom fonts or provider destinations accepted.
- Preview resolves authenticated bounded private bytes into owned blob URLs. SDK runtime state converts back into asset-ID-only Shape documents; ephemeral URLs are never persisted.
- Server render payload resolves same-project ready assets only after current edit permission and byte/hash/format checks. Explicit render confirmation discloses transfer to Shotstack, environment and possible charges; preview/save never dispatch render.
- Map existing `SHOTSTACK_ENV=sandbox|production` to API `stage|v1`, retaining existing configuration compatibility and `ENABLE_EXTERNAL_EDITOR`. Sandbox renders and AI generation have different charging rules; AI generation is excluded.
- Add two functional tables: private video drafts, and render request metadata linked to existing processing jobs. Every mutation rechecks authorization, uses strict Zod and CAS/idempotency; a lost/uncertain provider submission is never automatically repeated.
- Provider output is untrusted: fixed API origin, strict status/job binding, bounded JSON/timeouts, no redirects, output-origin allowlist, bounded MP4/header/hash validation and conditional private writes. Recheck authorization at final SQL publication. Do not invent duration/dimensions from a planning edit.
- Existing immutable deliverables/review remain image-only; a rendered MP4 is an asset, not an approval or automatically shared deliverable. Native UI and canonical scene v1 are unchanged.

## Ownership and interfaces

Root: dependency/lockfile, integration/navigation/settings copy, registry/codegen/native copies, docs/trackers and final checks. Backend: `lib/contracts/video-editor.ts`, `server/db/video-editor{,-schema}.ts`, `server/services/video-editor.ts`, `/api/v1/projects/[projectId]/video-editor/**`, additive migration and SQL tests. Provider: `server/providers/shotstack*.ts`, fixed transport/translation/source signing/output verification, provider unit tests. UI: `features/video/**`, `/create/video`, real SDK client and browser fixture/tests. Coordinate contracts directly; do not edit another owner's files.

API: GET/PUT `/api/v1/projects/UUID/video-editor` for `{draft,capabilities}`; GET/POST `.../renders` for private `{jobs}` or `{job}`; GET `.../renders/UUID` for `{job}`; POST `.../renders/UUID/refresh` for an authorized safe status/import refresh. Draft write `{expectedRevision,document}`; render write `{idempotencyKey,draftRevision,consent:'shotstack-render-v1'}`. Only a saved exact draft revision may render.

Contract names: `VideoEditorCapabilitiesSchema`, `VideoEditorDraftSchema`, `VideoEditorResultSchema`, `SaveVideoEditorDraftSchema`, `CreateVideoRenderSchema`, `VideoRenderJobSchema`, `VideoRenderResultSchema`, `VideoRenderListSchema`. Draft `{projectId,revision,document:MediaEditDocument|null,updatedAt:string|null,canEdit:boolean}`. Capabilities `{availability:'configured'|'unconfigured'|'disabled',reason,environment:'sandbox'|'production'|null,maxDurationSeconds:60,maxClips:50,outputMimeType:'video/mp4'}`. Job `{id,projectId,draftRevision,status:'queued'|'processing'|'ready'|'failed'|'cancelled',environment:'sandbox'|'production',failureCode:string|null,errorMessage:string|null,outputAsset:AssetSummary|null,createdAt,updatedAt}`. No provider IDs/URLs/object keys in DTOs.

## Tasks and checks

- [x] Provider: failing tests for timeline layering/trim/volume/bounds, fixed endpoint/header/no retries, status mappings, malformed response, unsafe output URL/redirect/oversize/MIME; implement adapter and signing/output helpers; run focused tests/types/lint.
- [x] Backend: strict contract regressions; disposable SQL tests for owner/editor/client/unrelated/role revocation, draft CAS, same-key changed-body conflict and no duplicate dispatch, lease/ambiguous submit, immutable source snapshot and final-write checks. Implement APIs, two tables and additive reviewed migration; use existing limits/storage/auth. Never apply live SQL.
- [x] UI: failing browser tests for real editor navigation, clip/overlay changes and preview, CAS save/reload/conflict, explicit render confirmation/status/output, denied and late-session cleanup, unsupported SDK change and resource disposal. Implement actual SDK panel and bounded controls, project selector/catalog, contextual service states and dirty navigation guards.
- [x] Root integration: expose Video Creation route, settings/readiness copy, register JSON operations; generate TS/OpenAPI/Swift and sync native; add round-trip fixtures and run native gates if generated artifacts change.
- [x] Independent review and behavioral fixes, `pnpm check`, relevant/full Chromium flows and desktop/mobile visual QA; Swift/native/Xcode gates for generated changes. Record implemented/configured/live/physical distinctions, actual results, limitations and suggested focused commits in report and both trackers.

## Review focus

Provider input URLs and output URLs never become browser or persisted authority. Lost response cannot incur an automatic second render. Revocation during signing/provider/storage latency cannot publish a private ready result. SDK drag/resize cannot silently corrupt v1 or persist blob URLs. Switching project/session or leaving a dirty editor must cancel/discard stale private resources and protect unsaved edits. Tests belong to each corresponding owner above.

Focused runtime evidence: four distinct actual SDK Chromium flows passed (PNG + recorded WebM, captions, playback, CAS, consent/stable retries, denial, teardown and mobile). Production entry/responsive route passed; 48 Swift round trips and 48 native core tests passed. Workspace unit/SQL suite passed 838 tests across95 files; final production-build/native-project result is recorded in the delivery report.

Final gates PASS: `pnpm check`14tasks,838tests/95files and both production builds; frozen lockfile; six distinct relevant Chromium cases;48 Swift round trips/nine invalid fixtures;48 native core tests; unsigned generic visionOS Simulator project BUILD SUCCEEDED. No live provider/storage/migration/device acceptance or full legacy browser rerun claimed.
