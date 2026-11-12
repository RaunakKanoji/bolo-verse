# Shared scene schema

`@shape/scene-schema` owns the existing canonical scene v1 Zod schemas and pure orientation adapters. Its only runtime dependency is Zod; it imports no browser, rendering engine, database, authentication or native framework code.

The application/backend and contract generator consume it through the compatibility export at `src/lib/contracts/spatial-scene.ts`. New TypeScript consumers can import `@shape/scene-schema` directly. The package exports TypeScript source for the repository's bundler/tsx toolchain; no separate generated JavaScript build is required.

Scene v1 is unchanged: `sceneId`, `version` and `objects`; each object has `id`, `assetId`, position, XYZW unit quaternion rotation, scale and visibility. Coordinates are right-handed, +Y up and −Z forward, in metres. A save revision is distinct from the document's schema version. Legacy A-Frame Euler layouts remain separate; the orientation helpers do not migrate or overwrite persisted layouts.

Swift consumes the language-neutral generated API contract, not this executable package. Native source remains in `apps/visionos`; `packages/api-contract` holds shared schemas, artifacts and compatibility fixtures without becoming a JavaScript package.

Hierarchy, additional object types, explicit environment metadata and schema migrations belong to a later versioned scene slice. They are not silently added to v1 during the workspace extraction.

The root compatibility tests assert unchanged fixture shape, shared schema identity and unchanged published OpenAPI schemas. Package checks run through `pnpm --filter @shape/scene-schema typecheck` and `pnpm --filter @shape/scene-schema lint` after workspace installation.
