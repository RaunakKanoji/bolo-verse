# Deployment and service setup

The application is prepared for a Next.js server deployment such as Vercel. No hosted deployment, cloud database, Clerk application or provider account has been created or live-verified by these local implementation checks.

## Local and production commands

Use Node.js 24+ and pinned pnpm 11.12.0. Install with `pnpm install --frozen-lockfile`, copy `.env.example` to an ignored `.env.local`, then use `pnpm dev`. Port 3000 is the default; `pnpm dev --port 3001` is available if another local service owns it. Align `NEXT_PUBLIC_APP_URL`, allowed origins, Clerk domains and browser/test URLs with the actual host and port.

```sh
pnpm build
pnpm start
```

The normal built production server serves both pages and API routes. Do not configure a static export. Development/build preparation copies the pinned A-Frame UMD bundle and license into `public/vendor/aframe/`, so the deployed build must run the package build script.

## Environment and data

| Service        | Settings and setup                                                                        |
| -------------- | ----------------------------------------------------------------------------------------- |
| Browser origin | `NEXT_PUBLIC_APP_URL`; optional comma-separated exact `ALLOWED_ORIGINS`                   |
| Clerk          | Matching publishable/secret keys and authorized deployment domains; real sign-in required |
| Neon           | Server-only `DATABASE_URL`; optional direct `DATABASE_MIGRATION_URL`                      |
| R2             | Private bucket, account ID and scoped S3 access/secret keys                               |
| Gemini/Sarvam  | Explicit model/speaker settings described in [AI integration](ai-integration.md)          |

Review and apply all four migrations in order with `pnpm db:migrate`: `0000_foundation`, `0001_immutable_versions`, `0002_scope_and_operation_ids` and `0003_xr_workspaces`. The last migration creates project layout snapshots; it does not replace the recording session schema. Do not point migration commands at production until the target database and migration changes have been reviewed.

Keep `APP_MODE=live` in deployed environments. The deterministic text mock is for local nonproduction use only; it does not bypass identity or database access. Missing optional provider configuration leaves project editing available and shows explicit readiness/errors. The public `/xr/preview` works without any provider credentials and saves nothing.

Only the application origin and Clerk publishable key are browser-safe configuration. Never place database URLs, Clerk secret keys, R2 credentials, Gemini keys or Sarvam keys in `NEXT_PUBLIC_*` variables, committed files or logs.

## Private media and platform limits

R2 reads use a private authenticated server proxy rather than public object URLs. The implementation follows the [R2 AWS SDK v3 configuration](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/). It requires an existing ready asset record authorized through its project; this implementation does not add an upload/finalization service.

Supported previews are limited to 20 MiB and validated before a chunked streaming response. The server still buffers a bounded file for validation; account for that memory and the 20-second storage timeout when sizing the deployment. Conservative self-contained GLB/glTF rules reject external resources and compressed decoder dependencies; see the shared asset contract for exact accepted limits. Browser codecs may reject otherwise supported media.

Voice request bodies are capped at 4 MiB, and decoded TTS WAV output at 2 MiB. These remain beneath Vercel's buffered payload limit; larger approved asset responses use streaming. Confirm the deployment's current function, duration and streaming settings before release using the [Vercel Functions limits](https://vercel.com/docs/functions/limitations).

Use HTTPS for headset/mobile access, and preserve the existing CSP, private no-store responses, origin checks and Permissions-Policy settings. The iframe grants only the required XR/fullscreen capability; microphone capture stays in the consent-driven React assistant. There is no offline cache/service worker for private project responses or audio.

## Release verification

Run the checks in [testing](testing.md), then verify the actual deployment origin with real Clerk sign-in, Neon save/reload/conflict, protected R2 previews and configured Gemini/Sarvam requests. Test expiry/revocation and unavailable-provider behavior as well as success. Perform physical headset checks separately; deployment availability does not prove XR compatibility.

The original recorder at `/studio/feasibility` remains local-only: download recordings before navigation/reload. Native visionOS distribution, AR scene entry, background media processing and cloud recording export are not part of this deployment.
