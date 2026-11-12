# Shape Studio: audit and implementation plan

Date: 12 November 2026 (Asia/Calcutta). Scope authorized by the new master brief: audit, shared foundation (Phase 1), and the initial web creative studio (initial Phase 2). Later phases are planned, not implemented simultaneously.

## 1. Repository audit

The working app is a root Next.js 16.4.6 App Router project with React 19.2.9, strict TypeScript 5.9.3, Tailwind 4, shadcn/Radix Button, Lucide, pnpm 11.12 and one lockfile. Clerk validates identity; Neon/Drizzle repositories enforce project membership in SQL. There are 20 tables and four migrations. Vitest/PGlite and Playwright cover real SQL, scene rendering, image export and recording; the previous handoff records 306 tests and 24 browser cases. Git is clean at `e128ebc`.

Implemented: authorized project creation/editing, bounded R2 previews, shared saved A-Frame layouts with optimistic concurrency, Gemini text assistant, Sarvam speech, microphone consent, local image adjustments/PNG export, a responsive frosted dashboard and an isolated mono recording lab. Providers have executable server adapters but no live-account verification in this environment. Creative image/video/3D generation, uploads and job orchestration are not connected.

The existing `workspaces` model is personal tenancy with explicit project membership, not complete Clerk Organizations support. Existing briefs/assets/content versions/review records and processing-job lifecycle should be reused. Approval decisions currently need append-only protection. Cookie mutations require a trusted Origin. Existing spatial rotations use Euler XYZ degrees; the new canonical contract must use an explicit conversion rather than relabeling stored data.

No new reference image is attached to this turn. The approved frosted lavender composition, current illustrative campaign asset and the supplied semantic palette are the visual basis. Local tooling includes Xcode 26.0.1, Swift 6.2 and visionOS 26 SDK/simulator runtime; this is inventory, not native application or device validation.

## 2. Proposed architecture and rationale

Keep the web application at the repository root. Moving it to `apps/web` now would churn stable imports, CI, deployment configuration and tests without enabling a requested feature. Add language-neutral contract artifacts under `packages/api-contract`, semantic token source/outputs under `packages/design-tokens`, and a native integration roadmap under `apps/visionos`. Native source and Xcode project creation belong to Phase 6; Swift is not managed by pnpm.

Reuse existing server authorization/storage boundaries. Add `/api/v1` transport DTOs over the existing project/asset repositories. Add a project-and-user-scoped creative prompt draft table with explicit save and compare-and-swap revisions; drafts are not generation jobs. Protect existing approval decisions against UPDATE/DELETE. Do not duplicate Organization/Asset/Approval tables or create pretend queued jobs.

Author strict Zod transport schemas, emit a published OpenAPI 3.1 contract, then generate TypeScript transport models/client routes and Foundation-only Swift Codable models from that same OpenAPI artifact. Check deterministic regeneration and Swift fixture decoding. Canonical scene fixtures document metres, right-handed Y-up coordinates, quaternion XYZW order and legacy Euler conversion; no new native scene persistence is claimed.

The playground reuses the safe image loader and real export behavior. A per-workspace Zustand store owns local editing/mode state, React Hook Form owns prompt form interaction, and a scoped TanStack Query client reads the public capability catalog and authorized draft APIs. Private prompts/files do not go into localStorage. Only the appearance preference persists locally. Add these three libraries because this phase uses them; defer Motion, React Three Fiber and Drei until a real animation/3D-viewer requirement uses them. Existing A-Frame and recording engines remain isolated and working.

Use one semantic token source for generated CSS and Swift constants. Light appearance is primary; dark/system appearance is adaptive. Native UI will use SwiftUI system materials, not CSS blur imitation. Web shell rebrands to Shape Studio while preserving old URLs and repository history.

Alternatives considered: wholesale monorepo relocation and renderer replacement create unnecessary migration risk; a purely static playground would not establish shared contracts or durable project state. The additive approach above preserves functioning software and gives the next phase tested interfaces.

## 3. Gap analysis

| Area | This pass | Later work |
| --- | --- | --- |
| API | Versioned projects/assets/capability/draft routes, safe DTOs, published contract | Generation, reviews/deliverables and native token policy |
| Data | Creative drafts, immutable review-decision history, existing tenancy retained | Organizations mapping, generation inputs/outputs, clients/brand kits/moodboards |
| Storage/providers | Reuse bounded R2 reads and established adapter interfaces; explicit unavailable generation catalog | Verified upload/finalize/write/signing and model-specific jobs |
| Web | Four-mode prompt workspace, local image tools, preview controls, real local variants, theme/responsive/a11y | Executable generation, server history, sharing/review/moodboard mutations |
| Native | Generated Codable/token artifacts and documented auth/asset strategy | Native Xcode app, auth, RealityKit volumes/immersive scenes and device testing |

## 4. Implementation milestones

- [x] Phase 0: inspect repository and document audit, architecture, gaps, files, risks and tests before broad implementation.
- [x] Phase 1A: shared strict contracts, versioned authorized routes, capability catalog and persisted creative drafts; add SQL migration/tests for draft isolation/CAS and immutable decisions.
- [x] Phase 1B: OpenAPI/TypeScript/Swift generation and shared semantic light/dark tokens; verify generated artifacts and coordinate fixtures.
- [x] Initial Phase 2: Shape Studio shell and three-column playground. Image/Video/Audio/3D preserve separate prompts. Generate is disabled with a precise reason while no end-to-end generation provider is implemented. Unsupported settings are absent or explicitly unavailable. Existing real image adjustment/export remains usable.
- [x] Validation: lint/types/full SQL+unit suite, contract drift, Swift checks, production build, desktop/mobile/dark/keyboard browser flows, real export pixels and existing XR/recording regressions; independent review and local Conventional Commits.

Phase 3 implements one verified generation provider with durable jobs, private output storage, history and retry/cancellation. Phase 4 adds the infinite canvas/conversation flow. Phase 5 adds client collaboration/approval/delivery. Phase 6 creates the native application and validates Clerk auth. Phase 7 implements RealityKit volumes/immersive scenes. Phase 8 profiles devices and completes accessibility/production acceptance.

## 5. File-level plan

| Files | Responsibility |
| --- | --- |
| `src/lib/contracts/shape.ts` | Safe v1 DTOs, creative drafts/capability schemas and published schema registry |
| `src/app/api/v1/**`, `src/server/db/creative-drafts.ts`, `project-assets.ts` | Authorized project/asset façade, bounded draft reads/writes, no credential/key leakage |
| `src/server/providers/creative-capabilities.ts` | Four-mode truthful availability; existing text/speech does not imply creative generation |
| `src/server/db/schema.ts`, `drizzle/0004_*` | One additive creative-draft table and immutable decision trigger |
| `packages/api-contract/**`, `scripts/generate-contracts.*` | OpenAPI publication, generated TS/Swift artifacts, conformance/roundtrip fixtures |
| `packages/design-tokens/**`, `scripts/generate-tokens.*` | Semantic source, generated CSS and Swift constants |
| `src/features/playground/**` | Composable prompt/preview/editor/history/state modules and deterministic image operations |
| `src/features/workspace/ImageCanvas.tsx` | Compatibility wrapper for existing public/private editor routes |
| `StudioShell.tsx`, scoped styles, `src/app/studio/create/page.tsx` | Branding, accessible rail/top navigation, theme and authorized optional project context |
| `src/lib/contracts/spatial-scene.ts` and fixtures | Explicit canonical quaternion contract/legacy conversion, separate from persisted Euler layouts |
| `context/*.md`, root tracker, `docs/shape-studio/**`, `apps/visionos/README.md` | Required context, decisions, implementation evidence, risks, phase boundaries and native roadmap |

## 6. Risk register

| Risk | Mitigation / evidence gate |
| --- | --- |
| Cross-tenant or native-auth bypass | Reuse SQL membership and trusted-Origin web writes; no unverified bearer shortcut; test tenant/role changes |
| Draft loss/concurrent edits | Per-project/user key, atomic expected revision, conflicts retain dirty client text; explicit discard/reload |
| Misleading generation controls | No adapter/job/store pipeline means Generate stays disabled even if provider keys exist; no synthetic progress/history |
| Provider/API/pricing drift | Verify dated primary docs; model-specific capabilities and account/billing checks required before Phase 3 |
| Decoder allocation/GPU exhaustion | Preserve pre-decode file/pixel/model budgets, resource cleanup and bounded local variants |
| Private browser-state persistence | Files/prompts stay in scoped memory unless explicitly saved to an authorized project; no public auth fixtures |
| Existing app regressions | Preserve legacy APIs/XR/recorder; run full suite and actual encoded media/browser tests |
| Native support overclaim | Swift contract compilation is distinct from simulator UI/device acceptance; no Xcode app claimed this phase |
| glTF/USDZ material differences | Preserve sources; derivative conversion belongs to a later verified pipeline; document supported subsets |
| UI accessibility/appearance | Accessible names even when rail labels hide; focus, keyboard, reduced motion, dark contrast and mobile state tests |

## 7. Testing strategy

Write failing behavioral tests first for contract/draft/CAS/approval and transformation logic. Use the existing PGlite SQL harness with mocked identity/network boundaries, not a production auth bypass. Verify v1 projections exclude storage keys and reject foreign asset references. Test capability catalog cannot become available from key presence alone. Validate canonical rotations and cross-language fixture roundtrips. Generation scripts must support a non-mutating `--check` and fail unsupported schema shapes rather than silently emitting wrong models.

Browser tests cover prompt preservation across modes and responsive panels, explicit draft save/conflict, unavailable generation, real local variants/export, zoom/fit/rotation, theme persistence, accessible collapsed navigation and shortcuts outside editable fields. Keep all prior XR and recording checks. Run production build on an unoccupied port with isolated test output. Inspect screenshots and decoded pixels. Account/provider calls, native auth, simulator UI, Quest/Vision Pro and production deployment remain explicit external acceptance gates.

The user's instruction to plan and then implement Phase 1 plus the initial web studio supplies execution authorization. The architecture choices above are implementation decisions, not claims of a separately approved design or completed later phases.
