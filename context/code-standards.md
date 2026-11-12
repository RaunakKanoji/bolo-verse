# Code standards

- Strict TypeScript, bounded Zod inputs, explicit transport types, server-only secrets and database code.
- Shared runtime contracts belong to consumed workspace packages with explicit exports and `workspace:*` dependencies. Keep renderer/framework types out of scene-schema; use shared strict TypeScript and lint configuration. Neutral generated Swift artifacts are not JS packages.
- Small components and focused modules. Use Server Components unless browser interaction requires a client boundary.
- No fabricated generation, upload, approval or provider progress. Configuration is distinct from integration and live verification.
- Preserve source media. Bound decoded image/model dimensions, memory and local history; cancel requests and release URLs, streams and renderer resources.
- Keep schema changes additive and reviewable. Test tenant isolation, role changes, revision conflicts and immutable records with real PostgreSQL semantics.
- Maintain generated contracts/tokens from their source; run generation and drift checks. Swift artifacts compile independently of the web application.
- Conventional Commits, no credentials/private media/build artifacts. Record implementation, local test evidence and external acceptance separately.
- Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm tokens:check`, `pnpm contracts:check`, `pnpm contracts:test:swift` (Swift installed), `pnpm test`, `pnpm build` and relevant Playwright flows.
- `pnpm check` orchestrates JavaScript checks/build; Swift fixtures/builds run separately when native or shared-contract changes warrant them. Preserve uncached drift/environment/build checks and the strict Turbo deployment-environment boundary.
