# Shotstack Video Creation integration

Implemented the in-app integration selected by the user. Open `/create` → **Start Video Creation**, or `/create/video?projectId=PROJECT_UUID`. The actual pinned Shotstack Studio SDK renders the embedded canvas and timeline; this is not an MCP connector or external Studio short link.

## Implemented

- Project selector and authorized ready asset catalog; actual private image/video previews from bounded authenticated bytes and owned blob URLs.
- Strict existing media-edit v1 projection: sequential clips, start/length/trim/volume, titles/captions, aspect ratio, playback, SDK timeline interaction and explicit revision-checked save/reload. Unsupported SDK transforms, tracks, sources and generative settings fail visibly rather than silently changing persisted content.
- Actor-private drafts and render history. Explicit confirmation binds a render to one saved draft revision, environment and stable UUID request key. Preview/save do not dispatch renders.
- Server-only Shotstack transport, fixed `stage`/`v1` endpoints, bounded responses, no redirects or automatic render retries. A durable dispatch marker prevents repeated uncertain submissions; status refresh only polls the stored job and imports its result.
- Same-project authorization and verified source snapshots before signing, dispatch and final publication. Temporary private R2 source capabilities are created only on the server for the explicitly confirmed provider handoff. Provider IDs, keys, object keys and source/output URLs are omitted from client DTOs and logs.
- Allowlisted provider output fetch, 20 MiB bound, MP4 structure/hash validation, conditional immutable R2 writes and crash recovery by readback verification. A ready output becomes a private project asset, with unmeasured dimensions/duration left null.
- Session/project teardown, dirty navigation protection, immediate source URL revocation, SDK pause/disposal, bounded SDK load and private late-result rejection.

Limits: 60-second timeline, 50 source clips/50 overlays, 20 MiB per source/output, image trim zero, video volume 0–1 and source trim+length at most 600 seconds. A known source duration is enforced exactly. Unknown video duration remains unknown; user-entered timing is a bounded plan and the provider may reject a range beyond its actual source. Titles/captions are text overlays, not automatic speech transcription. SDK/cloud source fitting agrees on contain.

## Configuration

Existing server variables: `SHOTSTACK_API_KEY`, `SHOTSTACK_ENV=sandbox|production`, `ENABLE_EXTERNAL_EDITOR=true`. `sandbox` maps to API `stage`; `production` to `v1`. Identity, project database and private R2 must also be configured. Configuration presence is labeled unverified. No secret belongs in a `NEXT_PUBLIC_` variable or Studio link.

Review the additive `drizzle/0011_video_editor.sql` and all preceding migrations against the intended database before an operator applies them. This work did not run live migration, provision services or submit a provider render. The migration adds two functional tables, `video_editor_drafts` and `video_render_requests`, and reuses existing `processing_jobs` and `assets` (33 tables total).

Render consent discloses that Shotstack receives the selected source assets and edit, the environment, and possible charges. AI asset generation is outside this slice. Sandbox rendering and AI generation have separate charging behavior; no AI prompt/model fields are accepted here.

## API

All routes require verified identity and current edit permission; private records additionally belong to the current actor.

| Method | Route | Operation |
| --- | --- | --- |
| GET | `/api/v1/projects/UUID/video-editor` | Read private draft and configuration projection |
| PUT | same | Save `{expectedRevision,document}` with CAS |
| GET | `.../video-editor/renders` | Read up to 50 private attempts |
| POST | same | Explicit `{idempotencyKey,draftRevision,consent:"shotstack-render-v1"}` |
| GET | `.../video-editor/renders/JOB_UUID` | Read stored status without provider dispatch |
| POST | `.../video-editor/renders/JOB_UUID/refresh` | Strict `{}` body; poll existing provider job and verify/import output |

Six JSON operations and ten schema entries are registered in shared TS/OpenAPI/Swift artifacts. Native copies are synchronized. Eight new Swift fixtures cover empty/saved drafts, render consent, empty refresh, uncertain outcomes and ready private assets. No native editor UI or scene v1 migration was introduced.

## Files and boundaries

- New UI: `apps/web/src/features/video/*`, `apps/web/src/app/create/video/page.tsx`.
- New API/domain: `lib/contracts/video-editor.ts`, `server/db/video-editor{,-schema}.ts`, `server/services/video-editor.ts`, `app/api/v1/projects/[projectId]/video-editor/**` under `apps/web/src`.
- New provider: `server/providers/shotstack.ts`, `shotstack-media.ts`; existing registry now exposes the implemented editor adapter. Rendering still requires its authorized service resolver.
- Modified entry/settings, environment comments, Drizzle config, API registry, generated artifacts and native copies.
- Pinned dependencies: `@shotstack/shotstack-studio@2.31.0`, direct `pixi.js@8.23.0` for safe public-API private-image preloading. Lockfile included. Browser-only native-canvas/ffmpeg install scripts are explicitly disabled; server rendering uses HTTP, not local ffmpeg.
- Tests: provider/media, contract/body/service/SQL, SDK conversion/private preview and actual SDK browser harness; root entry/navigation regression. A one-line existing production-artifact fixture type was widened to `unknown` so its intentional untrusted-field rejection case typechecks.

## Verification

Observed focused results: 18 backend/body/service/contract cases, 38 provider/media cases (including preview/cloud fit parity), 11 UI conversion/preview cases and five provider registry cases passed. Four distinct actual SDK Chromium flows passed: PNG plus recorded WebM/caption/trim/volume/preview/CAS save-reload; explicit render consent and stable ambiguous retry; conflict/dirty-navigation/denial; StrictMode/session cleanup/mobile. The production Video Creation entry passed navigation and responsive checks at 1440/768/390 px. Existing project-context entry regression also passed.

Frozen lockfile installation passed. Swift passed 48 bidirectional fixtures/nine invalid payloads. Native core passed 48 tests/nine suites. Final `pnpm check` PASS: all 14 tasks, 838 tests/95 files, lint/types/format/environment validation and generated TS/OpenAPI/Swift/native drift checks, plus both production builds (3m3.535s). The production route and four actual SDK browser flows passed; no full legacy Chromium rerun was performed for this increment. Unsigned checked-in Xcode project build for generic visionOS Simulator passed (`-jobs 2 CODE_SIGNING_ALLOWED=NO`). This is compilation, not simulator interaction or physical-device acceptance. Screenshots were inspected; a light-theme contrast issue was corrected in the final scoped CSS. All private/provider responses in browser tests are explicit fixtures; no live integration is inferred.

Independent review corrections include: source revocation during final output publication; JSONB key ordering; unknown source duration; exact trim bounds; idempotent/terminal reads after configuration changes; unsafe SDK track partition changes; private teardown and preview/cloud fit parity. Relevant cases have regressions. The earlier full check found an unrelated untrusted-input test type error; the fixture-only correction is included.

## Remaining operational acceptance

No live Shotstack render or private cloud read/write was performed. Real-account/Neon/R2/Shotstack acceptance still requires configuration and separately authorized migration. Current output validation establishes container structure/hash, not full codec/playback certification. One-hour source URLs can expire in a long provider queue; failure never silently resubmits a render. Interrupted dispatches remain uncertain and require deliberate operator/user reconciliation. No server-side cancellation, template management, Shotstack AI generation, permanent Studio sharing, automatic deliverable publication or video client-review expansion is claimed.

Suggested review commits: `feat(video): add private Shotstack editor drafts and render workflow`; `feat(video): embed Shotstack timeline and private previews`; `test(video): verify render authorization and SDK lifecycle`.

Official references checked: [Studio SDK](https://shotstack.io/docs/guide/studio-sdk/), [authoring conventions](https://shotstack.io/docs/guide/agents/conventions/), [Edit API](https://shotstack.io/docs/api/), [temporary output examples](https://shotstack.io/docs/guide/getting-started/hello-world-using-curl/). No staging, commit, push or deployment was performed.

Evidence logs: `/tmp/shape-shotstack-check-final.log`, `/tmp/shape-shotstack-entry-final.log`, `/tmp/shape-shotstack-parity-green.log`, `/tmp/shape-shotstack-swift.log`, `/tmp/shape-shotstack-native.log`, `/tmp/shape-shotstack-xcode-final.log`. Browser fixture output: `/tmp/shape-video-first-final`, `/tmp/shape-video-sdk-results`. Frozen lockfile install: `/tmp/shape-shotstack-lock-check.log`. These are local ephemeral logs, not committed artifacts.
