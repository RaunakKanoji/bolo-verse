# Local development

Use Node.js 24+, pnpm 11.12.0 and the repository root as the working directory.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm env:check
pnpm dev
```

`pnpm dev` starts web on port 3000 and spatial-web on 3001 under one gateway. Open `http://127.0.0.1:3000/workspace` for the dashboard, `/projects` for project management, `/brainstorm` for the persistent idea studio, `/create` for production tools, `/review` for approvals and `/spatial-studio` for the canonical desktop 3D entry. `/workspace/PROJECT_UUID` remains the actual R3F editor, `/studio/create` the image canvas and `/xr/preview` the labeled browser spatial sample. Screen layouts remain accessible with contextual service notices when providers are absent. Missing provider/auth configuration remains unavailable; an environment validation success does not establish a live integration. Use the exact local browser origin in `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS`. Demo mode is local-only and cannot bypass Clerk or project authorization.

`pnpm check` uses Turborepo to run package lint/typecheck, root lint/types/unit+SQL tests, formatting, environment validation, generated contract/token/native-copy drift and finally both Next production builds. It does not build Swift or mutate a database. `pnpm workspace:graph` prints the task graph. Existing individual commands remain available.

```sh
pnpm test:e2e
pnpm contracts:test:swift
pnpm native:test
```

Browser tests start a local server unless `PLAYWRIGHT_BASE_URL` identifies an existing server. Test account/provider responses are isolated fixtures; they are not production integrations. Swift checks need the supported Apple toolchain. See [native setup](../../apps/visionos/README.md) to open the existing Xcode project; ordinary native builds require neither pnpm nor Turbo.

To edit shared scene contracts use `packages/scene-schema/src/index.ts`; `apps/web/src/lib/contracts/spatial-scene.ts` is a compatibility re-export. Keep v1 wire behavior stable. Regenerate contracts/tokens from their sources and run `pnpm native:sync` after generated Swift changes. `docs/api/openapi.yaml` is a generated YAML-compatible JSON mirror of the same OpenAPI document.

Database operations are explicit: configure `DATABASE_URL`/`DATABASE_MIGRATION_URL`, review migrations `0000–0010`, then run `pnpm db:migrate` against the intended database. The development seed requires `pnpm db:seed user_<existing-Clerk-subject>` and configured Clerk credentials; it labels its fictional project and creates no approvals or generated outputs. Nothing seeds production on startup.

Local `.env*`, native `Local.xcconfig`, build outputs, caches and private media stay ignored. R3F is pinned to a stable React 19-compatible release. Root tests/harnesses keep explicit development dependencies. pnpm global virtual storage is disabled explicitly so environment-dependent defaults cannot change the workspace installation topology.

## Running the application boundaries

Root commands keep `.env.local` at the repository root. The web Next wrapper loads it before Next initializes environment discovery, including direct filtered builds. The combined launcher starts both servers and supplies internal origins matching their bind addresses/ports; it removes provider/database/storage/Clerk server secrets from the spatial child environment. Each deployed app receives its own environment configuration.

```sh
pnpm dev --hostname 127.0.0.1 --port 3200
pnpm build
pnpm start --hostname 127.0.0.1 --port 3200
```

The default spatial port is public port + 1; `SPATIAL_PORT` selects a different local port. `/workspace/*` and `/spatial-static/*` forwarding (exact `/workspace` remains web-owned) reads the upstream at request time, so custom production startup ports work after a default build. Configure `NEXT_PUBLIC_APP_URL` and trusted origins for the actual browser hostname/port. Direct `pnpm --filter @shape/web dev` or `start` runs only web; start spatial separately and set `SPATIAL_WEB_ORIGIN` when using that mode.

After moving an existing checkout to the application directories, stop any Next dev process that was already serving the old repository root, then restart with `pnpm dev`. A running process does not change its application directory when source files move. Running bare `next dev` at the repository root also uses the wrong directory; use the root pnpm launcher or the filtered app command above. An obsolete root process can return `PageNotFoundError` for `/_not-found/page` with an empty root `.next/dev/server/app-paths-manifest.json` even though the app-local production build succeeds.

The launcher signals its direct Next CLI children on shutdown; each CLI owns and stops its dev worker. It does not detach them or send process-group signals, which can be denied by managed shells and leave stale app locks.

If another service owns port 3000, leave it running and select a free pair, for example `pnpm dev --hostname 127.0.0.1 --port 3001` (web 3001, spatial 3002). Open the public web port, which also routes `/workspace`; do not open the internal spatial server as the main portal. Keep the configured application/trusted origin aligned with that public port.

Each app has its own Next build output and type generation. `pnpm --filter @shape/web build` builds the portal/backend; `pnpm --filter @shape/spatial-web build` builds the spatial client. Only the web application owns migrations and private provider access. The canonical editor consumes authenticated v1 APIs and does not connect to the database.
