# Shape Studio · Creative Workspace

An incremental web and native spatial foundation for creative production. The initial [audit and plan](docs/shape-studio/phase-0-plan.md) established shared contracts, private drafts, tokens and the four-mode web playground. The [native app](apps/visionos/README.md) now adds SwiftUI windows, RealityKit volumes, authorized services and scene persistence. Existing browser XR, text/speech adapters and recording tools remain available. Functional media generation and full collaboration remain later phases.

The current [unified platform architecture](docs/architecture/system-overview.md) establishes a pnpm/Turborepo workspace around the existing applications. Shared scene schemas, strict TypeScript settings and lint configuration are real consumed packages. The Next portal/backend now lives in `apps/web`; `apps/spatial-web` is the separate canonical R3F desktop editor, and `apps/visionos` remains the independent native app. Root commands orchestrate both browser applications. See [local setup](docs/development/local-setup.md) and the [phased plan](docs/superpowers/plans/2026-11-12-unified-monorepo-foundation.md).

## Run locally

Use Node.js 24 or newer and **pnpm 11.12.0**, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm env:check
pnpm dev
```

Open `http://localhost:3000/workspace` for the new 3D editor entry, `/studio/create` for the creative playground or `/xr/preview` for the spatial sample. This public sample requires no provider credentials, uses clearly labeled original sample content and saves nothing. Select panels, move/rotate/scale them with the inspector, drag to look, and use W/A/S/D while the canvas has focus.

If port 3000 is occupied, run `pnpm dev --port 3001` and use that port consistently in the browser and environment configuration. The development/build scripts copy the pinned A-Frame bundle and license to ignored `apps/web/public/vendor/aframe/`; the scene does not depend on a script CDN.

```sh
pnpm build
pnpm start
```

This is a server-rendered application with private API routes, not a static export. The original recording lab remains at `/studio/feasibility`: it captures a portrait canvas and microphone for local playback/download. Download recordings before leaving or reloading; media is not uploaded or persisted by the lab.

The dashboard at `/` and `/studio` uses authorized project data or clearly labeled illustrative studies. `/studio/create` provides local image adjustment, comparison/reset and PNG export; local imports and exported edits are not uploaded or saved to project storage. Private project images open the same canvas after server authorization. The spatial workspace fills the desktop viewport, with independently scrolling project/inspector panels and a visible transform toolbar.

## Connect private projects

1. Configure a real Clerk application and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Configure the corresponding development/preview domains.
2. Set a Neon `DATABASE_URL`. Set `DATABASE_MIGRATION_URL` when a separate direct migration connection is needed; otherwise it falls back to `DATABASE_URL`.
3. Review all **six** SQL migrations (`0000–0005`) in `drizzle/`, then run `pnpm db:migrate`. Migration `0003` adds browser layouts, `0004` adds private drafts and append-only decisions, and `0005` adds canonical native-compatible scenes.
4. Set `NEXT_PUBLIC_APP_URL` to the exact browser origin. `ALLOWED_ORIGINS` can list additional trusted origins separated by commas. `localhost` and `127.0.0.1` are different origins.
5. Sign in, visit `/app/projects`, create a project and open `/studio`. Choose **Open Spatial Studio**, then your project.

`/studio/xr` lists authorized projects and browser capabilities. `/studio/xr/[projectId]` is the canonical workspace; `/xr/[projectId]` remains an alias. Owners, creators and editors can save layouts; assigned clients can inspect them read-only. Saves compare the stored version and return a conflict instead of silently overwriting another edit. Failed saves retain local changes.

The workspace displays actual briefs, artifact versions, ready assets and recorded client feedback. Empty projects stay empty. Missing Clerk/Neon configuration shows a setup state; neither the public preview nor development mocks bypass private authentication or invent project data.

## Optional services

- **Private assets:** configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET`. Existing ready assets load through an authenticated server proxy, with a 20 MiB file limit and a conservative self-contained GLB/glTF subset. The current studio does not add an upload/finalization workflow.
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

The browser suite defaults to `http://127.0.0.1:3000`. To reuse a server on another origin, set, for example, `PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e`. Use the same hostname and port as the running server. Run the missing-configuration browser scenarios without live Clerk/Neon secrets. Formatting currently covers XR/project UI; lint and typecheck cover the application.

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

Open an authorized project and choose **Open Creative Studio** to explicitly save a private prompt draft. `/api/v1` exposes safe project/asset projections and conflict-aware drafts; original API paths remain compatible. Local images and edit variants are not uploaded. Generate is disabled for all four modes until Phase 3 connects durable jobs, provider calls and private output storage.
