# Shape Studio Spatial

This directory records the native application boundary. **There is no Xcode application project in Phase 1.** Generated Foundation-only API models/routes live in `packages/api-contract/generated`; semantic token constants live in `packages/design-tokens`. Swift is not part of the JavaScript package manager workspace.

Phase 6 will create a genuine SwiftUI application using URLSession, Observation and Swift Concurrency. Phase 7 will add RealityKit volumes and immersive scenes. Neither phase uses a WebView dashboard wrapper. See [native and provider research](../../docs/shape-studio/native-provider-research.md) and [the implementation plan](../../docs/shape-studio/phase-0-plan.md).

Before authenticating the native application, validate the chosen Clerk SDK flow on the selected visionOS deployment target. Preserve session/token verification, tenant membership and project authorization on the shared server. Store native credentials securely, never long-lived server secrets. Browser mutation Origin checks cannot simply be removed for native compatibility.

Validation gates:

- Phase 1: deterministic contracts, Swift typecheck and Foundation JSON encode/decode fixtures.
- Phase 6: Xcode app build, native authentication, authorized project/assets/conversation integration and simulator UI tests.
- Phase 7: supported asset loading, manipulation, spatial layout persistence and immersive exit on simulator where supported.
- Hardware acceptance: physical Vision Pro interaction, permissions, comfort, performance and accessibility. Desktop or contract tests cannot satisfy this gate.

The local toolchain inventory supports Swift 6.2 and visionOS 26.0. No native app, simulator UI or physical-device behavior has been verified by the inventory itself.
