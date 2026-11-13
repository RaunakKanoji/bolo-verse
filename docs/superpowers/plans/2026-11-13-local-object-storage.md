# Local object storage implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pending R2 setup with actual private Docker storage for local development, as explicitly selected by the user. Also launch the existing visionOS app and add the requested small shape icon.
**Spec:** Direct user requests on13November2026: use alternative object storage; local Docker for development; start visionOS; add small shape app icon.
**Architecture:** Existing S3-compatible SDK transport and strict private upload/authorization/finalization remain. Add explicit `STORAGE_PROVIDER=local-s3` with loopback-only endpoint and S3_* server credentials; preserve default R2 configuration compatibility. A dedicated SeaweedFS4.53 compose owns one persistent development bucket. Separate icon assets/native launch work is independent of storage.
**Tech stack:** Existing AWS SDK, strict TypeScript/Zod, Docker Compose, SeaweedFS, Next, independent Xcode.

## Constraints and review focus

- No public buckets, auth bypass, private fake rows, secret logs, arbitrary storage URL or hosted loopback storage. Preserve default legacy wire IDs/contract names; labels can describe local storage honestly.
- Secret env values remain server-only and are removed before starting the separate spatial app. Browser gets only bounded expiring upload capabilities; private reads remain authenticated backend proxies.
- Single dedicated compose project/volume, loopback-only S3 publication, generated ignored0600 credentials. Never reset another Docker app or wipe persistent data on startup.
- Verify real conditional create, signed upload/readback/SHA256, anonymous denial, CORS and persistence. Distinguish storage verification from Clerk/Neon private-project acceptance.
- Existing dirty work is preserved. No staging, commits, pushes, live migrations, cloud/billed AI calls.

## Tasks

### 1. Provider configuration and app transport
- [ ] Add failing configuration tests for explicit local selection, missing/unsafe endpoints, hosted rejection, R2 compatibility and safe readiness.
- [ ] Implement shared `server/providers/private-storage.ts`; integrate bounded reader, image writer/signer, recording/library writer and cleanup. Use one selection/config path; retain their independent limits and immutable checks.
- [ ] Update Gemini prerequisite inspection and provider readiness without claiming a live integration. Strip STORAGE_ and S3_ vars from spatial child processes; extend `.env.example`.
- [ ] Focused unit/integration checks then `pnpm check`.
Suggested commit: `feat(storage): support private local S3 transport`.

### 2. Isolated Docker storage (delegated)
- [ ] Pinned SeaweedFS compose, ignored credentials/config, idempotent setup script. Start actual service; private bucket + exact-origin CORS.
- [ ] Real raw-SDK storage checks and report. Root verifies application signer/reader/writer against it independently.
Suggested commit: `feat(dev): provision local SeaweedFS object storage`.

### 3. Native launch and icon (independent)
- [ ] Boot Vision Pro simulator and launch installed Shape Studio, clearly identifying prior build.
- [ ] Add consistent small lavender geometric icon to web/native assets, compile checked-in Xcode project, install/relaunch fresh build. Keep native independent of JavaScript.
Suggested commit: `feat(brand): add Shape Studio app icon`.

### 4. Final verification and delivery
- [ ] Fresh scoped review of storage boundaries, fix material findings.
- [ ] Full workspace gate and relevant browser flow, native asset compile/drift, real storage smoke/persistence. Report exact limits; no physical headset or private-project live acceptance inferred.
- [ ] Update storage setup report and both trackers, document startup/recovery and pending Clerk/Neon configuration.

## Final state

Local rawS3 and actual application signed-image/write/read/immutability/private checks PASS; shared adapter and strict configuration implemented; focused unit/provider checks29pass. Scoped source review clean and scopedESLintpass. Native arm64 fullbuild and iconcatalogPASS; freshappinstalled/launched and workspace screenshotinspected. Full workspacegatefailedon unrelatedexisting `production-artifacts.test.ts:327` TS2353 after10tasks; SQLhooktimeouts earlier underresourcepressure. Userrequestedfastfinish, so these limits are explicitlyreported instead of claiming a fullgatepass. Dockerdaemoncontrol-liveness/restartacceptance remainopen; S3HTTPtestedlive. No commit/stage/cloud/deploy.
