# Feature 03 — Sarvam speech and reviewed legacy commands

Updated 13 November 2026 (Asia/Kolkata). Implements the reliable legacy slice of [Feature 03](../../context/feature-specs/03-sarvam-voice.md); see the [implementation map](../superpowers/plans/2026-11-13-sarvam-voice.md).

## Delivery boundary

**Implemented and locally verified:** explicit voice consent → browser recording/stop → existing authorized Sarvam transcription route → visible/editable transcript → existing Gemini allowlisted proposal → review → fresh permission/version/target validation → explicit Apply → deterministic legacy A-Frame action.

**Live acceptance NOT RUN:** Sarvam/Gemini keys/models, Clerk/database configuration and accounts are absent. Browser tests use actual MediaRecorder with Chromium's synthetic microphone, isolated HTTP provider fixtures and a test-only Clerk SDK boundary. They are not real speech recognition, physical microphone permission testing or live provider evidence.

**Canonical R3F voice NOT IMPLEMENTED:** the specification prioritizes one verified legacy action before canonical extensions and permits this fallback. The live voice stability gate is blocked, so no unused canonical command registry/dispatcher, SELECT/MOVE/ROTATE/SCALE/UNDO voice integration or claim of canonical voice was added. Canonical manual editing, undo, strict v1 scenes and existing CAS remain intact. This is not full Feature 03 live acceptance.

## Before and after

The existing code already sent bounded audio to Sarvam, used Gemini proposals and checked server identity/permissions/quota. It lacked exclusive VoiceCapture ownership, cancellation across all HTTP stages, explicit focus/open previews, Apply-time reauthorization and reliable stale-operation/session isolation.

VoiceCapture now holds a synchronous exclusive lease per application JavaScript realm and releases it on completion, error and cancellation. A cancelled permission prompt settles promptly; any late stream is stopped without affecting a newer capture. Browser recordings remain capped at 20 seconds and 4 MiB. Unsupported formats, interruption, denial, empty capture and recognized silence offer typed-command recovery.

Each assistant operation has a generation token and synchronous busy guard. Cancel aborts pending transcription, interpretation, approval and playback preparation. Hidden/pagehide, unmount, local workspace context changes, permissions, project changes and Clerk session changes invalidate private proposals and release owned microphone/playback resources. Context changes start a fresh, consent-gated assistant instance. Returning to visibility refreshes readiness; failed initialization also offers an explicit retry. Cancel controls remain accessible outside collapsed voice details.

A voice transcript is shown separately and copied into the editable message field. New requests clear old proposals; late cancelled replies cannot replace current state. No raw audio, transcripts or replies are persisted to the database, localStorage or logs. Existing local recording-lab behavior remains isolated and unchanged.

**FOCUS_PANEL** and **OPEN_ASSET** now present an effect/target preview with Discard and Apply. Apply reads the existing authorized workspace endpoint, checks current project identity, editor permission and saved workspace version, validates the target against current panel/asset IDs, then dispatches synchronously after the final generation check. Unknown/foreign targets, stale versions, revoked access and changed sessions cannot execute. One approval consumes the proposal, preventing accidental repeated execution. The existing reset disclosure explicitly states that it saves and replaces the layout; Keep layout now cancels even an in-flight reset authorization.

Focus frames the desktop view only and never changes/persists object transforms. The existing adapter's active-headset guard remains; no headset pose code changed. The real A-Frame fixture verifies camera/selection changes only after Apply, zero implicit writes, and separate manual transform → CAS Save → reload. Physical headset behavior remains unverified.

## API and security

No new route, schema table, migration, dependency, generated API artifact or native code was needed. The existing backend remains authoritative:

- `GET /api/xr/assistant/{projectId}` returns truthful configured/unconfigured/development-mock readiness after editor authorization.
- `POST /api/xr/assistant/{projectId}/transcribe` accepts supported audio bytes with `Content-Type`, `X-Speech-Language: en-IN|hi-IN|kn-IN`, `X-Speech-Consent: xr-voice-v1`, authenticated cookies and exact trusted Origin. It validates declared/streamed size and container, checks configuration, consumes the existing durable account quota and reauthorizes after provider latency.
- `POST /api/xr/assistant/{projectId}` accepts strict bounded `{message, language}`, loads authorized project context server-side and validates every Gemini command against current authorized IDs. It never executes those commands.
- `GET /api/xr/workspaces/{projectId}` supplies fresh authorized data for Apply validation. This read spends no provider quota and does not save anything.
- Existing `PUT /api/xr/workspaces/{projectId}` remains the explicit versioned layout save. Reset remains an explicitly confirmed, separately authorized CAS mutation.

Illustrative transcription response (not live evidence):

```json
{"ok":true,"data":{"text":"Focus the brief","language":"en-IN","mode":"live"},"requestId":"request-uuid"}
```

Illustrative Gemini proposal response:

```json
{"ok":true,"data":{"reply":"Proposed: focus the overview.","commands":[{"type":"FOCUS_PANEL","panelId":"project-overview"}],"mode":"live"},"requestId":"request-uuid"}
```

Recognized silence now returns `400 INVALID_INPUT` with an actionable message, without a fabricated transcript. Unsupported/malformed provider output remains sanitized 503; missing configuration remains honest `503 PROVIDER_UNCONFIGURED`; denied/missing project IDs retain existing 403 policy, unauthenticated access 401, invalid/oversized audio 400/413/415, and the shared provider budget 429. Browser writes retain Origin, strict Zod, bounded-input and resource authorization protections. The unchanged strict XR command registry rejects arbitrary code/tool names and unauthorized asset/panel IDs. An explicit development XR mock remains labelled as such; it does not count as live speech/Gemini acceptance.

The genuine server adapter uses Sarvam multipart STT, as documented in the provider's [REST reference](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe) and [STT overview](https://docs.sarvam.ai/api/api-guides-tutorials/speech-to-text/overview). These references validate the request convention, not a live call. Raw audio is memory-only and is transmitted only after the explicit voice disclosure/record action.

## Verification checklist

| Gate | Status | Command / actual evidence |
| --- | --- | --- |
| Focused speech/provider/SQL | PASS | `pnpm exec vitest run tests/unit/xr-speech-capture.test.ts tests/unit/xr-speech.test.ts tests/integration/xr-assistant-routes.test.ts` — 32 cases. PGlite exercises existing migrations, real repository/permission/quota SQL; only identity/connection/provider HTTP boundaries are mocked. |
| Full workspace | PASS | `pnpm check` — 14 successful tasks, 582 tests in 58 files, lint/types/format/environment/generated drift and both production builds. Final log `/tmp/shape-sarvam-voice-check.log`. |
| Targeted voice + real renderer | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-sarvam-voice-fixed pnpm exec playwright test tests/e2e/sarvam-voice.spec.ts tests/e2e/xr-workspace-editing.spec.ts --max-failures=1` — all 26 cases passed: 12 voice cases, 13 preserved XR cases and one new actual A-Frame voice/focus/CAS case. |
| Complete browser regression | PASS | `PLAYWRIGHT_OUTPUT_DIR=/tmp/shape-sarvam-voice-e2e pnpm exec playwright test --max-failures=1` — all 84 cases in 13 files passed. Actual app routes use the local development server; component/provider/session boundaries use explicitly labelled fixtures. Final log `/tmp/shape-sarvam-voice-e2e.log`. |
| Visual inspection | PASS | Desktop/mobile voice-review screenshots produced and inspected; mobile overflow assertion passed. No physical-device claim. |
| Independent review | PASS | Two concrete races were reproduced with failing tests, fixed and re-reviewed: delayed reset cancellation and hidden-page readiness recovery. No remaining scoped blocker found. |
| Whitespace, scope and secret review | PASS | `git diff --check`; reviewed feature source/test paths and logging/credential patterns. No staged changes or secret-bearing logs/links. |
| Native artifacts | PASS | Included `pnpm native:check` drift gate; this feature changes no native/generated contracts. |
| New Swift tests/Xcode/device run | NOT RUN | No native source/contract changes. Prior Feature 02 evidence remains historical; native remains independent of this web-only increment. |
| Physical microphone + live Sarvam/Gemini | NOT RUN | Required keys/models, Clerk/database setup and accounts are absent. Synthetic microphone/HTTP fixtures are explicitly not this acceptance gate. |
| Canonical voice/transform commands | NOT IMPLEMENTED | Live legacy stability prerequisite remains open. Existing canonical manual flows are preserved and exercised by the full regression suite. |

Observed failures and corrections: the exclusive-owner test failed before the lease; silence was previously misreported as a provider failure; transcript/review/cancel controls were absent; review reproduced Keep layout allowing a delayed reset and hidden initialization getting stuck. Browser recording tests initially stopped before the encoder emitted data; they now wait for observed MediaRecorder output instead of arbitrary sleeps. Session-aware Clerk imports required a test-only SDK alias in the existing isolated XR harness; production Next builds use the real SDK and no auth bypass. Initial sandbox loopback binding failed; permitted local test execution resolved that environment restriction.

## Live prerequisites and manual QA

Configure local `SARVAM_API_KEY`, `SARVAM_STT_MODEL` (`saaras:v3` or `saaras:v4` supported by the existing adapter), `GEMINI_API_KEY`, `GEMINI_MODEL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL` and the exact trusted browser origin. Apply the already-existing migrations in the intended database through the normal approved process. Use a creator/editor account and an existing project. A saved brief gives a clear focus target; project-overview focus requires neither R2 nor TTS credentials. Real asset preview still needs its existing private-storage configuration.

Under 90 seconds: open `/studio/xr/<projectId>` (legacy A-Frame), expand Voice controls, select language, accept the disclosure, record “Focus the brief,” then Stop and send. Review the visible transcript, choose Focus panel, inspect its target/effect and explicitly Apply. Confirm the desktop view frames that panel and no layout save occurred. For persistence, manually move a panel with existing controls, explicitly Save workspace, reload and confirm the transform. `/workspace/<projectId>` is the canonical R3F editor and has no voice integration in this slice.

Also test microphone denial, silence, unsupported format, cancellation during permission/STT/Gemini/approval, hidden/visible recovery, account switch/sign-out, unauthorized Apply and offline/provider failure. The automated fixtures cover these relevant paths; manual signed-in/physical microphone execution is **NOT RUN**. No live smoke request, billed provider call, cloud mutation or physical headset test was performed.

## Exact feature files and commit guidance

Created:

- `tests/e2e/sarvam-voice.spec.ts`
- `tests/browser-fixtures/sarvam-voice-entry.tsx`
- `tests/browser-fixtures/voice-clerk.ts`
- `tests/helpers/voice-browser.ts`
- `scripts/test-sarvam-voice-harness.mjs`
- `docs/superpowers/plans/2026-11-13-sarvam-voice.md`
- `docs/development/sarvam-voice-status.md`

Modified:

- `apps/web/src/server/providers/xr-speech.ts`
- `apps/web/src/xr/assistant/voice-capture.ts`
- `apps/web/src/xr/assistant/use-assistant-client.ts`
- `apps/web/src/xr/assistant/AssistantPanel.tsx`
- `apps/web/src/xr/assistant/assistant.module.css`
- `apps/web/src/xr/XRWorkspace.tsx`
- `apps/web/src/xr/XRWorkspaceClient.tsx`
- `apps/web/src/app/studio/xr/[projectId]/page.tsx`
- `scripts/test-xr-harness.mjs`
- `tests/unit/xr-speech-capture.test.ts`
- `tests/unit/xr-speech.test.ts`
- `tests/integration/xr-assistant-routes.test.ts`
- `tests/e2e/xr-workspace-editing.spec.ts` (preserve earlier Feature 00 test changes)
- `context/progress-tracker.md`
- `progress-tracker.md`

The requested checkout already contained uncommitted Features 00–02, generated artifacts, `.gitignore`, demo documents and `output/`; these were preserved. Only the listed shared XR/test/tracker paths were extended. No dependencies/lockfile, SQL migration, renderer engine, scene schema, native source, conversation persistence or public authentication shortcut was added. Nothing was staged, committed, pushed, deployed or migrated live.

Suggested Conventional Commit: `feat(voice): connect reviewed speech proposals to supported actions`.

After reviewing prerequisite checkpoints, stage exactly the listed feature paths; use patch staging for shared files that also contain earlier uncommitted work. Example new-file staging (not executed):

```sh
git add -- tests/e2e/sarvam-voice.spec.ts \
  tests/browser-fixtures/sarvam-voice-entry.tsx tests/browser-fixtures/voice-clerk.ts \
  tests/helpers/voice-browser.ts scripts/test-sarvam-voice-harness.mjs \
  docs/superpowers/plans/2026-11-13-sarvam-voice.md \
  docs/development/sarvam-voice-status.md
```

Include the exact modified source/test/tracker paths listed above too. Do not use `git add .`. Stop at this legacy feature boundary; live voice acceptance and canonical voice remain open rather than being presented as complete.
