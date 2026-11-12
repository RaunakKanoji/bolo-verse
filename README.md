# BoloVerse · XR Creator Studio

A browser creative workspace built with Next.js, A-Frame/WebXR, Clerk and Neon/Drizzle. The current scope is **Phase 1 — foundation** from [the XR specification](docs/XR_IMPLEMENTATION_SPEC.md): project creation/editing and a real desktop 3D scene with capability-gated VR controls. Scene editing/persistence and AI tools belong to later phases.

The original local recording experiment remains available at `/studio/feasibility`. It captures a real portrait canvas and microphone stream for local playback/download; it does not upload media.

## Run locally

Use Node.js 24 or newer and **pnpm 11.12.0**, pinned in `package.json`.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000/xr/preview`. This public scene uses original sample content, needs no provider credentials and saves nothing. Drag to look, focus the canvas and use W/A/S/D to move, or inspect panels with the companion buttons. Unsupported browsers retain the desktop view and explain why **Enter VR** is unavailable. A real headset session requires a compatible browser, secure context and explicit user action.

The development/build commands copy the pinned A-Frame bundle and its license into ignored `public/vendor/aframe/`. The XR iframe loads this local bundle; it does not fetch fonts, controller models or scripts from a CDN. A-Frame owns its Three runtime; the separate recording lab retains its original Three dependency.

```sh
pnpm build
pnpm start
```

## Connect private projects

1. Configure a Clerk application and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`. Configure allowed development/preview domains and sign in with a real account.
2. Set a Neon development `DATABASE_URL`; optionally set `DATABASE_MIGRATION_URL` for a direct migration connection. These values remain server-only.
3. Review all three `drizzle/*.sql` migrations, then run `pnpm db:migrate` against the development database.
4. Set `NEXT_PUBLIC_APP_URL` to the exact browser origin. `ALLOWED_ORIGINS` may contain a comma-separated list of additional trusted origins. `localhost` and `127.0.0.1` are different origins.
5. Visit `/app/projects`, create a named project with an objective, open it and select **Open XR studio**. Project details persist in PostgreSQL; Phase 1 scene changes do not. Owners, creators and editors can update details; assigned clients have read-only access.

Project creation uses the signed-in user's personal workspace and atomically creates the project and creator membership. It is limited to ten successful creations per user per hour. Reads and mutations enforce server-side membership checks. Missing credentials show a setup screen; private endpoints never substitute public sample data. Live Clerk/Neon operation remains unverified until configured and exercised.

Optional fictional seed instructions and physical-device steps are in [the runbook](docs/DEMO_RUNBOOK.md).

## Checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Prettier currently covers new XR/project UI modules; `pnpm format` formats those directories. ESLint and TypeScript cover the application. Integration tests execute real PostgreSQL SQL through PGlite with the Clerk network boundary mocked. Browser tests exercise the real A-Frame canvas and real recording with synthetic microphone input. Neither establishes live authentication, headset compatibility or physical microphone quality. E2E expects missing provider credentials; run it without Clerk/Neon secrets in `.env.local`.

The GitHub Actions workflow runs these checks and Chromium E2E on pushes/PRs. Database commands are `pnpm db:generate`, `pnpm db:migrate` and `pnpm db:seed`.

## Devices and deployment

Use an **HTTPS** preview on a phone or standalone headset; a computer's HTTP LAN address is not equivalent to localhost. Headset entry/exit, controller rays, seated/standing comfort and performance require physical-device verification. No cloud deployment or provider resource is created by this repository.

The manifest provides installation hints. There is no service worker or offline cache of private responses/audio. Download local recordings before leaving the lab; they do not survive reload/navigation.

## Documentation

- [Progress tracker](progress-tracker.md) and [current implementation evidence](docs/IMPLEMENTATION_STATUS.md)
- [XR specification](docs/XR_IMPLEMENTATION_SPEC.md) and [Phase 1 plan](docs/superpowers/plans/2026-11-12-xr-phase1.md)
- [Architecture decisions](docs/DECISIONS.md) and [integration inventory](docs/INTEGRATIONS.md)
- [Device runbook](docs/DEMO_RUNBOOK.md) and [historical M0 evidence](docs/M0_IMPLEMENTATION_STATUS.md)

Phase 2 adds spatial editing and saved scenes. Continue one phase at a time.
