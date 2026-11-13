# Recover navigation to implemented workflows

User reports all pages broken after Features01–08. Actual Chrome tab was `localhost:3001/app/projects` returning spatial Next404. Portal pages at127.0.0.1:3000 respond200; project API returns503/PROVIDER_UNCONFIGURED. User confirms Clerk/Neon/R2 still need setup. No auth bypass/sample private data or external provisioning is authorized.

Concrete source gaps: spatial server has no recovery for web-owned page paths; StudioShell hides root navigation, leaves Review disabled as planned and sends Brainstorm to the old XR entry. Brief/AI/upload/publication/revisions live inside authenticated project detail, so correct routing alone cannot make them live without services.

- [x] Add failing browser navigation tests (enabled Review, dedicated brief-aware Brainstorm entry, internal-port redirect preserving page path/query); add strict redirect-target tests.
- [x] Add a spatial proxy for GET/HEAD navigation only on known web page prefixes. Use configured exact public origin, never caller host; leave spatial pages/assets and API writes unchanged. Local-only fallback public origin is127.0.0.1:3000 when no development setting exists; absent production origin does not redirect.
- [x] Wire Review to `/reviews`; add `/studio/brainstorm` using existing server identity/project permissions and links to `#brainstorm` in authorized project pages. No duplicated provider flow or fabricated project.
- [x] Verify focused tests, pnpm check, real running HTTP redirects and relevant/full browser regressions. Document actual usable pages and setup blockers, update both trackers. No new dependency/migration/native contract/account/deployment/commit.

Target files: spatial `src/lib/portal-target.ts`, `src/proxy.ts`, test; web `StudioShell.tsx`, `ProjectBrainstorm.tsx`, new `app/studio/brainstorm/page.tsx`; browser navigation test; README/runbook/trackers. Preserve all existing dirty work.

Final review corrections: moved fragment to the stable outer `ProjectBrief.tsx` section; added optional server-side editable filtering in `server/db/projects.ts` (default project listing unchanged). Added delayed-brief browser and actual SQL read-only chooser regressions, both red→green. Child ProjectBrainstorm anchor was removed to avoid duplicates. Corrected README's old migrations/upload/editor descriptions and local origin template; existing ignored `.env` public origin changed only fromlocalhost to127, credential fields preserved.

PASS: final workspace646tests/68files,14tasks/bothbuilds;26 focused unit/SQL cases; initial full121 Chromium cases plus final15 relevant navigation/brief cases (122 distinct total). Final whitespace/index checks pass. NOT RUN: real services/accounts/private project workflows. User confirms Clerk/Neon/R2 need setup. No external provisioning/migration/commit/deployment. [Workflow locations/setup/evidence](../../development/workflow-navigation-status.md).
