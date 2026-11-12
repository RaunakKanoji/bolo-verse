# Implementation status

Updated 2026-11-12 (Asia/Kolkata). Current scope: **XR Phase 1 — foundation**, following the user's newer [master specification](XR_IMPLEMENTATION_SPEC.md). Phase 2 has not started. The original M0 recorder is preserved; its historical evidence is [archived separately](M0_IMPLEMENTATION_STATUS.md).

## Implemented

- Existing Next.js 16 / React 19, strict TypeScript, Tailwind/shadcn, Clerk and Neon/Drizzle foundation retained. pnpm 11.12.0 replaces npm; pinned dependencies, one lockfile, scoped Prettier and a GitHub Actions quality workflow are included.
- Real project metadata creation/list/open/edit. Strict schemas reject extra fields; the server selects the user's personal workspace. Project and creator membership creation are transactional. Owners/creators/editors may update; clients remain read-only. Trusted origins, a 16 KiB JSON limit and a durable ten-creations/hour budget protect mutations. No new migration is needed.
- Server-authorized `/xr/[projectId]` loads project name/objective only after identity/membership checks. Missing configuration, signed-out, forbidden and unavailable states are explicit. Public `/xr/preview` contains original sample content, clearly labeled unsaved; it cannot substitute for private project access.
- A-Frame 1.8.0 loads from a local pinned distribution in a disposable same-origin iframe. One adapter owns its scene and cleanup; React owns the accessible companion controls. A-Frame's Three fork is isolated from the original recording engine. No runtime fonts, scripts, photos or controller models are fetched from external hosts.
- Real desktop rendering, pointer look, focused W/A/S/D, reset, seated/standing views and sample selection. The 2D inspector remains accessible. Scene documents have strict versioned validation, but scene persistence/manipulation is not a Phase 1 feature.
- Secure-context/WebXR detection, explicit immersive session request, verified presenting state, controller rays, spatial/2D exit controls and session teardown. Rejected or late sessions do not claim success. Fatal graphics errors preserve the active session's exit control. Headset behavior remains physically unverified.
- Original `/studio/feasibility`: actual mono portrait canvas plus microphone recording, consent, interruption handling, playback/download and encoded draft watermark. Local media remains unsaved and private to browser memory.

## Verification evidence

Environment: macOS, Node 24.22.0, pnpm 11.12.0 and Playwright Chromium 158.0.8127.18. No physical headset or Android device was attached; no live provider secrets were configured.

| Check | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile --offline` | Passed with the downloaded packages; lockfile unchanged and supply-chain checks passed |
| `pnpm format:check` | Passed for XR/project UI modules |
| `pnpm lint` | Passed, zero warnings/errors |
| `pnpm typecheck` | Passed |
| `pnpm test` | **164 passed** across 11 files, including 53 project-mutation cases and 18 XR cases |
| `pnpm build` | Optimized production build passed; public preview static, private project/XR/API routes dynamic |
| `pnpm db:generate` | Nineteen tables, no schema changes/drift |
| `pnpm test:e2e` against development server | **9 passed**: actual XR pixels, selection, missing-headset state, no external asset requests, mobile layout, route cleanup, private denial and original recording regressions |
| `pnpm test:e2e` against production server | **9 passed** after the final exit-control fix; same XR and recording behaviors verified |
| Visual inspection | Desktop 1440px and mobile 390px XR screenshots inspected; original decoded video frame contains artwork, text and draft watermark |
| Independent review | No remaining Critical/Important source findings; did not claim hardware/provider validation |

Sandbox execution note: installation used the host pnpm store. Sandboxed pnpm commands discover a different writable store and attempted an unnecessary automatic reinstall. Checks used the session-only `pnpm_config_verify_deps_before_run=false` environment override after successful installation. This does not change repository settings, lockfile verification or supply-chain policies. A first large-package download timed out; the longer-timeout retry succeeded. Initial new browser/CLI assertions were corrected for actual capability copy and pnpm's script logging, then rerun.

Project integration tests mock Clerk identity/network and use real repository/route SQL against PGlite PostgreSQL. They cover cross-tenant denial, role changes, transactional rollback, concurrent budget enforcement, origin/content-type/body bounds and malformed UTF-8 cleanup. They do not establish live Clerk token verification or a remote Neon connection.

XR session lifecycle tests use simulated browser/renderer boundaries to exercise request rejection, retry, end, failed binding and late resolution after disposal. Desktop Chromium runs the actual A-Frame/WebGL renderer. Pixel checks reject blank output; tests also prove the parent document has no A-Frame custom element or AFRAME/THREE global and that navigation reopens exactly one scene. These checks cannot establish physical headset comfort, controller mapping or performance.

The recording browser check uses a synthetic Chromium microphone with real rendering, MediaRecorder encoding, decoding/playback and file download. It observes nonempty 720×1280 media and an audio track, with actual artwork/watermark pixels. Synthetic input does not measure real microphone quality. Evidence images and media are ignored artifacts in `test-results/`.

## Open acceptance and later work

- **Live Clerk/Neon:** configure credentials and allowed domains, apply the three existing migrations to a development database, then test real sign-in, create/edit/reload, client read-only access and unrelated-user denial. There is no public authentication bypass.
- **Physical headset:** on HTTPS, verify entry/exit, parent-button activation reaching the same-origin XR frame, head tracking, both controller rays, reconnect, seated/standing comfort, errors, session teardown and sustained performance. Follow [the runbook](DEMO_RUNBOOK.md); leave outcomes unverified until performed.
- **Physical Android:** original recording codec, microphone, heat and second-device playback acceptance remains open.
- **Phase 2 onward:** object placement/manipulation, persistent scenes, uploads/assets, creative tools, AI/voice, review and collaboration remain deferred. R2/Sarvam/Gemini interfaces are not live integrations. No fake save, generated result, approval or metric is supplied.
- **Hosting/CI:** no deployment or cloud resource was created. The new workflow has local-equivalent verification but has not yet run on GitHub for this branch.

## Repository handoff

Initial M0 commit `a1b8dc02b01244623916fa3c5493955eb762afce` exists on `main` and was pushed to `https://github.com/RaunakKanoji/bolo-verse.git` during the prior handoff. Phase 1 is retained on local branch `feat/xr-foundation`; its handoff includes the implementation, pnpm lockfile, tests, tracker and documentation. No Phase 1 push or deployment is claimed.

Next scope is **Phase 2 — spatial workspace**. Stop at this phase boundary until the user asks to continue.
