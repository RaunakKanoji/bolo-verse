# Implementation status

Updated 2026-11-12 (Asia/Kolkata). Current scope: **M0 — foundation and feasibility**. M1 is not started; wait for the user's `next`.

## Implemented

- Next.js 16 / React 19 App Router, strict TypeScript, Tailwind 4, checked-in shadcn/Radix Button, responsive entry/workspace/lab screens, manifest/icons, accessible navigation and setup/error states.
- Canonical v1 strict Zod command union, envelopes, locales, bounded document/media/provider schemas. These validate proposals; the stateful command dispatcher/reducer is later work.
- Lazy server-only environment validation, explicit migration URL fallback, local-only demo guard, provider/storage/editor interfaces with unconfigured/configured-unverified states. Unsupported provider operations throw; none fabricate results.
- Clerk proxy and server identity checks; private project list/detail APIs with no-store structured results; membership-scoped repositories; transactional/idempotent personal-workspace creation.
- Nineteen typed Drizzle tables and three reviewable SQL migrations. Composite project foreign keys, operation-ID bounds/uniqueness, immutable ready output/source and asset identity protection. R2 byte immutability still requires the actual M3 upload/finalization implementation.
- Idempotent fictional Ilkal sample seed with brief, direction, script and three storyboard cards. CLI resolves a real Clerk account before writes. No output or approval is fabricated.
- Browser-only Three.js mono experiment: original procedural textile card, fixed portrait camera, encoded draft watermark, capability checks and explicit local narration consent. Real microphone API + canvas MediaRecorder, 5/15-second timer, manual stop, MIME negotiation, final chunk handling, empty/interrupted/error rejection, resource cleanup, local playback and actual-format download.
- Completed local takes remain in memory for download/discard; they are clearly **not saved**. No audio upload, speech recognition, transcript retention or cloud save occurs. In-app links warn before discarding; reload/close uses the browser unload warning. Back/Forward can bypass link confirmation and lose the take.

## Changed files

- Application/tooling: `package.json`, `package-lock.json`, TypeScript/Next/Tailwind/ESLint/Vitest/Playwright configs, `components.json`, `src/app/**`, `src/components/ui/button.tsx`, icons.
- Contracts/config/providers: `src/lib/contracts/**`, `src/server/config/**`, `src/server/providers/**`, `.env.example`.
- Server/data: `src/proxy.ts`, `src/server/auth/**`, `src/server/db/**`, `src/app/api/projects/**`, `drizzle/**`, `drizzle.config.ts`, `scripts/seed.ts`.
- Capture: `src/features/studio/**`; checks: `tests/unit/**`, `tests/integration/**`, `tests/e2e/**`.
- Documentation: preserved `Implementation_Prompt.md`; added `AGENTS.md`, `progress-tracker.md`, `README.md`, `THIRD_PARTY_NOTICES.md`, `docs/BUILD_SPEC.md`, `docs/DECISIONS.md`, `docs/INTEGRATIONS.md`, `docs/DEMO_RUNBOOK.md`, this status and the M0 plan.

## Verification evidence

Environment: macOS development host, Node 24.22.0, npm 11.19.1, Playwright Chromium **158.0.8127.18**. No physical Android device was attached.

| Command/check | Observed result |
| --- | --- |
| `npm install --save-exact --no-fund --no-audit` | Dependencies installed; exact direct versions and lockfile committed. Subsequent package additions also installed successfully. |
| `npm run lint` | Passed, zero warnings/errors |
| `npm run typecheck` | Passed |
| `npm test` | **93 tests passed**, six files; includes real PostgreSQL/PGlite migration/repository tests and seed-CLI rejection tests |
| `npm run build` | Optimized production build passed; public screens static, private API/workspace routes dynamic |
| `npm run db:generate` | Nineteen tables, no schema changes/drift |
| `npm run test:e2e` | **5 tests passed**: home/setup, consent/real recording/audio/playback/download/decoded frame, missing-config API denial, completed-take navigation guard, active-take navigation guard. No WebGL INVALID_OPERATION errors. |
| Desktop/mobile viewport inspection | Rendered UI inspected at 1440px and 390px widths; mobile accessible link names preserved |
| Fresh code review | No remaining Critical/Important M0 issues. Timing label clarified; Back/Forward limitation documented. |

The recording test uses a **synthetic Chromium microphone**, while canvas rendering, MediaRecorder encoding, video decoding/playback and file download are real. It observed 720×1280 decoded video, nonempty WebM bytes and one decoded audio track. A decoded PNG frame was visually inspected: the textile artwork, text and encoded draft watermark are present (not a blank/black video). The actual `.webm` and decoded frame remain in ignored `test-results/` for this run. Optional bundled Playwright FFmpeg inspection reported VP8 video and mono 48 kHz Opus audio; its minimal build lacks the requested null muxer, so that standalone decode command failed and is not counted as verification. Successful media decoding/playback evidence comes from Chromium. The 30 fps setting is a configured target, not a measured sustained frame rate. Elapsed-to-ready includes encoder finalization, not exact encoded media duration.

Auth integration tests mock only Clerk identity/network boundaries and replace the connection provider with PGlite; actual route/repository SQL runs against PostgreSQL. This proves application authorization logic, not live Clerk token verification or a live Neon connection. The actual Clerk code path uses the SDK and has no public test-auth bypass.

Bugs found and corrected during verification: StrictMode remount lost the WebGL context; reused WebGL pixel-store state caused initialization warnings (now reset on disposal); missing link-navigation warning for local takes; operation IDs accepted by shared schemas were rejected by UUID database columns; an asset could reference an upload grant from another project. Regressions cover these paths.

Sandbox restrictions initially blocked local ports, browser launch and Turbopack worker ports; reruns with approved local-execution permissions succeeded. These were environment restrictions, not passed application checks. An initial lint configuration warning was corrected.

## Unconfigured / unverified / deferred

- **Not deployed:** no remote repository, cloud deployment, Neon project, Clerk application or R2 bucket was created. The initial commit is local only.
- **Clerk + Neon:** provide real Clerk publishable/secret keys, database URL, configure sign-in domains, and apply all three migrations to a development database. Live login, remote persistence and seed remain unverified.
- **R2 / Sarvam / Gemini:** interfaces only; no live operation in M0. Storage CORS, upload/finalization, speech models/speakers, actual voice quality, structured model output and usage budgets are later integration gates.
- **Physical Android/headset:** microphone quality, motion axes, stereo readability, codec behavior, encoding load, FPS, heat/battery and second-phone playback remain unverified. Synthetic input cannot establish them.
- **M1 onward:** stereo/orientation/recenter, full preflight, scene edits/undo, VAD/voice, project editing/assignment UI, phone pairing, cloud media save/watch links, brand checks and client review are not active. No live model/media result, approval, analytics or provider success is simulated.
- Local recording consent stays in page memory (version/time); durable authenticated session consent is implemented with the later studio session flow. Local media is lost on reload/navigation unless downloaded; no recovery is promised.
- The draft watermark is burned into the file. Approval cannot remove encoded pixels. A future clean export requires a new verified render.

## Exact Android checks

1. Deploy this code to a selected Vercel HTTPS preview; use `https://<preview-host>/studio/feasibility` on Android Chrome. An HTTP LAN IP does not satisfy protected-browser API requirements.
2. Keep the phone outside a headset. Confirm readiness, accept the local microphone disclosure, tap **Record 5-second test**, grant microphone access and speak.
3. Let the timer stop; play the local result with sound. Check encoded dimensions, actual MIME/extension and visible watermark, then download before leaving.
4. Repeat a 15-second take and manual stop. Test denied permission, backgrounding during a take, retry and download playback on a second phone. Record real device/browser versions and outcomes; do not mark unperformed tests passed.

Full instructions and recovery: [DEMO_RUNBOOK.md](DEMO_RUNBOOK.md). Setup and exact commands: [README.md](../README.md).

## Repository handoff

Initialized Git on `main` and created the requested initial local commit containing M0, the lockfile, migrations, documentation and tests. No remote/push was performed.

## Milestone handoff

M0 code is implemented and locally verifiable; live cloud/physical-device acceptance is explicitly open. Next is **M1 — stereo studio**, only after the user says `next`.
