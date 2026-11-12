# BoloVerse M0 Implementation Plan

**Goal:** Establish a buildable, authorized foundation and prove local mono scene recording with microphone audio.

**Architecture:** Next.js App Router with browser-only Three.js recording and server-only Clerk/Neon boundaries. Shared strict Zod contracts define future commands; provider interfaces fail explicitly until implemented/configured. No M1 or later workflow is claimed.

**Tech stack:** Next.js 16, React 19.2, strict TypeScript, Tailwind 4, shadcn-style Radix primitives, Three.js, Clerk, Neon, Drizzle, Vitest and Playwright. Exact compatible versions are pinned after checking registry peer ranges.

**Spec:** `docs/BUILD_SPEC.md`. User explicitly authorizes routine M0 decisions and implementation without another design approval.

## Constraints and review focus

- Missing credentials must allow a public local feasibility experiment but never bypass private authorization.
- A session/project UUID conveys no authority; test unrelated project denial.
- Reject unknown command keys, nonfinite numbers, invalid discriminators and out-of-bounds values.
- Preserve real recorder final chunks; report empty, interrupted and unsupported capture accurately.
- Release microphone/canvas/renderer resources on remount, navigation and failed setup.
- Keep M1 stereo/orientation/voice workflow and all later milestones out of this pass.

## Tasks

1. **Application and test harness** — root owns package/config, routes/layout, normal UI, e2e and documentation. Create a focused entry page and `/studio/feasibility`; show unavailable project setup clearly. Verify responsive semantics and browser navigation.
2. **Contracts/config/providers** — parallel agent owns `src/lib/contracts`, `src/server/config`, `src/server/providers`, `.env.example` and focused unit tests. Write invalid-input tests first; implement strict contracts and lazy config validation; prove missing providers never return fake success.
3. **Authorization/database** — parallel agent owns `src/server/auth`, `src/server/db`, `src/app/api`, `src/proxy.ts`, `drizzle`, DB config/seed and integration tests. Test membership denial and migrations; implement actual Clerk-backed routes and authorized repositories. Live identity/database checks remain unverified without configured accounts.
4. **Recording feasibility** — parallel agent owns `src/features/studio` and recorder unit tests. Export default `StudioClient` with no props. Implement consent, secure-context checks, real mono Three canvas + microphone capture, timer/manual stop, playback/download and cleanup. Root tests actual Chromium media decoding with synthetic microphone input, clearly labeled.
5. **Integration/review** — run full unit/integration suite, lint, typecheck, build, browser workflow and fresh code review. Correct material issues, update evidence/status/runbook and create one local initial commit.

## UI direction

Use a quiet indigo creator workspace with a textile-inspired magenta/gold sample scene. Palette: ink #202438, canvas #f6f7fb, indigo #4f46a5, leaf #236a5b, thread #b8466c, gold #d6ac55. System sans for controls; Georgia for the brand wordmark only. Left-aligned workspace, large real preview, a concise setup column, clear device/privacy feedback. No dashboard metrics or future-feature controls presented as working.

## Execution record

- Repository had only `Implementation_Prompt.md`; no existing work or instructions to preserve.
- Native npm selected because no package manager/lockfile existed. One local initial commit will contain the verified M0 scaffold and evidence.
- Meaningful behavior is tested first; static scaffolding and documentation do not receive implementation-mirroring tests.

- Completed all five M0 tasks. Final verification: 93 tests, five Chromium flows, lint/typecheck/build and schema drift check. Fresh review fixes and exact evidence are in `docs/IMPLEMENTATION_STATUS.md`. Physical phone/live cloud gates remain open; M1 not begun.
