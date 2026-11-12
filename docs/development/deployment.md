# Deployment boundaries

Phase 1 changes local repository structure/tooling only. No deployment, database migration, remote push or provider account configuration was performed.

The current Vercel project root remains the repository root. Use the pinned pnpm install and `pnpm build` Next build command. Run `pnpm check` in CI before deployment. The native Xcode application is a separate distribution artifact and does not deploy to Vercel. A future `apps/web` move requires an explicit project-root/environment/test migration; do not change hosting settings just because the target architecture shows that directory.

Configure secrets through the hosting environment, never client bundles or committed files. Runtime configuration is validated by `src/server/config/env.ts`; `pnpm env:check` prints failing field names without raw values. Set exact trusted application origins. `APP_MODE=demo` is rejected when any Vercel deployment marker identifies a hosted environment.

Review/apply the checked-in Drizzle migrations against the intended Neon database before serving dependent routes. Keep migration credentials separate when needed. R2 assets remain private and are delivered through bounded authorized proxies with access rechecks; upload/finalization and conversion are not implemented by the new workspace setup.

Clerk hosted native authentication requires the correct native registration, bundle identifier and signing configuration. Native release validation must include the intended Clerk SDK/toolchain, real account sign-in/out, private asset retrieval and physical Vision Pro interactions. The current compatible SDK pin and simulator evidence are documented in [native validation](../shape-studio/native-validation.md).

GitHub Actions classifies changed paths and schedules web/native jobs independently. A web-only source change does not require Xcode; changes to native files, canonical scene contracts, generated Swift/tokens or CI classification run native checks. Missing/invalid comparison bases run checks conservatively. Remote CI execution remains distinct from local successful checks.

No Turbo remote cache is configured. Root builds and secret-dependent checks are uncached; only deterministic package lint/typecheck results are eligible for local caching. Do not cache `.env`, credentials, local native configuration or user media. Presence, media jobs and AI orchestration remain inside the modular-backend plan until a dedicated runtime is justified.
