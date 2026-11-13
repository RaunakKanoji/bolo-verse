# Synthetic demonstration inputs

`nova-coffee.json` is reproducible input data, not a seeded project. Generate a one-page PDF brief and two clearly marked PNG references with the repository's existing Chromium installation:

```sh
node scripts/generate-demo-fixtures.mjs
```

Outputs go to `output/demo/nova-coffee/`, with byte counts and SHA-256 hashes in `manifest.json`. Do not commit generated PDF/PNG output. The generator makes no provider, account, database or upload request. These references must never be shown as successful AI generation.

Use separate real Clerk development client/creator accounts. Configure the designated creator server-side; do not place identities or credentials in this JSON. Create the project through the actual submission flow, then upload the generated PDF and PNG files. Reload and retrieve all three assets to establish persistence. AI context must use the entered brief; uploading a PDF does not extract its text.

Existing `pnpm db:seed` creates an independently labeled fictional Ilkal sample for a verified Clerk identity. It is not a replacement for this client-submission acceptance test and must not be run against an unknown/production database.
