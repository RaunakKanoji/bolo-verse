# BoloVerse / Shape XR presentation dataset

The no-login presentation opens at **`/demo`**. It is an explicitly labelled, public, read-only synthetic workspace, with a connected ChaiCraft brief → brainstorm → selected direction → script → five-frame storyboard → content → feedback journey. `/demo/xr` loads the existing real A-Frame runtime and saved layout transforms with fictional text panels. Private APIs retain their existing authentication and authorization.

## Hosted authenticated workspace — 2026-11-13

The web release is deployed at **https://bolo-verse-web.vercel.app**. Clerk development authentication is configured. The presenter's real Clerk account owns the seeded personal workspace at `/workspace`; other accounts receive no access to those projects.

The initial authenticated deployment lacked `DATABASE_URL`, so its workspace API could not load data. The repair created an isolated Neon development branch named `development/vision-pro-demo-2026-11-13` in the existing `space-studio` project. Its empty production parent was left unchanged. All twelve checked-in migrations were applied, then the existing `seedDemo` engine ran with the presenter subject resolved against the linked Clerk development instance. This was a guarded provisioning operation, with the exact development endpoint allowlisted and credentials supplied through private stdin. The package seed commands below remain local-only; production seed execution and runtime automatic enrollment remain disabled.

Persisted manifest validation returned no errors: 12 projects, 5 clients, 82 assets, 20 brainstorm sessions and 48 tasks. A second seed run inserted nothing. Existing authorized workspace repositories returned the presenter's data and no projects for an unrelated subject. Actual overview metrics were 10 active projects, 0 pending access-grant reviews, 3 completed deliverables and 6 upcoming deadlines. Synthetic historical feedback is distinct from live review access grants.

Vercel Production/Preview now have a sensitive `DATABASE_URL` targeting that isolated branch. Production deployment `dpl_CwQh3jjKuXxRgzouU8wJdSaVRbp4` reached READY using release `bfdf6577f615df7f20a9a2f350f9c673a9c6621b`. No secrets were committed. Fresh `pnpm check` passed all 14 tasks, including 849 tests and both app builds. Live browser checks cover Clerk forms, anonymous private API denial and the public synthetic workflow. The presenter's existing signed-in browser session and physical Vision Pro remain separate manual acceptance checks. Earlier local-only evidence below records the original implementation stage.

## Live voice and editor activation — 2026-11-13

Production speech settings use `saaras:v3` transcription and `bulbul:v3` speech playback, with English/Hindi/Kannada voices `ishita`/`shubh`/`ishita`. Gemini uses `gemini-3.5-flash-lite`. These are server settings; provider keys remain sensitive Vercel variables.

An explicit one-time Vercel build probe returned HTTP 200 for Sarvam TTS, Sarvam STT and Gemini. The probe generated a short synthetic English utterance, transcribed its in-memory WAV and requested a minimal assistant reply. It stored no audio and introduced no public endpoint. This establishes live provider access; physical microphone capture, the user's signed-in browser flow, Hindi/Kannada speech and Vision Pro acceptance remain unverified.

Use **Brainstorm → Voice** for dictation. The project legacy **XR assistant → Voice controls** provides consent-gated recording, transcript review, assistant replies and reviewed action proposals; actions still require Apply. Canonical R3F and Shotstack timeline voice commands were not added.

The video editor has `ENABLE_EXTERNAL_EDITOR=true` and `SHOTSTACK_ENV=sandbox`. Preview/timeline editing and private draft saves are available independently of cloud rendering. The user explicitly chose to skip video export: R2 is absent and rendering remains correctly unavailable. No live Shotstack render was submitted.

`scripts/verify-live-providers.ts` is an operator-only command, not an ordinary build step. The normal Vercel project build remains `pnpm build`; the live probe was selected through a single deployment's build override. Fresh workspace checks passed all 14 tasks and 849 tests; 49 focused speech/assistant/editor tests also passed.

## Audit and implementation

The repository uses Next.js 16 App Router, strict TypeScript, pnpm, Neon/Drizzle, Clerk and private S3/R2 adapters. Existing workspace clients, projects, tasks, briefs, artifacts, conversations, content versions, review comments/decisions, command logs and XR workspaces are reused. No migration, package dependency, second authentication system or native wire-format change was added. Organizations and synthetic creator profiles are descriptive client/production metadata, not Clerk identities or new tenancy tables.

- `apps/web/src/lib/demo/`: fictional catalog, deterministic typed dataset, strict contract/relationship checks, bundled asset manifest and database-validated presentation snapshot.
- `apps/web/src/server/demo/`: offline environment guards, typed database rows, atomic seed, validation, archive reset and allowlisted fixture reader.
- `scripts/seed-demo.ts`: persistent isolated PGlite database, existing migration journal and safe public snapshot export.
- `scripts/generate-demo-assets.mjs`: creates 35 original schematic PNG illustrations, each explicitly labelled synthetic.
- `apps/web/src/app/demo/` and `features/demo/`: responsive presentation workflow and read-only spatial view.
- Existing bounded private reader: recognizes reserved `demo-fixtures/v1/` keys after normal API authorization. Immutable bundled bytes have real dimensions, byte sizes and SHA-256 checksums. Unknown fixture keys fail closed. No storage credentials or arbitrary filesystem paths are accepted by this adapter.

## Actual seeded database counts

| Entity | Count |
| --- | ---: |
| Demo workspace | 1 |
| Fictional creator profiles (descriptive labels) | 3 |
| Clients | 5 |
| Projects / briefs | 12 / 12 |
| Production tasks | 48 |
| Brainstorm sessions / message exchanges | 20 / 40 |
| Creative directions | 36 |
| Complete script versions | 15 |
| Storyboards | 10 |
| Content versions | 40 |
| Ready synthetic previews | 38 |
| Simulated pending / failed content records | 1 / 1 |
| Synthetic voice history | 15 |
| Review comments / decisions | 24 / 6 |
| Saved XR layouts | 3 |
| Asset records / distinct original PNG files | 82 / 35 |

Asset records reuse original files where appropriate. The fixture adapter resolves their unique reserved logical keys to real bundled bytes; they are not nonexistent R2 objects. Script/voice/video preparation records use schematic visual cards and explicitly say playable media is unavailable. No external uploads, generated media, provider job IDs, usage costs, measured campaign results, real invitations or real approvals are fabricated. Pending/failed history creates no executable processing jobs. Voice history has empty timings and a `SYNTHETIC_NOT_EXECUTED` result; no microphone audio is persisted.

The strict existing lifecycle enums remain unchanged. Detailed production stages, language preferences, budgets, constraints and synthetic state labels live in briefs, production notes and the presentation dataset. Review decisions remain version-scoped and immutable. Briefs remain proposed; simulated review decisions do not approve real client briefs.

## Commands

From the repository root, using Node 24+ and the pinned pnpm:

```sh
pnpm install --frozen-lockfile
DEMO_SEED_ENABLED=true pnpm db:seed:demo
DEMO_SEED_ENABLED=true pnpm db:seed:demo:validate
DEMO_SEED_ENABLED=true pnpm db:seed:demo:reset --confirm=shape-xr-demo
pnpm dev --hostname 127.0.0.1 --port 3200
```

Open `http://127.0.0.1:3200/demo`. If the normal dev server is already running, use its web port and append `/demo`.

Seed and validate operate only on ignored `.demo/<slug>/`, using PostgreSQL via PGlite and the checked-in migrations. They never contact `DATABASE_URL`. The explicit `--local` argument is included in all three package commands. A direct script invocation without it refuses execution. Production Node/Vercel environments are rejected even if local mode was requested. Environment opt-in is mandatory. Driver failures are redacted.

Seed execution is one transaction. Stable UUIDs incorporate the namespace and logical resource. An occupied ID that is not owned by the seed aborts the entire transaction. A second run inserts nothing and preserves existing authored data. Validation detects count or fixture/artifact drift. The public snapshot exports only original fictional fixture source after SQL validation, never arbitrary user database rows.

Reset is a **logical archive**, not a deletion: it checks the exact confirmation slug and seed markers, archives only those 12 demo projects, increments their revisions, and retains all payloads, assets, contacts, comments and decisions. It never disables immutable-history triggers. Repeating reset changes nothing; rerunning seed does not unarchive. Archived records remain available as archive/history in the isolated database. The checked-in public snapshot is a separate presentation fixture and is not erased by archiving local database rows. For a fresh rehearsal, choose a new namespace and export again:

```sh
DEMO_SEED_ENABLED=true DEMO_WORKSPACE_SLUG=shape-xr-rehearsal pnpm db:seed:demo
```

`DEMO_REFERENCE_DATE=YYYY-MM-DD` changes the reproducible timeline; use a fresh namespace for a changed reference date. Rebuild the web application after exporting a new presentation snapshot.

## Vercel presentation setup

Import this pnpm monorepo with **Root Directory `apps/web`**, Next.js framework and the app's `pnpm build` command. Keep workspace source files outside the app root available to the build. The existing app build prepares its self-hosted A-Frame bundle. The committed synthetic snapshot and PNGs are included; no database seeding runs in a serverless function or at build time.

Use `APP_MODE=live` (or leave it unset). Existing `APP_MODE=demo` is intentionally local-only and must not be enabled on Vercel. The `/demo` presentation route is independent of that local assistant setting. Do not copy localhost SeaweedFS settings into Vercel. No Clerk, Neon, R2, Gemini, Sarvam or Shotstack key is required for `/demo` and `/demo/xr`.

After deployment open **`https://<your-preview-host>/demo`** in Vision Pro Safari. Enter immersive view only if browser capability detection enables the button. Desktop 3D remains available. This is not evidence of physical Vision Pro or live-provider verification.

This implementation does not deploy, provision accounts, write Neon or upload to R2. To activate live private projects later, provision Clerk development accounts, verify the intended Neon development branch, configure private hosted R2 and the corresponding providers, apply the reviewed migrations and run the existing authenticated acceptance flows. Remote demo seeding is deliberately disabled while identity and target selection are deferred.

## Six-minute presentation

1. **0:00–0:45:** Open `/demo`. Explain the fictional workspace; show five clients, twelve project stages and database-derived counts.
2. **0:45–1:30:** Keep ChaiCraft selected. Show the Har Cup Mein Khushi brief, ₹75,000 budget, deliverables, audience, palette and assigned creator.
3. **1:30–2:15:** Open Brainstorm. Read the three creative directions and selected multilingual campaign. Explain that these are saved synthetic examples.
4. **2:15–3:15:** Open Script & storyboard. Follow the five scenes from 0–30 seconds and open a full-size schematic frame. Show the English adaptation.
5. **3:15–4:00:** Open Content. Show versioned synthetic previews and the honest unavailable video/speech states.
6. **4:00–4:45:** Select UrbanThread Winter Collection, then Review & voice. Show version-scoped changes, creator response and synthetic final approval. Return to ChaiCraft for multilingual voice transcript examples.
7. **4:45–6:00:** Open ChaiCraft in spatial studio. Select script/storyboard panels and inspect their text. On a compatible headset, explicitly enter immersive view. If unsupported, demonstrate desktop 3D and retain the capability message.

## Integration readiness

| Integration | State for this delivery |
| --- | --- |
| Clerk | Deferred by user; private APIs retain checks; public fictional walkthrough needs no identity |
| Neon | Existing adapter preserved; no live branch selected, migrated or seeded |
| PostgreSQL | Isolated PGlite migration/seed/validation exercised locally |
| R2 | Existing private integration retained; no cloud upload performed |
| Local S3 | Earlier configured development transport retained; not used by bundled demo fixtures |
| Gemini / Sarvam / Shotstack | Existing adapters retained; synthetic history performs no live requests |
| Content tools | Existing live tools unchanged; presentation uses original schematic assets |
| Browser XR | Existing A-Frame runtime reused; browser verification listed below |
| Native visionOS | No native source changes; no new simulator or physical-device verification |

## Verification

Final local verification on 13 November 2026:

- `pnpm check`: all 14 tasks passed, including lint, strict root/web/spatial TypeScript, formatting, environment/contracts/tokens/native drift checks, **848 tests in 98 files**, and both production builds.
- Ten focused unit/PostgreSQL cases passed across three demo test files. Corruption regressions reject changed client links, membership roles, messages, mutable pending-content status and layout transforms. Validation also accepts the intentional archive status/revision change while retaining every other comparison.
- Seed executed twice against the persistent isolated database: first run inserted the dataset, second inserted zero records with identical counts. The final validate command returned `errors: []` and `archived: false`.
- **48 Chromium cases passed** against production ports 3200/3201: two new demo cases plus 46 existing shell/private-access/recording/R3F/A-Frame flows. The demo cases cover the complete creative journey, mobile overflow, five rendered storyboard images and real A-Frame startup/selection. Existing tests include genuine local recordings, track/resource teardown and private-access denial.
- All **35 production HTTP preview URLs** returned 200 with the expected MIME type, byte length and SHA-256. Broken previews: **0**. Missing fixture relationships: **0**.
- Desktop (1440px) and mobile (390px) screenshots were inspected. `git diff --check` passed.
- A focused independent review found and resolved a persisted-validation gap; the subsequent archive handling finding has regression coverage. The first full test attempt needed local loopback permission for the existing launcher test. The final complete gate passed with that permission; final failures: **0**.

The running production preview is `http://127.0.0.1:3200/demo`; port3201 serves the existing spatial app. Existing application processes were left alone. No new native compilation/device run, real Clerk session, live Neon/R2/provider acceptance, hosted Vercel build or physical Vision Pro rehearsal was performed.

No staging, commit, push or deployment was performed. The repository already contains a large set of uncommitted prerequisite domain/UI changes; this seed reuses those models. They were preserved, rather than packaging unrelated work into a seed commit or creating an isolated commit that would lack its prerequisite models.

Vercel platform reference: [monorepo deployment guidance](https://vercel.com/docs/monorepos). The app-root settings above follow this repository's existing build scripts. A real hosted build and Vision Pro rehearsal remain separate acceptance steps.
