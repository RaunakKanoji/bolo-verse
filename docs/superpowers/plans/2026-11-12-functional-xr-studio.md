# Functional browser XR studio implementation plan

**Goal:** Extend the existing studio into an authorized, editable, persistent creative workspace with capability-aware desktop/VR entry, real project content, and bounded AI/voice actions.

**Architecture:** Reuse Next16.4/React19, Clerk identity, Neon/Drizzle tenancy, existing private assets and provider boundaries. Retain the disposable same-origin A-Frame1.8 realm and M0 recorder. Persist project layouts separately from the older session recording document, using compare-and-swap versions. No auth bypass or invented private content.

**Spec:** `docs/XR_BROWSER_STUDIO_SPEC.md`. The user's instruction to implement and proceed through milestones supplies execution authorization; routine design choices below follow the supplied design.

## Repository audit and reuse

- Strict TypeScript, Tailwind4/shadcn Button, Lucide and pnpm11.12 already configured; preserve them.
- App Router has `/app/projects`, `/xr/[projectId]`, public `/xr/preview`, project APIs and the original recorder. Add authenticated studio entry/landing and canonical studio XR routes; preserve old links.
- Clerk identity and project membership repositories already gate every private access. Neon connection and19-table Drizzle schema exist, with three migrations and PGlite integration tests.
- Existing assets, briefs, artifacts, reviews and rate-limit buckets are reusable. Old `scene_state` is session-specific with a different schema; add one project-scoped `xr_workspaces` table, not another database/ORM.
- Gemini/Sarvam/R2 currently expose unimplemented adapter contracts. Add bounded implementations and explicit local-development mock behavior; credentials remain server-only and live verification remains open without accounts.
- Existing tests:164 unit/PostgreSQL and9 Chromium checks. GitHub Actions, ESLint, types, build and scoped Prettier checks exist. No additional named context files were found.

## Shared contracts

- New `src/lib/contracts/xr-workspace.ts`: bounded `XRTransformSchema`, `XRLayoutSchema` (`schemaVersion:1`, environment, objects with id/type/optional assetId/transform), `XRWorkspaceSnapshotSchema` (`id|null`, projectId, version, layout, updatedAt|null`). Writes carry `expectedVersion` and layout. Strict transforms/unique IDs/max50 objects; no owner or signed URLs accepted.
- `GET /api/xr/workspaces/[projectId]` returns `{workspace,canEdit,project,content}` in existing API envelope. Content is authorized briefs/artifacts/ready-asset metadata/reviews only. `PUT` compares versions atomically. `POST reset` requires expectedVersion. Version conflicts return409 and never overwrite.
- Renderer accepts validated scene document updates without recreating the realm; interaction module handles selected object transforms. Root React shell owns fetch/save/error states and maps authorized content to spatial panels. Public sample remains explicitly local/unsaved.
- Assistant accepts only strict allowed commands; server authorizes context and asset IDs. AI proposes actions, client validates again; reset requires a visible confirmation. Optional speech starts only from explicit microphone activation.

## Milestones and verification

- [x] **1 Foundation:** reusable browser capability probe/hook (VR,AR,WebGL,pointer,touch,microphone,secure context), authenticated studio routes and landing. AR entry stays gated until scene configured. Test missing APIs/rejected promises/refresh/SSR safety.
- [x] **2 Desktop workspace:** light-neutral/blue scoped tokens, navigator/canvas/inspector/assistant layout; selection, move/rotate/scale/reset with keyboard-accessible controls. Renderer updates actual object transforms; no duplicate scenes. Test transform bounds and real browser movement.
- [x] **3 Immersive lifecycle:** preserve supported VR session entry/exit, controller selection; add transform actions to spatial controls and retain desktop state on rejection/end. Development-only measured diagnostics. Simulate lifecycle failures; document actual headset checks separately.
- [x] **4 Project integration:** transactional authorized layout reads/writes/reset, optimistic conflicts, migration and PGlite tests; real brief/artifact/review/asset catalog, private media preview delivery, reload restoration. No default samples inside private projects. Test tenant/role/stale-write/forged asset denial and no false save success.
- [x] **5 AI/voice:** validated server commands and provider adapters, text assistant and explicit microphone consent/record/process states, optional TTS. Time/body/token bounds; development mocks labeled and never authentication substitutes. Test malformed provider output, cross-project commands, missing configuration and cleanup.
- [x] **6 Polish:** scoped CSP and permissions, mobile/keyboard/error/recovery flows, platform and architecture docs under `docs/xr`, updated tracker/status. Run formatting/lint/types/unit+SQL/build/schema-drift/Chromium and fresh independent review. Commit validated milestones locally with Conventional Commits.

## Review focus

1. Concurrent saves and resets must conflict atomically; failed/expired auth must preserve dirty local work.
2. Asset IDs, provider outputs and model resources must not bypass project authorization or fetch arbitrary remote dependencies.
3. Async scene/media/microphone completion after navigation must release resources, not recreate a discarded runtime.
4. Browser/headset feature detection must not turn unsupported optional AR/mic features into desktop failure.
5. Development mocks and public samples must be unmistakable and never substitute for private auth/data or claim live provider/hardware success.

## Visual direction

Use the supplied light surfaces (#f5f7fb/#fff), blue (#3478f6), ink (#1d1d1f), secondary (#8e8e93), border (#dfe4ec). Retain system typography and existing page chrome. Put the creative canvas at the center, compact project navigator left, inspector/assistant right, and action toolbar below; collapse panels below the canvas on narrow screens. Spatial panels carry actual project content; no fabricated approvals or usage metrics.

## Completed local verification

306 unit/PostgreSQL tests and 24 production-browser checks pass, along with lint, types, scoped formatting and production build. See [implementation status](../../IMPLEMENTATION_STATUS.md) for exact boundaries and open live-service/headset acceptance. Validated code is committed locally; no deployment or push is claimed.
