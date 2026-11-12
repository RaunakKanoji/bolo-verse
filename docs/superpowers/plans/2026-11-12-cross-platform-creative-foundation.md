# Cross-platform creative foundation implementation plan

> For agentic workers: use subagent-driven-development for the independent ingestion and studio tasks, with integration review and full verification before committing.

**Goal:** Deliver the supplied master's initial increment: repository audit, Phase 1 foundations and a connected web image-creation studio. The remaining 18-screen roadmap is phased work, not a claim that every destination ships now.

**Architecture:** Keep the web modular backend, canonical R3F application and independent SwiftUI/RealityKit application. Extend the existing assets and processing-job models with actor-owned upload sessions and image-generation requests. Private previews, Clerk identity, SQL permissions and scene v1 remain authoritative.

**Tech stack:** Existing Next App Router/strict TypeScript/Zod/React Query/Zustand, Neon/Drizzle, private R2, Gemini image HTTP adapter, generated OpenAPI/TypeScript/Swift artifacts.

**Spec:** [User-supplied cross-platform implementation master](../../product/CROSS_PLATFORM_IMPLEMENTATION_SPEC.md), specifically its final execution instruction; approved Shape Studio/ALTÉR spatial references. Existing architecture is documented in `docs/architecture/system-overview.md`.

## Global constraints

- Do not implement all 18 screens simultaneously. Preserve the existing XR, recorder, local image editor, private drafts and native application.
- Keep canonical scene v1 and existing v1 capability responses unchanged; publish additive creation operations and schemas.
- Validate identity, project editability, byte bounds and strict contracts server-side. Never trust caller-selected storage keys, provider URLs or roles.
- No raw command audio, secret-bearing logs, fictional generation progress, fabricated approvals or public auth bypass.
- Credentials and account access are separate from implementation and fixture verification. Do not invoke paid providers during automated checks.
- Preserve generated design artifacts under `output/`; do not stage unrelated artifacts, credentials, build output or private media.

## Review focus

1. Revocation/account changes during upload, provider latency or result storage must not publish or display stale private data.
2. Repeated upload finalization and generation submissions must not duplicate assets or provider calls.
3. A timeout/crash after provider dispatch must not silently repeat a potentially billed request.
4. Corrupt, oversized, MIME-mismatched or external-resource input must fail before ready promotion.
5. Public/unconfigured and read-only views must retain working local editing while generation remains unavailable.

## Tasks and ownership

- [x] **Audit:** classify the 18-screen baseline, dependencies and native preservation gates in `docs/development/cross-platform-audit.md`.
- [x] **Contracts/database (root):** add closed creation/upload/job schemas, upload-session and image-request tables linked to existing assets/jobs, SQL constraints, migration and generated artifacts. Test rejection bounds and backwards compatibility before implementation.
- [x] **Private ingestion (ingestion agent):** signed bounded staging uploads, checksum/image validation, immutable object promotion and authorized idempotent finalization. Add PostgreSQL permission/revocation/concurrency and storage tests before production code.
- [x] **Generation orchestration (root):** real documented Gemini adapter, durable queued/processing/ready/failed/cancelled jobs, explicit cancellation, private history, safe worker lease/recovery and output publication. Preserve prompts/reference bytes as private data; never put keys or media URLs in logs.
- [x] **Initial web studio (studio agent):** approved visual system, real project upload/reference selection, prompt/model/aspect controls, job submission/polling/history/cancel/retry, selected-result preview and actual download. Preserve local adjustment/export/draft behavior; add `/create` and `/studio/image` compatibility destinations.
- [x] **Integration review:** inspect the combined trust/lifecycle boundaries and fix material findings. Review actual diff and migration; no live migration or deployment.
- [x] **Verification:** `pnpm check`, relevant production Chromium flows, Swift contract fixtures, native artifact drift and native tests/build if native source/artifacts change. Record commands, revision, results and explicit live/device limitations.
- [x] **Delivery:** update context and implementation status; commit planning, connected functionality and verification as reviewable Conventional Commits.

## Provider decision

Use the existing Gemini account boundary for the first image adapter, with an explicit configured model from a documented allowlist. Recheck primary provider documentation before implementation. Video/audio/3D generation stay unavailable in this increment; no obsolete video model or unsupported capability is advertised. Generic provider stubs must not be relabelled as live integrations.

## Later phases

Follow the master sequence: web projects/briefs/library, durable conversations and brainstorming, review/approvals/campaign management, production editors, native destinations and richer spatial/immersive workflows, then broader voice/brand/team/export and release acceptance. Each phase must add connected services and behavioral verification rather than disconnected mock screens.
