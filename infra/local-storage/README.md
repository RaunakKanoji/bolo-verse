# Private local object storage

This is the development-only Docker alternative to Cloudflare R2. It uses the official `chrislusf/seaweedfs:4.53` image, private authenticated S3 access, and a named persistent Docker volume. The only published port is `127.0.0.1:8333`; master, filer, volume and administration ports are not published.

From the repository root, with Docker Desktop running and dependencies installed:

```sh
node scripts/setup-local-storage.mjs
node scripts/check-local-storage.mjs
```

Setup creates or reuses random credentials in the ignored `.local-storage/s3.json` (mode `0600`, parent directory `0700`), starts only this Compose project's `storage` service, creates the private `shape-studio-dev-assets` bucket if missing, and applies the checked-in CORS policy. After live integrity/privacy verification succeeds, it updates only `STORAGE_PROVIDER` and the required `S3_*` settings in ignored root `.env.local`. Existing unrelated settings and stored objects remain intact. Run setup again to reuse the same service, credentials and volume. Restart the web server to load the updated environment.

The check uploads temporary random bytes, reads them back and compares SHA-256, confirms a duplicate `If-None-Match: *` upload returns HTTP 412 without altering the original bytes, and confirms anonymous GET, PUT and listing return 403. It checks both approved browser origins and rejection of unapproved origins, methods and headers. It deletes only its own uniquely named temporary object.

CORS permits `PUT` from exactly `http://127.0.0.1:3000` and `http://127.0.0.1:3180`, with `Content-Type` and `If-None-Match`, exposing `ETag`. CORS does not grant anonymous object access. Credentials stay server-side; never place them in `NEXT_PUBLIC_*`, browser storage, logs or commits. Signed upload URLs remain short-lived private capabilities.

To stop this service while retaining data:

```sh
docker compose -f infra/local-storage/compose.yaml stop storage
```

To resume it, rerun setup. Do not use `down --volumes`, remove the named volume, or delete `.local-storage` unless you intentionally want to discard local storage or credentials. The script never resets or deletes a volume and never changes another Docker project. A failed setup prints the failed stage without credentials, signed URLs or provider response details; inspect this Compose service locally when diagnosing a failure, and do not share raw secret-bearing configuration.

This establishes real local S3 storage only. Clerk identity, application authorization, Neon migrations, app asset rows, provider generation and physical XR acceptance remain separate requirements. Local HTTP and single-node Docker durability are for development, not production hosting or a claim of Cloudflare R2 verification.

Primary references: [SeaweedFS 4.53 release](https://github.com/seaweedfs/seaweedfs/releases/tag/4.53), [S3 configuration](https://github.com/seaweedfs/seaweedfs/wiki/S3-Configuration), [conditional operations](https://github.com/seaweedfs/seaweedfs/wiki/S3-Conditional-Operations).
