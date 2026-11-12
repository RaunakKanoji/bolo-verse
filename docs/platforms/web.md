# Conventional web application

The working Next.js App Router application is in `apps/web`, with its own manifest, config, source, public assets and production build. It also owns the modular API backend and same-origin gateway for `apps/spatial-web`.

Server Components resolve private project context. Interactive image editing, prompts, browser APIs and the spatial launcher use client boundaries. Zustand stores local editor state; React Hook Form handles prompts; scoped TanStack Query clients handle capabilities/private drafts. Do not make all routes client-rendered during later extraction.

Current experiences include project management, the shared studio shell, local image adjustments/export, four-mode prompt drafts, the isolated browser XR studio and the original recording lab. Local examples are labelled; unsupported generation/review/publication features must not look functional.

The web app consumes the pure `@shape/scene-schema` package and shared TypeScript/ESLint configurations. `packages/api-contract` and `packages/design-tokens` remain language-neutral artifact collections, not JavaScript applications. OpenAPI generation continues to drive TypeScript and Swift transports.

The modular backend runs in Next route handlers with focused services/repositories under `apps/web/src/server`. Clerk, Drizzle/Neon and bounded R2 readers stay server-only. Browser private writes preserve trusted-Origin checks; no workspace refactor may bypass them.

Existing XR, image editing, recording and private API URLs remain compatible. `/workspace` opens the independent R3F client; ordinary anchors cross that application boundary. Root scripts still own migrations, code generation and combined checks.

Use the root pnpm scripts described in [local setup](../development/local-setup.md). Verify production rendering, project authorization, responsive layouts, keyboard focus, image export and recorder/XR regressions after changes. Historical validation counts are recorded separately from evidence executed for the current phase.
