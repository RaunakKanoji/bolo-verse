# Private R2 storage setup

**Superseded for local development:** the user selected Docker storage. Use `infra/local-storage/README.md` and `docs/development/local-object-storage-status.md`. No R2 bucket was created.

Prepared 13 November 2026. The Cloudflare skills are installed from the official `cloudflare/skills` repository, pinned to commit `cbf893b954222276bf1af57e5f23379231e0efb9`: `cloudflare`, `cf-cli` and `wrangler`. They will be available for automatic discovery on the next user turn. No skill, CLI, presence check or config file establishes a live integration.

## Prepared configuration

- `infra/r2/bucket-plan.json`: one development bucket, `shape-studio-dev-assets`, private, Standard storage, default jurisdiction. This name is proposed configuration, not evidence of a created resource.
- `infra/r2/cors.development.json`: Cloudflare dashboard CORS JSON. It permits browser PUT from exactly `http://127.0.0.1:3000` and `http://127.0.0.1:3180`, with `Content-Type` and `If-None-Match`, exposes ETag and caches preflights for 600 seconds. Add another exact gateway origin only when actually used. The spatial app's internal 3001/3181 ports do not upload directly. Never replace these origins with `*`.
- Existing Node S3 SDK providers remain unchanged. They derive the endpoint from the Cloudflare account ID, use region `auto`, enforce authorization/finalization/immutable writes, and proxy private reads through the backend. Browser GET access/public R2 domains are unnecessary.
- The existing upload flow writes `staging/images/...` and immutable `private/...` keys in the same bucket. No directory creation, public-read policy, database replacement, application auth bypass or object-expiry lifecycle is needed. Existing explicit orphan-cleanup commands remain separate.

R2 is managed cloud object storage; Docker is optional local emulation, not an R2 deployment. Docker 28.5.1 is running, with other applications' containers already present. None were changed. The app currently restricts storage to the actual R2 endpoint; no MinIO container or arbitrary endpoint override was added.

## Create the bucket once Cloudflare access is available

1. Sign in to the intended Cloudflare account and open R2 Object Storage.
2. Verify whether `shape-studio-dev-assets` already exists. Create it only if absent, with Standard storage and default jurisdiction. Do not change another existing bucket or create production storage by accident.
3. Keep public access/r2.dev/custom public domains disabled. In its Settings/CORS policy, apply `infra/r2/cors.development.json` and verify the saved exact origins/headers.
4. Create an R2 S3 API token with **Object Read & Write**, scoped only to that bucket, for the application. Bucket creation/configuration needs separate administrative access; object-only keys cannot provision/configure buckets. Keep administrative credentials out of the application.
5. Put the following values in the existing ignored root `.env.local` (or the existing ignored root environment file already in use). Do not paste secrets in chat, put them in browser variables or commit them. Do not overwrite unrelated settings:

```dotenv
R2_ACCOUNT_ID=<32-character Cloudflare account ID>
R2_ACCESS_KEY_ID=<bucket-scoped access key ID>
R2_SECRET_ACCESS_KEY=<bucket-scoped secret access key>
R2_BUCKET=shape-studio-dev-assets
```

No `NEXT_PUBLIC_` variable should contain an R2 secret. `CLOUDFLARE_API_TOKEN` is a separate control-plane credential, not a substitute for `R2_SECRET_ACCESS_KEY`.

The existing server derives the default-jurisdiction endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`. Do not create an EU/US/FedRAMP jurisdictional bucket for this setup: those require different endpoints, which are not configured by the current application.

6. Restart the web/backend process after adding credentials; the separate R3F app does not receive storage credentials. Set `NEXT_PUBLIC_APP_URL`/`ALLOWED_ORIGINS` to the actual gateway origin used for uploads.

## Verify rather than infer

`pnpm env:check` checks configuration presence/format without printing keys; it is not a connectivity test. Private project uploads additionally need genuine Clerk/Neon configuration, existing schema migrations and an authorized creator/project. R2 keys alone do not create an account or project.

After setup, open Assets or an authorized project's image library, upload one PNG/JPEG/WebP, finalize, refresh the catalog and open the authenticated preview. Confirm the actual browser Origin receives a valid CORS response, conditional PUT works, a duplicate finalize is idempotent and another account cannot read the image. Use `scripts/smoke-project-image.ts` only with its explicit live opt-in and a genuine authorized disposable project; it creates a private asset. No storage upload/deletion, bucket mutation, live SQL migration or billed provider request has been made during preparation.

## Current state

All four R2 application variables and Cloudflare control-plane token/account environment values were absent during the initial presence-only inspection; no values were printed. Missing R2 slots were then appended to the ignored `.env.local` without replacing any existing setting; `R2_BUCKET` contains the proposed bucket name while the three credential fields await local entry. Cloud bucket creation, CORS application and live upload/readback are pending account access. Browser automation could inspect Chrome but twice timed out opening a new setup tab; it did not establish a Cloudflare login or create a resource. Runtime providers, package dependencies and Docker containers remain unchanged. No commit/push/deployment occurred.

## Verified tooling and dry runs

Cloudflare CLI `cf@1.0.0-beta.31` was downloaded through npm's temporary executable cache, without adding a project dependency or changing the lockfile. Its `auth whoami` result was `authenticated: false` / `Not logged in`. No temporary Worker account/deployment was requested.

The following two commands passed with `CLOUDFLARE_ACCOUNT_ID` set to an explicitly fictitious 32-zero placeholder for validation. They produced request previews only; the placeholder was never sent as a bucket mutation:

```sh
npm exec --yes --package=cf@1.0.0-beta.31 -- cf r2 buckets create --name shape-studio-dev-assets --storage-class Standard --dry-run
npm exec --yes --package=cf@1.0.0-beta.31 -- cf r2 buckets cors update shape-studio-dev-assets --rules @infra/r2/cors.api.json --dry-run
```

`cors.api.json` is the Cloudflare REST/CLI representation of `cors.development.json`; the latter is the dashboard representation. Both were parsed and compared to ensure the same origins/methods/headers/ETag/cache policy. Use the correct representation for the chosen tool. No wildcard origin, browser DELETE, public-read policy or automatic object expiry is configured. Keep any account administration token in the CLI's protected authentication setup, separate from application runtime credentials. Authentication and choosing the intended real account precede any apply command. Existing CORS must be inspected before replacement if the bucket already exists.

Static validation of all three JSON files and exact upload headers passed; `.env.local` is ignored by Git and no credential content was printed. These are configuration-only changes, so no app/browser/native runtime test or live service success is claimed. Existing application tests/builds were not rerun for JSON and documentation additions.

## Sources

- [Official Cloudflare skills](https://github.com/cloudflare/skills/tree/cbf893b954222276bf1af57e5f23379231e0efb9/skills)
- [Creating buckets and private defaults](https://developers.cloudflare.com/r2/buckets/create-buckets/)
- [Browser CORS configuration](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2 authentication and permission scopes](https://developers.cloudflare.com/r2/api/tokens/)
- [S3 operation compatibility](https://developers.cloudflare.com/r2/api/s3/api/)
