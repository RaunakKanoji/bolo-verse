# Testing the XR studio

Run checks from the repository root with the pinned Node/pnpm versions in [README](../../README.md). Current completed-run evidence and remaining external checks belong in [implementation status](../IMPLEMENTATION_STATUS.md); this guide does not freeze a test count while the suite evolves.

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

`format:check` covers `src/xr`, `src/features/projects` and `src/features/workspace`; lint/typecheck cover the application. Inspect `pnpm db:generate` output for unintended schema drift when changing the schema, and commit reviewed SQL migrations with their metadata. Do not apply migrations to an unrelated/shared database for a test.

## What the suites establish

| Layer                            | Coverage and boundary                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                             | Capability rejection/fallback, strict layouts/transforms/serialization, commands, provider payload/error limits, media cleanup and asset validation                          |
| PostgreSQL integration           | Actual repository/route queries executed through PGlite, including tenant/role denial, version conflicts, asset scope and assistant budgets; Clerk/network boundaries mocked |
| Next browser flows               | Real local Next app, public A-Frame scene, missing-configuration UI and original recorder using synthetic microphone input                                                   |
| Editable workspace browser flows | Real React/A-Frame client in an isolated localhost component harness, with fixture project content and intercepted HTTP responses                                            |

The component harness is `scripts/test-xr-harness.mjs` with entries under `tests/browser-fixtures/`; it is not a production Next route and grants no private application access. It checks actual scene transforms, save/reload state, dirty-state preservation on conflict/401/503, reset confirmation, read-only controls, stale preview completions and simulated XR rejection. Its HTTP store does not prove Neon persistence; PGlite tests separately cover SQL concurrency and authorization.

Provider tests use explicit fake fetch responses. Synthetic microphone and mocked WebXR scenarios test lifecycle/error handling, not live Sarvam/Gemini quality, physical input or a presenting headset. Desktop Chromium is the only browser with automated evidence here.

## Server origin and ports

The standalone harness maps Next's Link to an ordinary anchor because it has no Next compiler/router. Navigation itself is tested against the actual Next application; rendering, transforms, asset decoding and workspace state use the production modules in the harness.

Playwright defaults to `http://127.0.0.1:3000` and starts a dev server unless an existing server is reused. If another service (including Docker) owns that port, choose another port and use the exact same host in your browser and test setting:

```sh
pnpm dev --hostname localhost --port 3001
# In a second terminal, after the server is ready:
PLAYWRIGHT_BASE_URL=http://localhost:3001 pnpm test:e2e
```

The editable-workspace harness selects a free localhost port for each run. Set `PLAYWRIGHT_OUTPUT_DIR` to a separate ignored output directory when another session is also testing this checkout. Missing-configuration scenarios expect no live Clerk/Neon environment. A local `.env.local` with real integrations can change those expected screens; isolate that environment for these tests.

A production smoke check uses `pnpm build`, then `pnpm start` and the public preview/recording routes. A passing production build or smoke check does not establish a Vercel deployment. For authenticated end-to-end checks, use separately configured Clerk/Neon development accounts and real membership; never add a test-auth route to the app.

## Manual checks still required

Verify live sign-in, authorized project create/read/edit, save/reload/conflict against Neon, private R2 delivery and Gemini/Sarvam requests using configured accounts. On physical devices, follow [browser support](browser-support.md) and the [device runbook](../DEMO_RUNBOOK.md). Record observed behavior, versions and failures; do not claim headset refresh rates or native visionOS support from this test suite.

## Dashboard and creative canvas

`tests/e2e/creative-studio.spec.ts` covers public connection state, navigation to the creative canvas, desktop/mobile overflow, presets, comparison and reset, local upload, PNG download, and decoded export pixels. The export assertion uses a known 32×24 source image and verifies that a brightness adjustment changes its red-channel pixels while retaining dimensions and alpha. This is a real browser canvas export, not a mocked download.

Private asset access, cross-tenant denial, post-storage access rechecks, layout persistence/CAS and restricted assistant actions remain covered by the existing PostgreSQL/route tests. XR browser harnesses use HTTP fixtures for authenticated content; they do not prove a live account or storage integration.
