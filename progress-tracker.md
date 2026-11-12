# BoloVerse progress tracker

Last updated: 2026-11-12 (Asia/Kolkata).

## Current phase: XR Phase 1 — Foundation

The newer [XR implementation specification](docs/XR_IMPLEMENTATION_SPEC.md) supersedes the original M1–M9 roadmap. Phase 1 is implemented and locally verified: 164 unit/PostgreSQL tests, nine production Chromium tests, lint, types, formatting, build and schema consistency passed. Live Clerk/Neon and physical-headset acceptance remain unverified.

- [x] Read the attached master XR prompt and save a repository copy.
- [x] Preserve the existing Next.js/Clerk/Neon/Drizzle foundation and local recorder.
- [x] Adopt pnpm, pin A-Frame 1.8.0, add scoped Prettier and GitHub Actions checks.
- [x] Implement authorized create/list/open/edit project metadata with strict validation and a durable creation limit.
- [x] Add private `/xr/[projectId]` and clearly labeled public `/xr/preview` routes.
- [x] Render a real desktop A-Frame scene in an owned, disposable iframe.
- [x] Add sample selection, accessible companion controls, reset and seated/standing views.
- [x] Implement capability detection and explicit WebXR entry/exit with session cleanup.
- [x] Pass 164 unit/PostgreSQL tests, development Chromium tests, lint, typecheck, formatting, production build and schema-drift check.
- [x] Inspect desktop/mobile XR screenshots and decoded recording pixels.
- [x] Independent code review: no remaining Critical/Important findings.
- [x] Complete final production Chromium verification and prepare the local implementation commit.

## Current phase sequence

| Phase | Status |
| --- | --- |
| Phase 1 Foundation | Implemented and locally verified; live account/headset acceptance open |
| Phase 2 Spatial workspace | Not started: manipulation, saved scene state, recovery |
| Phase 3 Creative tools | Not started |
| Phase 4 AI assistant | Not started |
| Phase 5 Client review | Not started |
| Phase 6 Collaboration and polish | Not started |

## Preserved M0 baseline

- Initial commit: `a1b8dc02b01244623916fa3c5493955eb762afce` on `main`, pushed to `origin/main` in the prior handoff.
- Original M0 recording experiment and privacy/tenant boundaries remain intact.
- [Historical M0 evidence](docs/M0_IMPLEMENTATION_STATUS.md) records 93 tests and five browser checks at that milestone; the current suite includes those regressions.

Detailed current evidence and open hardware/provider checks: [implementation status](docs/IMPLEMENTATION_STATUS.md).
