# Reference-led studio delivery

Updated 2026-11-12, Asia/Kolkata.

This records the concurrent visual/editor session's checks. Integration subsequently added pre-decoder image validation and four regression tests. The combined final run passed **306 unit/PostgreSQL tests and 24 production-browser tests**; see [implementation status](../../IMPLEMENTATION_STATUS.md) for the latest evidence and local commits.

## Implementation

The existing browser XR stack was retained: Next.js 16/React 19, strict TypeScript, Tailwind/shadcn, Clerk, Neon/Drizzle, private R2, A-Frame 1.8 in its own same-origin realm, Gemini/Sarvam server adapters, validated workspace commands, bounded asset readers, optimistic layout persistence, and the isolated mono recording lab.

The two supplied references informed a new BoloVerse interface with translucent lavender surfaces, project navigation, dashboard, and image canvas. The app keeps its own product name. Public campaign imagery was generated as original illustrative studies and is explicitly labeled. No campaign progress, deadlines, clients or approvals were invented.

### Files

- New `src/features/workspace/`: shared `StudioShell`, `DashboardPage` server loader, `StudioDashboard`, `ImageCanvas`, `useImageCanvas`, and three CSS modules.
- New `/studio/create` public local image canvas; `/` and `/studio` reuse the authorized dashboard loader.
- Updated project list/detail and spatial landing pages to use the shared shell. Public sample scenes open through the existing XR preview route.
- Updated authorized asset route to use the canvas for PNG/JPEG/WebP after existing server access checks; other media retain the protected viewer.
- Updated global/XR CSS, browser navigation assertions, and new `creative-studio.spec.ts`.
- Added `public/studio/campaign-studies.png` as original illustrative artwork.
- Architecture/testing documentation extended; implementation plan is `docs/superpowers/plans/2026-11-12-reference-studio.md`.

### Behavior

Dashboard project names/counts/search come from authorized projects. Missing configuration/sign-in is explicit, with public sample exploration remaining available. Image uploads stay local; size, type and dimensions are bounded. Brightness, contrast, saturation, softness, presets, comparison and reset are implemented. PNG export draws adjusted pixels into a real canvas and downloads an actual file. Edits do not claim project persistence or overwrite source assets. Object URLs and pending requests are released on replacement/unmount.

No new database migration or API was introduced by this visual/editor extension. It reuses the functional XR migration and protected project/layout/asset/assistant APIs already present in the working tree.

## Verification

- `pnpm lint`: passed.
- `pnpm typecheck` and production build TypeScript: passed.
- `pnpm test`: 302 passing tests across 21 files.
- `pnpm build`: passed.
- New browser tests verify dashboard connection state/navigation, desktop/mobile overflow, image adjustments/presets/comparison/reset, actual local upload and PNG export. Export pixels are decoded and checked, not inferred from button clicks.
- Desktop dashboard/image canvas and mobile screenshots reviewed.
- Existing recording, XR rendering, save/reload/conflict/read-only, protected image/model/video fixture and session rejection browser cases included in the final production run.

## Remaining acceptance

Live Clerk/Neon/R2/Gemini/Sarvam account verification and physical Vision Pro/Quest/browser/device performance are unverified. Browser fixtures and PostgreSQL tests do not establish live provider or headset compatibility. Native visionOS, immersive AR placement, professional editing, image generation, saved image edit documents and collaboration remain outside this delivered browser prototype.

Next milestone: configure a development tenant and run real sign-in → project → protected asset → saved/reloaded workspace → assistant on HTTPS, then complete the physical-headset checklist in docs/xr/testing.md.

Final production browser result: **24/24 passed** in Chromium against `http://127.0.0.1:3107`. Evidence was written outside the repository under `/tmp/boloverse-reference-final`; it is not a committed build artifact.
