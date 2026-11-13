# Clerk web authentication and Vercel release

The existing @clerk/nextjs7.9.25 integration is linked to the user's selected application, `app_3M2SPOyB6Q3taR1r5x2ZciW5MZi` (shape studio), through Clerk CLI4.1.0. No init, replacement app, user import, account creation, native change or authorization bypass was performed.

The web app now has `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` using the real Clerk components inside Suspense, plus visible signed-out/account controls in the public header. Provider URLs and fallback routes are explicit. The existing shared session cleanup and project/asset authorization remain intact. `/__clerk/` traffic is included in proxy matching. Missing keys display an honest setup state. The fictional `/demo` remains public and distinct from private workspace data.

Development keys were restored through `clerk env pull` into ignored `.env.local`. The user supplied the hosting keys; they were sent to Vercel over private stdin, never command arguments, GitHub source or logs. Vercel stores the secret as sensitive and the public key as encrypted configuration for Production/Preview. `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS` use the canonical project host. No database/storage/provider credentials were uploaded and no live database migration was applied.

This is genuine Clerk development-instance authentication for a presentation. Clerk's production readiness report is `not_started`: production auth requires a domain the user owns and the normal Clerk DNS/deployment steps. No owned domain was provided; no production Clerk instance was created. The existing app's sign-up methods were preserved. No test user was created in the existing application.

Vercel's initial install rejected pnpm11.12.0 as a broken release. The repository now pins available pnpm11.28.11 and Node24.x. Dependency versions and the lockfile remain pinned. A local offline metadata-only install could not reuse the older pnpm metadata mirror; hosted installation is verified separately. Existing node_modules was preserved.

Verification and live release outcome are recorded below after completion. The earlier unconfigured build failed installation and has no assigned live alias. GitHub release commits are isolated on `deploy/vision-pro-web-2026-11-13`; local main/index/native edits remain untouched.

Local Clerk verification uses `http://localhost` with the server bound to `localhost`; binding 127.0.0.1 while Clerk rewrites to localhost caused a local self-proxy loop. The hostname-matched production server serves the genuine Clerk forms. Hosted verification uses the canonical HTTPS host.
