# BoloVerse engineering guidance

Read `docs/BUILD_SPEC.md` before implementation. It is the product and architecture contract. Work one milestone at a time; update `progress-tracker.md` and `docs/IMPLEMENTATION_STATUS.md`, report checks and physical-device steps, then wait for `next`.

- Use Next.js App Router, strict TypeScript, Tailwind/shadcn, direct Three.js, Clerk, Neon/Drizzle, and private R2.
- Keep credentials, identity verification, tenant authorization, database access and signing server-only. Every private read/mutation checks authorization; never introduce a public test-auth bypass.
- Validate untrusted inputs with shared strict Zod contracts. Preserve revision/idempotency and immutable output boundaries as those features are added.
- One render-loop owner and one microphone owner; release owned resources on teardown. Record a mono canvas, never the stereo display.
- Distinguish implemented, simulated, configured, live-verified and physically unverified behavior. A provider interface is not a live integration.
- No raw command audio persistence, secret-bearing links in logs, invented metrics, or fabricated approvals.
- Use focused behavioral tests; run lint, typecheck, tests, production build and relevant browser flows before claiming completion.
- Commit the lockfile and reviewable SQL migrations. Never commit credentials, private media, node_modules or generated test/build output.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
