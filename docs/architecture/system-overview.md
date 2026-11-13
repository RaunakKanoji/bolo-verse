# Unified spatial creator platform

This document is the current architecture entry point. The [master prompt](../product/UNIFIED_PLATFORM_SPEC.md) describes the full product; the [Phase 0 audit and Phase 1 plan](../superpowers/plans/2026-11-12-unified-monorepo-foundation.md) scopes this increment. The product remains Shape Studio. The subsequent [cross-platform master](../product/CROSS_PLATFORM_IMPLEMENTATION_SPEC.md), [audit](../development/cross-platform-audit.md) and [initial creative plan](../superpowers/plans/2026-11-12-cross-platform-creative-foundation.md) extend this established foundation. See [current creative delivery](../development/creative-foundation-status.md) for image uploads/jobs/cleanup and verification.

The current creator-workspace increment is described by its [audit](../development/creator-platform-audit.md), [plan](../superpowers/plans/2026-11-13-creator-platform.md) and [delivery report](../development/creator-platform-status.md). It adds conventional creator screens and authorized workspace persistence while preserving all three platform boundaries. Services remain unconfigured and are not live-verified.

## Current application and package graph

One Next.js modular backend serves the conventional web UI, isolated A-Frame browser workspace and native SwiftUI/RealityKit app. Project identity, assets and permissions live on the server. Native canonical scenes and legacy A-Frame layouts currently use different representations; this foundation does not claim their complete synchronization.

```mermaid
flowchart LR
  Web[apps/web Next gateway and backend] --> Scene["@shape/scene-schema"]
  Web --> TS["@shape/typescript-config"]
  Web --> Lint["@shape/eslint-config"]
  Scene --> TS
  Scene --> Lint
  Web --> API[Authorized v1 API]
  Spatial[apps/spatial-web R3F desktop editor] --> API
  Spatial --> Scene
  Native[apps/visionos SwiftUI / RealityKit] --> API
  API --> DB[Neon / Drizzle repositories]
  API --> Storage[Bounded private R2 proxies]
  Registry[Strict shared contracts] --> OpenAPI[Generated OpenAPI and TS/Swift]
  Scene --> Registry
  OpenAPI --> Native
  Tokens[Semantic token artifacts] --> Web
  Tokens --> Native
```

The three JavaScript packages have actual consumers and explicit `workspace:*` dependencies. `packages/api-contract` and `packages/design-tokens` remain language-neutral artifact directories, without JavaScript manifests. Swift stays inside its native package/app or neutral codegen artifacts, never a TypeScript workspace package.

## Directory evolution

The web application and authoritative modular backend live in `apps/web`. The independently built Next application in `apps/spatial-web` provides the canonical desktop editor. The existing Xcode app remains in `apps/visionos`, independent of pnpm. Shared tooling and scene schemas remain consumed workspace packages; API/token outputs remain language-neutral artifacts.

The web application is the same-origin gateway. Exact `/workspace` is the web dashboard; `/workspace/:projectId` and `/workspace/demo` route to spatial-web. `/spatial-studio` is the web-owned entry; `/spatial-static/*` serves that app's collision-free Next assets. All existing `/api/*`, `/app/*`, `/studio/*`, `/xr/*`, public media and A-Frame vendor routes remain web-owned. Cross-application links perform full navigation. Spatial SSR forwards session transport to a configured web API origin with no-store fetches; API authorization remains authoritative. Browser writes and asset fetches stay relative to the public gateway origin.

Root `dev/start` starts and tears down both browser servers, `build` builds both, and `check` runs the shared validation graph. See [ADR 0004](../adr/0004-three-application-boundaries.md) and [setup/deployment](../development/local-setup.md). No empty domain packages or independent duplicate backend are introduced.

## Domain and interface boundaries

- [Domain model](domain-model.md): actual 31 tables, repositories and planned domains.
- [Authentication](authentication.md): Clerk cookie/native bearer identity and project authorization.
- [Scene format](scene-format.md): strict canonical v1, legacy layouts and future version migration.
- [Voice commands](voice-commands.md): existing deterministic proposals and the future shared command registry.
- [Realtime](realtime.md): current optimistic concurrency and planned presence/synchronization.
- [Web](../platforms/web.md), [browser XR](../platforms/browser-xr.md), [visionOS](../platforms/visionos.md): real platform responsibilities and limits.

Route handlers validate HTTP boundaries and delegate to repositories/application services. New domains should follow these boundaries rather than introducing duplicate backends or premature microservices. Provider/storage/auth keys remain server-only. No deployed database, provider account or hosting configuration was changed by Phase 1.
