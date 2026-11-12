# Native spatial architecture

The [native specification](SPATIAL_MASTER_SPEC.md) supersedes the earlier web-only scope. The [committed audit and file-level plan](../superpowers/plans/2026-11-12-native-spatial-foundation.md) preceded implementation. The working web app remains at the repository root.

## Ownership and authentication

`ShapeStudioApp` declares native windows, a volume and mixed ImmersiveSpace. `AppDependencies` owns one Clerk observer independent of window closure. Session events clear private state, invalidate API requests and launch a separately cancellable project refresh. Network latency does not block processing account/revocation events.

`ShapeStudioCore` contains generated API/tokens, an actor API client, services, observable project/prompt state and pure spatial math. URLSession is ephemeral, rejects redirects and nonmatching origins/paths, bounds payloads/timeouts, and refreshes once on 401. State request tickets reject stale results after session or project changes. Credentials belong to Clerk's Keychain storage; only a nonsensitive pending-signout flag uses preferences.

V1 routes now explicitly verify native Clerk session bearer tokens. Invalid supplied Authorization never falls back to cookies. Issuer is pinned to the configured Clerk instance, present authorized-party claims must be trusted, cookie writes still require trusted Origin, and any Origin supplied with bearer transport is validated. Legacy browser policies are unchanged. Live native registration and hosted login remain separate acceptance gates.

## Shared data

`GET/PUT /api/v1/projects/{projectId}/spatial-scene` use project-based stable scene identity and atomic revision CAS. SQL role/membership and ready project-asset predicates execute in the write statement. Migration 0005 stores canonical documents separately from legacy A-Frame Euler layouts.

`GET /api/v1/assets/{assetId}/native-content` is a separate bounded 32 MiB USDZ path. Nullable `nativeContentUrl` does not expand the browser `contentUrl` subset or its 20 MiB limit. Delivery validates metadata/archive/texture budgets and rechecks access after reading storage. It exposes neither storage keys nor credential-bearing URLs. It does not implement upload or conversion.

Strict shared contracts generate OpenAPI, TypeScript and Swift, including fixed numeric vector tuples. `native:sync` copies generated sources inside the Swift package; drift and malformed vectors are checked independently.

## Spatial semantics

Entities stay on MainActor outside transport state. One volume owns the render tree. Local imports and authorized project models have separate source/persistence rules. Canonical scenes use right-handed metre coordinates, +Y up, −Z forward and XYZW unit quaternions.

The viewer recenters/fits geometry for bounded inspection. Canonical mapping reverses that display normalization when saving and restores it when reading, preserving source-model coordinates. Unsupported nonuniform scale, ambiguous multiple instances and out-of-volume saved transforms are rejected instead of silently rewritten. Saving one object preserves other scene objects.

Immersion uses explicit closed/opening/open/closing states, fresh entities and visible exit controls. No raw gaze/hand tracking, microphone recording or continuous animation is introduced. This is a local immersive study, not the full multi-object production environment.

## Decisions and remaining risks

- Clerk 1.7.1 failed on installed Swift 6.2 syntax; pin 1.5.8 and reevaluate after upgrading Xcode. [Pinned release](https://github.com/clerk/clerk-ios/releases/tag/1.5.8), [Swift language evolution](https://www.swift.org/swift-evolution/).
- Native system materials/typography use shared accent, radius and spacing tokens. CSS glass is not reproduced in 3D.
- Shared creative capabilities remain `not_implemented`; native draft saves do not simulate generation progress/history. AI conversation/voice and client review require further versioned service integration.
- Container and post-load geometry budgets cannot guarantee decoder peak allocation. Binary USD/external-reference behavior and hostile inputs need further hardening and measured profiling before production trust.
- Live Clerk/R2/Neon integration, physical gaze/pinch comfort, accessibility, memory and frame pacing remain external acceptance gates. Simulator tests do not prove device behavior.
