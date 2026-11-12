# Reference-led creative studio implementation plan

**Goal:** Extend the working browser XR studio with a coherent dashboard and creative asset workspace following the supplied visual references.
**Architecture:** Reuse authorized project and asset repositories, A-Frame adapter, workspace persistence, and existing assistant routes. Add a reusable translucent application shell, a server-fed dashboard with explicit empty states, and a client-only local image adjustment view on the existing authorized asset route. No duplicate database, identity provider, or fabricated generation.
**Visual system:** Frost #eef0fc, glass #ffffffb8, ink #171a32, muted #656b85, violet #7761ee, blue #5189fa. System sans typography, 28px panel radii, 240px navigation, fluid two-column dashboard. References supply the aesthetic; BoloVerse remains the product name.
**Source:** User's attached browser XR master prompt and two reference images; existing docs/XR_BROWSER_STUDIO_SPEC.md.

## Milestones
- [x] Audit current foundation, spatial scene, immersive session, persistence, asset, assistant and voice implementations; retain existing contracts.
- [x] Add reusable studio shell and dashboard. Search filters authorized projects. Missing auth/configuration is explicit; sample imagery is labeled and never substituted for private projects. No invented deadlines/progress/approval counts.
- [x] Add authorized image editing layout with brightness/contrast/saturation controls, reset, local comparison, and real PNG export. Other media retain existing authorized viewers. No remote image generation or saved edit claim.
- [x] Apply matching glass styling to XR shell while retaining a single render loop and resource cleanup.
- [x] Run lint, types, tests, production build, desktop/mobile browser flows, and inspect screenshots. Update documentation and acceptance tracker. Physical headsets and live providers remain unverified until tested.

## Constraints and review focus
Preserve other uncommitted work. Keep all project reads server-authorized. Never expose object keys or credentials. Retain old recording lab and links. Check empty/search states, editor teardown/object URL cleanup, responsive overflow, real exported pixels, save conflict and API denial regressions. No schema changes are planned.

## Completed local verification

306 unit/PostgreSQL tests and 24 production-browser checks pass, along with lint, types, scoped formatting and production build. See [implementation status](../../IMPLEMENTATION_STATUS.md) for exact boundaries and open live-service/headset acceptance. Validated code is committed locally; no deployment or push is claimed.
