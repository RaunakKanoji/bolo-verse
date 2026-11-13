# Shape Studio · Creative Workspace

An incremental web and native spatial foundation for creative production. The initial [audit and plan](docs/shape-studio/phase-0-plan.md) established shared contracts, private drafts, tokens and the four-mode web playground. The [native app](apps/visionos/README.md) now adds SwiftUI windows, RealityKit volumes, authorized services and scene persistence. Existing browser XR, text/speech adapters and recording tools remain available. The creator workspace adds project/client/task management, persistent Brainstorm sessions, private assets and versioned review. Configured image generation is available; other media generation and organization collaboration remain later slices.

The current [unified platform architecture](docs/architecture/system-overview.md) establishes a pnpm/Turborepo workspace around the existing applications. Shared scene schemas, strict TypeScript settings and lint configuration are real consumed packages. The Next portal/backend now lives in `apps/web`; `apps/spatial-web` is the separate canonical R3F desktop editor, and `apps/visionos` remains the independent native app. Root commands orchestrate both browser applications. See [local setup](docs/development/local-setup.md) and the [phased plan](docs/superpowers/plans/2026-11-12-unified-monorepo-foundation.md).

## Run locally

Use Node.js 24 or newer and **pnpm 11.12.0**, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm env:check
pnpm dev
```

Open `http://127.0.0.1:3000/workspace` for the dashboard, `/create` for production tools, `/brainstorm` for ideas, `/projects` for project management and `/review` for approvals. Assets, Clients, Analytics, Spatial Studio, Recording Lab, Settings and Profile have distinct sidebar screens. `/spatial-studio` opens the 3D entry, `/workspace/PROJECT_UUID` the authorized R3F editor, `/studio/create` the image canvas and `/xr/preview` the public XR sample. The launcher also starts the internal spatial app on port 3001; use the public portal for navigation and API access. Portal page paths opened on the internal port redirect to the configured portal. Prefer the explicit IPv4 address locally because `localhost` can resolve to an unrelated service listening on IPv6.

Briefs, linked ideas, assets, tasks, publication and revisions are tabs inside `/projects/{projectId}`. Old `/app/projects`, `/studio/brainstorm` and `/reviews` links redirect to the canonical screens. Private persistence needs Clerk/Neon; private files need R2, AI needs Gemini and transcription needs Sarvam. Without services, the screens retain their layouts and show contextual errors or explicitly unsaved drafts. See the [creator platform delivery report](docs/development/creator-platform-status.md) for exact capabilities, tests and limitations.

The public XR sample requires no provider credentials, uses clearly labeled original sample content and saves nothing. Select panels, move/rotate/scale them with the inspector, drag to look, and use W/A/S/D while the canvas has focus.

If port 3000 is occupied, run `pnpm dev --hostname 127.0.0.1 --port 3200` and open `http://127.0.0.1:3200/`; the internal spatial app then uses port 3201. Use the portal port consistently in the browser and environment configuration. The development/build scripts copy the pinned A-Frame bundle and license to ignored `apps/web/public/vendor/aframe/`; the scene does not depend on a script CDN.

```sh
pnpm build
pnpm start
```

This is a server-rendered application with private API routes, not a static export. The original recording lab remains at `/studio/feasibility`: it captures a portrait canvas and microphone for local playback/download. Download recordings before leaving or reloading; media is not uploaded or persisted by the lab.

The dashboard at `/workspace`, `/` and `/studio` uses authorized persisted data or genuine empty states, with no fabricated workload metrics. `/studio/create` provides local image adjustment, comparison/reset and PNG export; local imports and exported edits are not uploaded or saved to project storage. Private project images open the same canvas after server authorization. The spatial workspace fills the desktop viewport, with independently scrolling project/inspector panels and a visible transform toolbar.

## Connect private projects

1. Configure a real Clerk application and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Configure the corresponding development/preview domains.
2. Set a Neon `DATABASE_URL`. Set `DATABASE_MIGRATION_URL` when a separate direct migration connection is needed; otherwise it falls back to `DATABASE_URL`.
3. Review all **twelve** SQL migrations (`0000–0011`) in `drizzle/` and the intended development database before running `pnpm db:migrate`. Migrations `0006–0008` add private image workflows; `0009` adds identity-bound review grants and immutable comments; `0010` adds project metadata, clients, tasks, asset organization and private Brainstorm persistence. Live database migration needs separate authorization.
4. Set `NEXT_PUBLIC_APP_URL` to the exact browser origin. `ALLOWED_ORIGINS` can list additional trusted origins separated by commas. `localhost` and `127.0.0.1` are different origins.
5. Sign in, visit `/projects`, create/open a project, then use its Brief, Brainstorm, Assets, Tasks and Deliverables tabs. Brainstorm and Review are in the shared navigation. Choose **Open 3D editor** for the canonical workspace.

`/workspace/[projectId]` is the canonical R3F editor. `/studio/xr` lists projects for the separate legacy A-Frame workspace at `/studio/xr/[projectId]`; `/xr/[projectId]` remains its alias. Owners, creators and editors can save authorized scenes/layouts; assigned project clients can inspect them read-only. Saves compare the stored revision and return a conflict instead of silently overwriting another edit. Failed saves retain local changes.

The workspace displays actual briefs, artifact versions, ready assets and recorded client feedback. Empty projects stay empty. Missing Clerk/Neon configuration shows contextual service notices inside distinct usable screens; neither the public preview nor development mocks bypass private authentication or invent project data.

## Video Creation

Open `/create/video` or choose **Start Video Creation** from `/create`. The embedded Shotstack SDK supports private project image/video timelines, text overlays, preview and revision-checked saves. Explicit cloud rendering requires server-only `SHOTSTACK_API_KEY`, `SHOTSTACK_ENV=sandbox|production`, `ENABLE_EXTERNAL_EDITOR=true`, Clerk/Neon/private R2 and reviewed migrations through0011. Rendered MP4s are verified/imported as private assets; publishing and approval remain separate. See the [Shotstack delivery report](docs/development/shotstack-video-status.md) for limits, exact APIs and validation evidence.

## Optional services

- **Camera recording:** `/recording-lab` requests camera/microphone only on explicit activation, creates a local downloadable take and can attach it to an authorized project with private R2 configured. The original mono canvas lab remains separate.
- **Private assets:** configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`. Project images supports private image upload/verification and immutable publication, with a 20 MiB limit. Configure the existing upload CORS policy for the exact portal origin. Ready assets load through an authenticated server proxy; model preview retains its conservative self-contained GLB/glTF subset. The centralized library also accepts bounded PDF, self-contained GLB/glTF, WebM/MP4 and PCM WAV uploads; audio is download-only. File headers/hashes are checked; video duration/dimensions are not inferred.
- **Text assistant:** configure `GEMINI_API_KEY` and an explicit `GEMINI_MODEL` supporting structured output. Replies propose bounded actions; reset requires confirmation.
- **Voice:** configure `SARVAM_API_KEY`, `SARVAM_STT_MODEL`, `SARVAM_TTS_MODEL` and the EN/HI/KN speaker settings. Recording starts only after explicit consent and activation; spoken replies require playback interaction.

These are implemented network adapters. Environment readiness does not prove a successful live connection; Clerk, Neon, R2, Gemini and Sarvam still require verification with configured accounts. A labeled deterministic text mock is available during local `pnpm dev` with `APP_MODE=demo` and no Gemini configuration. It is disabled in production and on Vercel, still requires real project authorization, and does not simulate speech. See [AI integration](docs/xr/ai-integration.md).

## Checks and evidence

`pnpm check` runs the complete JavaScript workspace check graph and production build through Turbo. Native compilation and database mutations are separate. `pnpm workspace:graph` shows task dependencies; individual commands remain available:

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm tokens:check
pnpm contracts:check
pnpm contracts:test:swift # requires Swift 6+
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

The browser suite defaults to `http://127.0.0.1:3000`. To reuse a portal started on port 3200, set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 pnpm test:e2e`. Use the same hostname and portal port as the running server. Run the missing-configuration browser scenarios without live Clerk/Neon secrets. Formatting currently covers XR/project UI; lint and typecheck cover the application.

PGlite integration tests execute the actual PostgreSQL queries with the identity boundary mocked. Chromium tests render the real A-Frame canvas; editable-project browser scenarios use an isolated component harness and mocked HTTP responses. Synthetic microphone input and simulated XR sessions do not establish live authentication, provider behavior, headset compatibility or physical microphone quality. Current results are recorded in [Phase 1 verification](docs/development/phase-1-status.md); earlier browser implementation evidence is preserved in [implementation status](docs/IMPLEMENTATION_STATUS.md).

## Guides

- [Architecture](docs/xr/architecture.md) and [workspace schema/API](docs/xr/workspace-schema.md)
- [Interactions](docs/xr/interaction-system.md) and [browser/device support](docs/xr/browser-support.md)
- [AI and speech](docs/xr/ai-integration.md), [testing](docs/xr/testing.md) and [deployment](docs/xr/deployment.md)
- [Progress](progress-tracker.md), [decisions](docs/DECISIONS.md) and [integration inventory](docs/INTEGRATIONS.md)
- [Implementation plan](docs/superpowers/plans/2026-11-12-functional-xr-studio.md) and [device runbook](docs/DEMO_RUNBOOK.md)

Desktop Chromium has browser-test evidence; the native app has separate [simulator evidence](docs/shape-studio/native-validation.md). Physical headset checks and hosted deployment remain outstanding. The web manifest provides installation hints; there is no service worker or offline cache of private responses/audio.

## Shape Studio foundation

- [Project context and current scope](context/project-overview.md), [architecture](context/architecture-context.md), [progress](context/progress-tracker.md), [implementation evidence and limits](docs/shape-studio/implementation-status.md).
- [OpenAPI and generated TypeScript/Swift contracts](packages/api-contract/README.md), [semantic tokens](packages/design-tokens/README.md).
- [Native/provider research](docs/shape-studio/native-provider-research.md) and [visionOS setup](apps/visionos/README.md).

Open an authorized project and choose **Open Creative Studio** to explicitly save a private prompt draft. `/api/v1` exposes safe project/asset projections and conflict-aware drafts; original API paths remain compatible. Local images and edit variants are not uploaded. Configured image generation uses the existing durable job/private-output workflow. Video, audio and model generation remain unavailable; the new creation entry does not activate unconfigured external editors.

### Presentation demo

Open `/demo` for the populated, explicitly synthetic BoloVerse / Shape XR walkthrough without Clerk setup. Seed/validate/archive commands, actual dataset counts, Vercel settings and a six-minute presentation sequence are in [the demo seeding guide](docs/demo-seeding.md). Private application APIs retain authentication; no live provider execution or physical Vision Pro verification is implied.
