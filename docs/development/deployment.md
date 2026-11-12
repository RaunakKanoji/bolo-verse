# Deployment boundaries

This restructuring changes local application/build boundaries. No remote deployment, database migration, push or provider account configuration is performed.

Deploy `apps/web` and `apps/spatial-web` as independent Next applications from the same pnpm workspace. Set each hosting project's root explicitly, install from the workspace lockfile, and include shared packages/artifacts outside the application directory. Build web with its package build script (which prepares A-Frame and loads the established root environment for local builds); build spatial with its package build script. Run `pnpm check` from the repository root in CI first. The independent Xcode application does not deploy with either browser app.

Web is the public browser origin and sole backend. Set `SPATIAL_WEB_ORIGIN` to an exact reachable HTTP(S) spatial deployment origin; its request-time Proxy forwards only `/workspace*` and `/spatial-static*`. Set spatial's server-only `WEB_INTERNAL_ORIGIN` to the web API origin. Both upstreams must be reachable under the hosting protection policy. Do not send identity headers, place session tokens in URLs or disable authorization to pass deployment protection. Test the actual hosted cookie/Clerk, Origin, asset, CSP and frame behavior before accepting a live deployment.

Browser APIs and private media remain relative to the public web origin. Spatial SSR forwards only session Cookie/Authorization to the fixed web origin with no-store requests and redirect rejection. The backend independently validates identity and project access. Use ordinary anchors between apps and unique spatial Next asset prefixes. A native build does not prove WebXR browser support.

Configure secrets through the hosting environment, never client bundles or committed files. Runtime configuration is validated by `apps/web/src/server/config/env.ts`; `pnpm env:check` prints failing field names without raw values. Set exact trusted application origins. `APP_MODE=demo` is rejected when any Vercel deployment marker identifies a hosted environment.

Review/apply the checked-in Drizzle migrations against the intended Neon database before serving dependent routes. Keep migration credentials separate when needed. R2 assets remain private and are delivered through bounded authorized proxies with access rechecks; upload/finalization and conversion are not implemented by the new workspace setup.

Clerk hosted native authentication requires the correct native registration, bundle identifier and signing configuration. Native release validation must include the intended Clerk SDK/toolchain, real account sign-in/out, private asset retrieval and physical Vision Pro interactions. The current compatible SDK pin and simulator evidence are documented in [native validation](../shape-studio/native-validation.md).

GitHub Actions classifies changed paths and schedules web/native jobs independently. A web-only source change does not require Xcode; changes to native files, canonical scene contracts, generated Swift/tokens or CI classification run native checks. Missing/invalid comparison bases run checks conservatively. Remote CI execution remains distinct from local successful checks.

No Turbo remote cache is configured. Root builds and secret-dependent checks are uncached; only deterministic package lint/typecheck results are eligible for local caching. Do not cache `.env`, credentials, local native configuration or user media. Presence, media jobs and AI orchestration remain inside the modular-backend plan until a dedicated runtime is justified.

## Rollback

This milestone does not change database schema or scene formats. Roll back the coherent web relocation, spatial application, gateway and root tooling changes together using their reviewed commit/release boundary. Keep the previous web deployment available until the new gateway/asset/auth checks pass. Preserve unrelated native changes and private scene data; do not reset the working tree or run destructive database operations. Existing XR/recording/API URLs remain the compatibility surface.
