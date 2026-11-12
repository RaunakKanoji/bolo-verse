# Architecture context

## Additive foundation

The Next.js App Router web app remains at the repository root. Relocating it to apps/web would add migration risk without changing the deliverable. `packages/api-contract` and `packages/design-tokens` hold language-neutral artifacts; `apps/visionos` contains the native Xcode app and testable Swift package. Swift is not a JavaScript workspace package.

Server Components resolve private project context. Interactive editing is isolated under `src/features/playground`; a scoped Zustand store handles ephemeral editing state, React Hook Form handles prompts, and a per-workspace TanStack Query client handles capability/draft requests. Query data is not a shared module singleton. Prompts and local files are not persisted to browser storage. The only browser preference persisted is appearance.

Keep the existing A-Frame iframe and original recording renderer isolated. Neither React Three Fiber nor a renderer migration is necessary for this phase. Motion, R3F and Drei are deferred until a feature requires them.

## Trust boundaries

Clerk validates identity server-side. Drizzle SQL predicates enforce personal-workspace ownership and explicit project membership. Do not treat the current personal-workspace model as complete Clerk Organizations support. Versioned APIs return transport projections without storage keys, membership grants or creator IDs.

Web mutations require trusted Origin, bounded JSON and strict Zod validation. Creative drafts are project-and-user private, with atomic revision checks and durable write limits. Drafts are not AI jobs. Existing approval decision rows gain append-only UPDATE/DELETE protection. Existing asset access uses an authenticated, bounded R2 proxy; upload/signing/finalization is not implemented by adding a content alias.

`ShapeApiSchemas` and `ShapeApiOperations` publish OpenAPI 3.1. The same document produces TypeScript clients and Swift Codable artifacts; deterministic copies live inside the Swift package. V1 supports explicitly verified native Clerk session bearer tokens in addition to browser cookies. Invalid Authorization never falls back to cookies, and browser Origin requirements remain enforced. See the native architecture for session lifecycle and trust details.

## Spatial boundary

The canonical schema uses right-handed Y-up metres, -Z forward and XYZW unit quaternions. Legacy A-Frame Euler layouts remain independent. Migration 0005 and v1 spatial-scene routes persist canonical project documents with revision CAS and SQL authorization. A separate bounded native-content route serves eligible USDZ; it does not implement conversion/upload. RealityKit viewer transforms account for source geometry centering and fit when mapping to canonical scenes.

## Later domains

Reuse existing projects, memberships, briefs, assets, content versions, processing jobs and review records. Add client/brand/campaign/moodboard/deliverable and generation-specific data with their functional phases, tenant keys, permission tests and migrations. Do not pre-create duplicate tables merely to mirror nouns in the product brief.
