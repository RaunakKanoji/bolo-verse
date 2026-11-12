# ADR 0002: Preserve scene v1 while defining richer scene evolution

Status: accepted for Phase 1; v2 implementation is deferred to its functional scene milestone.

## Context

The backend and native client already use a strict canonical document with `sceneId`, `version: 1` and asset objects containing position, XYZW rotation, scale and visibility. PostgreSQL enforces one scene per project and stable project-based scene identity. Generated Swift decoders reject unknown keys.

The unified target requires hierarchy, typed objects, environment settings and interaction/platform metadata. Adding these to existing v1 responses or renaming `version` to `schemaVersion` would break installed native clients. Treating the database save revision as a schema version would also corrupt concurrency semantics.

## Decision

Phase 1 extracts the unchanged pure schema into `@shape/scene-schema`; the original import path remains a compatibility re-export. Preserve generated v1 wire bytes, validation constraints and fixtures. Do not migrate persisted scenes merely to establish package boundaries.

A later v2 slice must define explicit schemas and versioned API behavior, supported parent-relative transforms, cycle/depth/resource limits and stable identities. Keep metres, right-handed +Y-up/−Z-forward axes and XYZW unit quaternions explicit. Environment and platform metadata must have bounded typed schemas rather than arbitrary execution-capable payloads.

Implement an idempotent v1→v2 migration with documented defaults and preserved source/version history. Any v2→v1 projection must be demonstrably lossless. If hierarchy or metadata cannot be represented, reject incompatible legacy writes instead of silently dropping newer state. Permission, asset-reference and expected-revision checks still apply during migration.

Keep legacy Euler A-Frame layouts and recording documents separate until an explicitly tested conversion is introduced. Quaternion conversion helpers alone are not a database migration or renderer-parity guarantee.

## Consequences and acceptance

The initial workspace foundation remains compatible with existing web/native clients. Richer scene functionality requires deliberate transport/database/client changes, rather than opportunistic fields in a shared JSON object.

V2 acceptance must cover real old-client fixtures, malformed hierarchy, migration replay, unsupported downgrade, concurrent legacy writes, foreign asset IDs and native/web coordinate round trips. See [current scene format](../architecture/scene-format.md).
