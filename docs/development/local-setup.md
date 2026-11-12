# Local development

Use Node.js 24+, pnpm 11.12.0 and the repository root as the working directory.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm env:check
pnpm dev
```

Open `/studio/create` for the web playground and `/xr/preview` for the labelled browser spatial sample. Missing provider/auth configuration remains unavailable; an environment validation success does not establish a live integration. Use the exact local browser origin in `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS`. Demo mode is local-only and cannot bypass Clerk or project authorization.

`pnpm check` uses Turborepo to run package lint/typecheck, root lint/types/unit+SQL tests, formatting, environment validation, generated contract/token/native-copy drift and finally the Next production build. It does not build Swift or mutate a database. `pnpm workspace:graph` prints the task graph. Existing individual commands remain available.

```sh
pnpm test:e2e
pnpm contracts:test:swift
pnpm native:test
```

Browser tests start a local server unless `PLAYWRIGHT_BASE_URL` identifies an existing server. Test account/provider responses are isolated fixtures; they are not production integrations. Swift checks need the supported Apple toolchain. See [native setup](../../apps/visionos/README.md) to open the existing Xcode project; ordinary native builds require neither pnpm nor Turbo.

To edit shared scene contracts use `packages/scene-schema/src/index.ts`; `src/lib/contracts/spatial-scene.ts` is a compatibility re-export. Keep v1 wire behavior stable. Regenerate contracts/tokens from their sources and run `pnpm native:sync` after generated Swift changes. `docs/api/openapi.yaml` is a generated YAML-compatible JSON mirror of the same OpenAPI document.

Database operations are explicit: configure `DATABASE_URL`/`DATABASE_MIGRATION_URL`, review migrations `0000–0005`, then run `pnpm db:migrate` against the intended database. The development seed requires `pnpm db:seed user_<existing-Clerk-subject>` and configured Clerk credentials; it labels its fictional project and creates no approvals or generated outputs. Nothing seeds production on startup.

Local `.env*`, native `Local.xcconfig`, build outputs, caches and private media stay ignored. The only additional external dependency in this phase is pinned Turbo; internal packages consume the existing Zod/TypeScript/ESLint versions.
