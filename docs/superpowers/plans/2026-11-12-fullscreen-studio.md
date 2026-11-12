# Full-screen Studio Implementation Plan

> Use executing-plans to implement in this session.

**Goal:** Fill the browser with the existing spatial studio and accessible layout tools.
**Architecture:** Scope the outer shell override to pages containing the XR workspace. Use CSS grid and independent panel scrolling; preserve the single scene owner and existing transform operations.
**Tech Stack:** Next.js, React, CSS modules, Lucide, A-Frame.
**Spec:** docs/superpowers/specs/2026-11-12-fullscreen-studio.md

## Constraints
Preserve existing uncommitted work, authorization, preview labels, and save behavior. No database/API changes or hardware claims.

## Review Focus
Viewport fit, narrow-screen overflow, keyboard controls, long inspector content, assistant accessibility.

## Tasks
- [x] Update workspace markup: project identity, navigation link, selected-card toolbar, assistant inside companion.
- [x] Add scoped full-viewport shell and responsive independent scrolling.
- [x] Verify lint, typecheck, unit/integration tests, build, and XR browser flows. Record outcomes and limitations.
