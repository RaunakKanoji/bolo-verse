# Shape Studio engineering guidance

Read `context/project-overview.md`, `context/architecture-context.md` and the current `context/progress-tracker.md` first. The native brief in `docs/shape-studio/SPATIAL_MASTER_SPEC.md` extends the existing web foundation; follow `docs/shape-studio/native-architecture.md` for the additive SwiftUI/RealityKit app. Generation orchestration and complete collaboration remain unimplemented. Preserve existing web/XR/recording functionality and distinguish implemented, tested and externally unverified behavior in both trackers.

- Use Next.js App Router, strict TypeScript, Tailwind/shadcn, A-Frame/WebXR, Clerk, Neon/Drizzle, private R2 and pnpm. Keep the original direct Three.js recording lab isolated; use AFRAME.THREE within the XR runtime to avoid mixing engine versions.
- Keep credentials, identity verification, tenant authorization, database access and signing server-only. Every private read/mutation checks authorization; never introduce a public test-auth bypass.
- Validate untrusted inputs with shared strict Zod contracts. Preserve revision/idempotency and immutable output boundaries as those features are added.
- One render-loop owner and one microphone owner; release owned resources on teardown. Record a mono canvas, never the stereo display.
- Distinguish implemented, simulated, configured, live-verified and physically unverified behavior. A provider interface is not a live integration.
- No raw command audio persistence, secret-bearing links in logs, invented metrics, or fabricated approvals.
- Use focused behavioral tests; run lint, typecheck, tests, production build and relevant browser flows before claiming completion.
- Commit the lockfile and reviewable SQL migrations. Never commit credentials, private media, node_modules or generated test/build output.
- Native Swift is independent of pnpm. Keep generated contracts/tokens synchronized with `native:check`; compile the checked-in Xcode project and run Swift tests for native changes. Maintain one session observer and one volume render owner; cancel or discard stale private results. Never claim simulator/device verification from source inspection alone.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
