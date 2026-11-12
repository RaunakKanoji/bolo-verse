# BoloVerse

A browser-based creative workspace for Indian MSME campaigns. This repository implements **M0: foundation and feasibility** from [the build specification](docs/BUILD_SPEC.md). Later milestones are intentionally not active.

The recording lab captures an actual Three.js portrait canvas and microphone stream, then provides local playback and download. It does not upload the recording or send audio to a provider. The public experiment uses an original procedural textile illustration, not private project data.

## Run locally

Use Node.js 24 or newer and npm (the lockfile is checked in).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`, then **Try local recording**. No provider credentials are needed for the public lab. Read the disclosure, consent, and record a five-second test. Allow the microphone when Chrome asks. Play/download the result before leaving: local takes do not survive reload or navigation.

For a production build:

```sh
npm run build
npm start
```

## Connect private projects

1. Create/configure a Clerk application. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env.local`; configure its allowed development/preview domains. Sign in with a real account. No test-auth bypass exists.
2. Create a Neon development database. Set `DATABASE_URL`; optionally set `DATABASE_MIGRATION_URL` for a direct migration connection. Only the server receives these URLs.
3. Review all three checked-in `drizzle/*.sql` migrations, then run `npm run db:migrate` against that development database. Never point an unreviewed migration at production.
4. Visit `/app/projects`. An authenticated first visit creates a personal workspace and owner membership transactionally. Assigned projects appear there. Read endpoints independently check identity and membership.
5. Optional fictional sample seed instructions are in [the demo runbook](docs/DEMO_RUNBOOK.md). Project creation/editing, assignment UI and client review arrive in later milestones.

An unconfigured private API returns an explicit failure, not sample project data. Clerk/Neon live operation requires real credentials and has not been proven by local tests. See [implementation status](docs/IMPLEMENTATION_STATUS.md).

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover strict contracts, configuration, unavailable provider behavior and recording lifecycle. Integration tests run the SQL migration and authorized repositories against embedded PostgreSQL (PGlite). Playwright tests use a synthetic microphone with real browser recording; this does not measure real microphone quality or Android performance. E2E expects missing provider credentials; run it in a clean local environment without `.env.local` Clerk/Neon secrets.

Database tooling: `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`. Speech fixture evaluation and cached speech generation scripts will be introduced with M2; no fake generation command is provided in M0.

## Phone testing and deployment

Use an **HTTPS** preview for another device. A phone opening your computer's HTTP LAN IP is not equivalent to localhost and usually cannot use the microphone. Deploy this Next.js repository to a chosen Vercel project, set environment variables explicitly, and configure Clerk domains before testing private data. No deployment or cloud resource has been created by this initial local implementation.

For M0, open `/studio/feasibility` in Android Chrome, consent, record, play back and download. Detailed steps and failure recovery are in [the runbook](docs/DEMO_RUNBOOK.md). The manifest provides installation hints; Chrome may offer **Add to home screen**. There is no service worker or offline cache of private responses/audio. Orientation and fullscreen hints do not prove headset readiness.

## Documentation

- [Progress tracker](progress-tracker.md) and [milestone evidence](docs/IMPLEMENTATION_STATUS.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Provider/version/asset inventory](docs/INTEGRATIONS.md)
- [Device runbook](docs/DEMO_RUNBOOK.md)

M1 adds the stereo studio. Proceed only after the user says `next`.
