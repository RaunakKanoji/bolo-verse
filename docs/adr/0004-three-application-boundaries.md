# ADR 0004: Three application boundaries with one backend

Status: implemented in the subsequent restructuring milestone, 12 November 2026; see its verification report for acceptance evidence.

## Decision

Move the existing root Next application to `apps/web` while delivering a functional canonical desktop editor in `apps/spatial-web`. Keep `apps/visionos` as an independent native Xcode app. This supersedes only ADR 0001's temporary root-app location. Reuse the existing backend, strict v1 contracts, SQL authorization and private media endpoints.

Web owns existing public, `/app/*`, `/studio/*`, `/xr/*`, `/api/*`, `/_next/*` and vendor paths. Only `/workspace`, `/workspace/*` and `/spatial-static/*` are forwarded by request-time Proxy to spatial-web. Spatial uses a unique Next asset prefix. Cross-zone links use full navigation, releasing the active renderer. Existing A-Frame and mono recording remain isolated in web.

Both browser apps are served under one public origin. `SPATIAL_WEB_ORIGIN` is web's fixed server-only upstream; `WEB_INTERNAL_ORIGIN` is spatial SSR's fixed web API upstream. Session cookies/Authorization are forwarded only to that upstream; caller Host/forwarding/identity headers never select a destination or grant access. Private bootstrap fetches are uncached and the API independently validates identity and SQL project access. Browser writes retain their original Origin and same-origin asset transport. Spatial needs no database/provider/storage/Clerk server keys.

Root `.env.local` remains the local web configuration source. A web-command wrapper loads root environment before Next initializes its app-dir cache. The launcher provides local internal origins and starts/stops both browser servers. Native builds use checked-in generated Swift and remain independent of pnpm. Root tests keep their repository CWD for SQL fixtures. Codegen, environment diagnostics, asset preparation, CI classification and aliases follow relocated sources.

## Alternatives

Keeping the root app indefinitely would not establish the requested ownership boundary. Splitting browser origins would require new Clerk/CORS/CSP/permission transport and offers no benefit for this milestone. A separate backend deployment or domain package per noun adds infrastructure without a second backend consumer. These remain optional future decisions, rather than prerequisite scaffolding.

## Compatibility and limits

The schema package remains pure. Canonical v1, A-Frame Euler layouts and recorder state remain distinct; no migration or synchronization is implied. The R3F slice uses existing revision APIs and supported assets. New organizations, uploads/conversion, realtime, R3F immersive sessions and unified/native voice are later slices. No production migration, hosting update or device validation is performed by this local restructuring.

Review found that Next configuration rewrites bake upstream ports during build. Request-time Proxy routing avoids that mismatch when root `start --port` selects another port. Exact path-prefix and origin validation are covered by behavioral tests. Next's HTML-link lint settings are scoped to each application so full cross-zone navigations remain valid.
