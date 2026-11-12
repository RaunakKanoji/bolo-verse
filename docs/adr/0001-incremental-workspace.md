# ADR 0001: Incremental workspace around the existing applications

Status: Accepted for unified Phase 1, 12 November 2026. The temporary root-app location is superseded by [ADR 0004](0004-three-application-boundaries.md) in the subsequent functional R3F migration; the completed foundation remains valid.

The repository already contains working Next, A-Frame and native SwiftUI applications. Moving the root web application immediately would change environment discovery, migrations, browser fixtures, asset preparation, code generation and Vercel root configuration without delivering a new functional slice.

We retain the root Next app temporarily and introduce real consumed packages for strict TypeScript settings, shared lint configuration and the pure canonical scene schema. Register root scripts in Turborepo; `pnpm check` executes the graph while existing `pnpm dev/build/test/db:*` remain valid. `apps/web` and the dedicated R3F client are the target structure once their own migration/slice is implemented.

Rejected alternatives: a wholesale filesystem move before the R3F slice; empty packages for every future domain; an `apps/web` manifest merely forwarding to root scripts. These increase indirection or migration scope without establishing useful boundaries. [Turbo root-task guidance](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks#registering-root-tasks) supports incremental root tasks; [pnpm workspaces](https://pnpm.io/workspaces) require explicit package membership.

Pin Turbo 2.11.11, verified against registry metadata. pnpm generated exact release-age exceptions for that release and its platform binaries; no broad package/version exception was added. Preserve the existing A-Frame Git pin/override and build allowlist. Internal dependencies use `workspace:*` to prevent registry fallback.

Cache only deterministic package lint/typecheck tasks initially. Root build, environment, tests and drift checks are uncached. Set `.turbo/cache` explicitly for worktree isolation. Preserve strict environment mode and pass the declared server settings, including Vercel deployment markers; no database mutation or native compiler task belongs to the web build graph. Native CI runs independently when native/shared-contract changes require it.

Consequences: one transitional root application remains, documented rather than disguised. Source-only scene-schema exports are explicitly transpiled by Next; Node tooling uses the existing tsx loader. Generated Swift/token artifacts are not turned into JS packages. Future extraction must preserve API/scene compatibility and repeat deployment/path-sensitive checks.

Validation found simultaneous lint/typecheck plus unbounded SQL-suite startup could time out PostgreSQL initialization on the local machine. Static gates now precede tests, Vitest uses at most four workers (or the available CPU count), and production build runs last. Test assertions/timeouts are unchanged; the bounded standalone suite passed all 425 tests.
