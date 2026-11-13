# Pre-demo QA implementation plan

> **For agentic workers:** Execute inline with the systematic-debugging and verification-before-completion skills. Preserve the accumulated working tree.

**Goal:** Audit all prototype acceptance criteria, fix independently verifiable P0 defects, and produce an honest browser demonstration readiness decision.

**Architecture:** Reuse existing private services, project authorization, strict contracts and isolated renderers. No new dependencies, schema migration, public auth bypass or provider is needed for context/template/preflight corrections.

**Tech stack:** Existing Next/TypeScript/Zod/Drizzle/Vitest/PGlite/Playwright.

**Spec:** `docs/demo/PROTOTYPE_AUDIT.md` records the supplied QA request, audit and proposed files before implementation.

## Constraints and review focus

- No secrets in diagnostics; missing config must not be mistaken for live readiness.
- Never redispatch an ambiguous billed request; preserve idempotent attempts.
- Provider context must contain only authorized, bounded, redacted saved data.
- Changes during provider latency must discard stale private output.
- Template selection must preserve editable user instructions and existing client session cleanup.
- Preserve unrelated dirty work; scope commits to independently reviewed task files.

## Tasks

- [x] Audit current architecture, source and sixteen required acceptance criteria; run baseline checks; report findings before changes.
- [x] Write failing saved-idea context and concurrent session-change tests; fix provider projection; rerun focused SQL tests.
- [x] Write failing registry tests for all ten unique template IDs/objectives/inputs/outputs and bounds; add registry and composer selection; verify in Chromium.
- [x] Test a secret-free fail-closed preflight; implement command without live service mutations; verify present/missing configurations.
- [x] Prepare reproducible synthetic inputs and reports; explicitly label missing artifacts, client assignment and live acceptance blockers.
- [ ] Run frozen dependency consistency, `pnpm check`, relevant production and fixture browser flows, native artifact drift and whitespace checks; fix actual failures before reporting.
- [ ] Review task-owned changes and package small logical commits without including prior uncommitted work.

Final focused gate passed88 tests/9 files. Full workspace check and lock consistency were attempted and remain blocked by concurrent dependency work (user chose to let it finish first). New isolated browser run was not started because automatic permission review timed out. No commits or readiness claim; all live gates remain explicit.
