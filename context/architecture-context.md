# Architecture context

## Additive foundation

The [unified architecture](../docs/architecture/system-overview.md) now has real `apps/web`, `apps/spatial-web` and independent `apps/visionos` boundaries. The completed monorepo foundation is preserved; [ADR 0004](../docs/adr/0004-three-application-boundaries.md) supersedes its temporary root Next location through a functional canonical R3F editing slice.

`apps/web` owns the Next App Router portal, sole modular backend, legacy isolated A-Frame and direct Three.js recording lab. It routes `/workspace*` and `/spatial-static*` to `apps/spatial-web` under the same browser origin. Spatial SSR uses authorized no-store API transport; browser API/media requests remain same-origin. Shared API/token directories remain language-neutral artifacts. Swift stays outside the JavaScript workspace graph.

Server Components resolve private project context. Interactive editing is isolated under `apps/web/src/features/playground`; a scoped Zustand store handles ephemeral editing state, React Hook Form handles prompts, and a per-workspace TanStack Query client handles capability/draft requests. Query data is not a shared module singleton. Prompts and local files are not persisted to browser storage. The only browser preference persisted is appearance.

Keep the existing A-Frame iframe and original recording renderer isolated. The custom desktop editor now lives in spatial-web using R3F, with A-Frame retained separately. The earlier Phase 1 introduced no renderer dependencies; this later functional slice introduces R3F. See ADR 0003 for renderer boundaries.

## Trust boundaries

Clerk validates identity server-side. Drizzle SQL predicates enforce personal-workspace ownership and explicit project membership. Do not treat the current personal-workspace model as complete Clerk Organizations support. Versioned APIs return transport projections without storage keys, membership grants or creator IDs.

Web mutations require trusted Origin, bounded JSON and strict Zod validation. Creative drafts are project-and-user private, with atomic revision checks and durable write limits. Drafts are not AI jobs. Existing approval decision rows gain append-only UPDATE/DELETE protection. Existing asset access uses an authenticated, bounded R2 proxy; upload/signing/finalization is not implemented by adding a content alias.

`ShapeApiSchemas` and `ShapeApiOperations` publish OpenAPI 3.1. The same document produces TypeScript clients and Swift Codable artifacts; deterministic copies live inside the Swift package. V1 supports explicitly verified native Clerk session bearer tokens in addition to browser cookies. Invalid Authorization never falls back to cookies, and browser Origin requirements remain enforced. See the native architecture for session lifecycle and trust details.

## Spatial boundary

The canonical schema uses right-handed Y-up metres, -Z forward and XYZW unit quaternions. Legacy A-Frame Euler layouts remain independent. Migration 0005 and v1 spatial-scene routes persist canonical project documents with revision CAS and SQL authorization. A separate bounded native-content route serves eligible USDZ; it does not implement conversion/upload. RealityKit viewer transforms account for source geometry centering and fit when mapping to canonical scenes.

## Later domains

Reuse existing projects, memberships, briefs, assets, content versions, processing jobs and review records. Add client/brand/campaign/moodboard/deliverable and generation-specific data with their functional phases, tenant keys, permission tests and migrations. Do not pre-create duplicate tables merely to mirror nouns in the product brief.
