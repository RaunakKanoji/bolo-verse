# Browser demo deployment checklist

Run against an isolated development environment. This checklist records required work; unchecked entries are not approvals or completed deployment.

- [ ] Run `pnpm demo:preflight`. Resolve missing names locally; do not paste values into issues, logs or chat. A zero exit establishes configuration presence only.
- [ ] Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and real development client/creator accounts with correct allowed callbacks.
- [ ] Set private `DEMO_CREATOR_CLERK_ID` to the active designated creator in that same Clerk instance. The submitting client must be a different account.
- [ ] Confirm the intended `DATABASE_URL` and review migrations `0000` through `0010` before operator-managed application. Use `DATABASE_MIGRATION_URL` for migrations if required. No live migration was run in this QA pass.
- [ ] Configure private R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`; apply exact-origin upload CORS, never public bucket access. See `docs/development/r2-storage-setup.md`.
- [ ] Set `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_IMAGE_MODEL`, `SARVAM_API_KEY`, `SARVAM_STT_MODEL` to supported account models. Verify through actual authorized app actions; do not infer success from nonempty variables.
- [ ] Align `NEXT_PUBLIC_APP_URL`, `ALLOWED_ORIGINS`, web internal origin and spatial origin with the actual portal. Root `pnpm dev`/`pnpm start` launches the two applications. Public portal/API are one origin; the internal spatial port is not the portal.
- [ ] Use HTTPS for hosted microphone/WebXR and secure cookies. Retain camera permission only on the recording route and microphone disclosure/consent.
- [ ] Schedule/configure the image worker (`pnpm jobs:run`) and reviewed cleanup procedure. A queued job is not a generated asset; ambiguous billed attempts must not repeat automatically.
- [ ] Run frozen dependency consistency, lint/types/tests, `pnpm check`, generated-contract/native drift checks and the relevant production Chromium suites on a stable, sufficiently free filesystem. Review current TEST_RESULTS.md.
- [ ] Rehearse `/projects/new` → original client uploads → designated creator → brief/Brainstorm → production save/reload → generated image → versioned review → revision → approval → activity.
- [ ] Test the same project with an unrelated account: no private data. Test read-only client boundaries: no creator artifact/AI/draft mutation. Test expired/revoked review assignment and exact-version decisions.
- [ ] Verify actual asset readback after refresh, cross-account handoff, failed-upload retry, CAS conflict recovery and one real provider response. Existing fixture suites are supporting evidence only.
- [ ] Rehearse microphone recognition on the presentation browser separately from the typed/synthetic-STT command flow. Retain keyboard/pointer fallback.
- [ ] Complete missing direct AI script/storyboard generation before promising the full requested workflow.
- [ ] Use the repository's reviewed deployment arrangement for both applications. No Vercel project, external editor, domain or production deployment was created here.

Do not select READY until every critical live criterion has evidence. Native visionOS is independent and does not block browser acceptance.
