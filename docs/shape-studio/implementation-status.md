# Shape Studio foundation implementation status

12 November 2026 (Asia/Kolkata). This delivery implements the scoped Phase 1 and initial Phase 2 from the [audit and plan](phase-0-plan.md). It does not claim the complete web or visionOS MVP.

## Delivered behavior

- Shape Studio branding, accessible tools rail and floating navigation, semantic light/dark/system appearance, keyboard shortcuts, and responsive controls. Existing dashboard, projects, full-screen A-Frame workspace and mono recorder remain available.
- Image/Video/Audio/3D retain separate prompt text. Public mode is local; opening an authorized project's Creative Studio enables explicit private draft save/reload with revision conflicts and retained local text. Read-only members can inspect all modes without editing.
- Image tools use the existing bounded pre-decode loader. Local brightness/contrast/saturation/softness, centered crop, quarter-turn rotation and bounded sharpening produce actual PNG pixels. Preview supports zoom, keyboard/pointer pan, fit, original comparison and fullscreen. Up to eight local edit snapshots form a filmstrip; they are not generated assets.
- The capability endpoint advertises all four creative generation modes as not implemented. Generate, AI enhancement, asset publishing, moodboards and review actions are visibly unavailable. No fictitious job progress, server history or provider charges are generated.
- `/api/v1` provides safe project CRUD projections, up to 100 ready asset metadata records with an explicit `hasMore`, bounded authorized preview aliases, and per-user/per-project prompt drafts. Unsupported preview formats/sizes receive `contentUrl: null`. Existing APIs remain compatible.
- Draft writes validate trusted Origin, strict schemas and at most 32 KiB; existing mutation callers retain 16 KiB. SQL checks membership at mutation time, enforces expected revision and limits successful saves to 60/minute per subject. Migration `0004_creative_drafts.sql` adds the 21st table and prevents updates/deletes of existing review decisions.
- One published OpenAPI 3.1 document generates TypeScript transport models/client and Foundation-only Swift Codable/Sendable models/routes. Semantic token source generates CSS and Swift constants. Canonical scene validation documents right-handed Y-up metres and XYZW unit quaternions, with explicit adapters from legacy Euler XYZ degrees. Existing persisted XR layouts are unchanged.

## Verification

Final evidence: 349 unit/PostgreSQL tests across 29 files; all 32 unique Chromium cases across the full run and targeted rerun; Swift 6 typecheck with seven round trips and six malformed payload checks. The detailed validation record is maintained in [context/progress-tracker.md](../../context/progress-tracker.md). Checks cover formatting, lint, strict TypeScript, a production build, frozen offline lockfile consistency, unit/PostgreSQL behavior, generated artifact drift and real Swift compilation/JSON round trips.

Browser coverage includes desktop/mobile/dark layouts, actual exported pixels, crop/rotation/sharpening, fullscreen, prompt mode retention, internal navigation confirmation, save/reload/conflict/failure handling, read-only scope and StrictMode cancellation. It also re-exercises scene rendering/teardown, authorized image/video/GLB/glTF fixture previews, layout persistence/roles/conflicts, simulated headset rejection and real local recording output with synthetic microphone input.

Browser drafts and editable XR projects use isolated test-only component servers with HTTP fixtures. SQL authorization/CAS tests use PGlite with mocked Clerk identity, not a production authentication bypass. Public production routes fail closed without configuration. These tests do not establish live Clerk, Neon, R2 or AI account connectivity.

Independent review identified and verified fixes for unsupported asset URLs, dark project-card contrast, stale cancellation state, silent internal-link prompt loss and read-only prompt-mode access. An old XR test selector was updated for the new navigation group. Desktop panels now open without stealing keyboard focus.

## Limits and deployment notes

- Review and apply all five migrations to the intended configured development database before live project use; no live migration was executed here. Immutable review decisions intentionally reject UPDATE/DELETE, including cascades that would delete history. Future retention workflows must explicitly preserve or archive approval history.
- Drafts contain text/mode only. Image edits and variants stay in memory and are lost when leaving the workspace. Local files are never uploaded. Prompt guards cover unload, same-window links and shortcuts, but not browser history Back/Forward; save project drafts before history navigation.
- Sharpness export is limited to four megapixels. General image loading retains the existing 20 MiB, 16-megapixel and 8192-axis limits. Preview is downscaled and may differ in pixel-level sharpness/softness from full-resolution output.
- Organization administration, uploads/finalization, media-generation jobs/history, client portals, new review/delivery APIs, infinite brainstorming canvas and GLB/USDZ conversion remain later phases. Existing text/speech adapters are preserved but live providers are unverified.
- Native research and generated Foundation models are delivered; no Xcode application, native authentication, simulator UI, RealityKit manipulation or physical Vision Pro/Quest verification is claimed. See the [native roadmap](../../apps/visionos/README.md) and [dated primary-source research](native-provider-research.md).
- Accessibility coverage is behavioral and includes keyboard, native dialogs, accessible names, reduced motion and semantic text contrast. It is not a complete WCAG conformance audit. Device performance targets have not been claimed without profiling.

The initial M0 commit remains in history. All new work is committed locally on `feat/shape-studio-foundation`; this phase does not publish or deploy the repository.
