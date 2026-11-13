# Shape Studio demo runbook

Updated 13 November 2026, Asia/Kolkata. Feature 00 covers baseline/demo safety only. The latest creator-screen results and open gates are in the [creator platform report](development/creator-platform-status.md); baseline evidence remains in [DEMO_STATUS.md](DEMO_STATUS.md).

## Start the correct applications

Use Node 24+ and the pinned pnpm 11.12.0. Run commands from the repository root. Existing dependencies are installed; no new package is required for this feature.

```sh
pnpm dev
```

The current launcher starts the public portal/backend on **127.0.0.1:3000** and its internal R3F app on **127.0.0.1:3001**. Use the public portal for navigation and API calls. Port 3001 alone is not the portal. Prefer the explicit IPv4 address locally: an unrelated Docker service also listens on port 3000 over IPv6; do not stop it to run this demo.

If the public port is unavailable, use a free pair:

```sh
pnpm dev --hostname 127.0.0.1 --port 3200
```

The spatial app then uses 3201. Keep `NEXT_PUBLIC_APP_URL` and `ALLOWED_ORIGINS` aligned with the public origin. Root `dev`/`start` supplies the matching internal origins. Do not run bare Next at the repository root, start a second dev process over an existing app lock, or use the internal spatial port as the public URL.

| Experience | Current development URL |
| --- | --- |
| Portal | http://127.0.0.1:3000/ |
| Projects | http://127.0.0.1:3000/projects |
| Persistent Brainstorm Studio | http://127.0.0.1:3000/brainstorm |
| Assigned client reviews | http://127.0.0.1:3000/review |
| Workspace dashboard | http://127.0.0.1:3000/workspace |
| Canonical R3F entry | http://127.0.0.1:3000/spatial-studio |
| Creation entry | http://127.0.0.1:3000/create |
| Assets / Clients | http://127.0.0.1:3000/assets · http://127.0.0.1:3000/clients |
| Camera recording | http://127.0.0.1:3000/recording-lab |
| Settings / Profile | http://127.0.0.1:3000/settings · http://127.0.0.1:3000/profile |
| Authorized canonical scene | http://127.0.0.1:3000/workspace/PROJECT_UUID |
| Web creative studio | http://127.0.0.1:3000/studio/create |
| Public legacy A-Frame sample | http://127.0.0.1:3000/xr/preview |
| Authorized legacy XR | http://127.0.0.1:3000/xr/PROJECT_UUID |
| Isolated mono recorder | http://127.0.0.1:3000/studio/feasibility |

`PROJECT_UUID` is a placeholder for an actual authorized project. There is no universal demo project/account or bypass token. A project UUID alone never grants access.

Briefs, project images, publication and revisions are tabs inside `/projects/PROJECT_UUID`. Portal page paths mistakenly opened on internal port3001 now redirect to the configured public portal. See [workflow locations/current setup](development/workflow-navigation-status.md); source/fixture verification does not mean the private services are configured.

## Prerequisites for the persisted demo

Configure the ignored root `.env.local` locally; do not paste secrets into reports. Required identity/project variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`. Ready private asset reads additionally require `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`. `NEXT_PUBLIC_APP_URL`/`ALLOWED_ORIGINS` must identify the exact public browser origin. Configure the real Clerk development instance and sign in normally.

Use a development database with the checked-in migrations through 0010 reviewed/applied by its operator, and an existing ready, supported image/GLB asset in the intended project for placement. This work did not migrate a live database or upload/seed private media. Identity-bound review requires migration0009; the creator screens and persistent Brainstorm use migration0010; configuration/accounts still need setup.

Use two real development accounts: an owner/creator/editor, and an unrelated or explicitly assigned read-only client. None are provisioned or live-verified in this environment. Configure Gemini separately if demonstrating actual assistant proposals; fixture suggestions are test evidence only. Native login and private model delivery have their own [native setup](../apps/visionos/README.md) and [validation gates](shape-studio/native-validation.md).

## Persisted workflow — 90-second rehearsal budget after prerequisites

These timings are a rehearsal budget, not measured performance.

1. **0–20s:** Sign in, open Projects, create a project with a name/objective, and reload its detail page. Confirm the same project and values reopen.
2. **20–55s:** Open the canonical workspace for a project with a ready asset. Place/select it, change Position X, save, then reload. Confirm the saved transform persists.
3. **55–75s:** In a second tab load the same revision. Save a new change in the first; the stale tab must show a revision conflict rather than overwrite it. Reload only after choosing whether to discard local edits.
4. **75–90s:** In the legacy XR assistant, choose a reset proposal. Read the reset-and-save disclosure, select **Keep layout**, and confirm there is no reset POST or changed saved layout. Confirming a second proposal saves the default, replacing saved and unsaved arrangements.

The assistant part requires a proposal from a configured provider. The tested HTTP-fixture reset flow is not a live Gemini interaction.

## Credential-free partial demonstration

Open `/workspace` and navigate through the distinct creator screens; confirm that metrics remain empty and service notices stay contextual. Draft local unsaved ideas in `/brainstorm`, open `/spatial-studio` and try the procedural desktop demo. Open the public XR sample and manipulate its local scene; open the creative studio and edit/export the illustrative sample. These demonstrate startup/navigation/local rendering only. They do not demonstrate authenticated project creation, a saved canonical scene, a generated asset, client approval or live providers.

## Recovery and manual checks

- **401:** Sign in again using the configured Clerk instance. **403:** Check explicit project assignment/edit role and trusted Origin; do not bypass authorization.
- **503 / setup notice:** Check the missing variable names above and backend connectivity. Never print their values. Public samples remain usable.
- **409 scene conflict:** Keep local edits, inspect/reload the newer revision deliberately, then save again. Never silently overwrite.
- **Failed network:** Saving must show a recoverable error and keep unsaved changes. Restore connectivity and reload deliberately. Browser fixtures exercise this path; perform live acceptance separately.
- **Reset:** Legacy layout reset saves immediately after confirmation. **Keep layout** must make no mutation. Canonical R3F scene saves and legacy A-Frame layout saves remain separate formats.
- **Invalid input/denied user:** Try malformed project IDs and an unrelated/read-only account. No private editor/content or mutation should be exposed. An unconfigured 503 is not proof of a live unauthorized-user check.

Run `pnpm check` for the full workspace gate. For the targeted client/SQL procedures and current limitations see [DEMO_STATUS.md](DEMO_STATUS.md). Hardware VR, microphone consent, mono recording, native gaze/pinch and physical-device performance remain separate acceptance procedures; no hosted or headset success is inferred from local fixtures.
