# Native and provider research

Reviewed 12 November 2026 against primary sources. Documentation verification is not account access, billing, integration, simulator UI or physical-device verification.

## Native architecture and authentication

The [official Clerk Swift package](https://github.com/clerk/clerk-ios) currently declares visionOS 1+, Xcode 26+ and Swift 6.2+. Its [manifest](https://github.com/clerk/clerk-ios/blob/main/Package.swift) explicitly lists visionOS. This makes it a Phase 6 candidate, not proof that every UI component or sign-in strategy works on Vision Pro.

Start Phase 6 by compiling ClerkKit for the selected visionOS target and validating hosted authentication. Clerk documents browser authentication through `startHostedAuth()` and bearer session tokens through `clerk.auth.getToken()`. Native API registration and app configuration must be completed in the intended Clerk instance. No remote configuration was changed during this research. [Native quickstart](https://clerk.com/docs/ios/getting-started/quickstart), [authentication reference](https://clerk.com/docs/ios/reference/native-mobile/auth).

The standards-based fallback is a public authorization-code client with enforced S256 PKCE and no embedded client secret. Clerk documents this capability, but OAuth tokens are distinct from session tokens: Next.js `auth()` defaults to session tokens; OAuth requires explicit accepted token types and scope checks. A native integration must also retain existing project membership checks. Do not add a permissive token bypass. [Clerk OAuth](https://clerk.com/docs/guides/configure/auth-strategies/oauth/how-clerk-implements-oauth), [Next.js OAuth verification](https://clerk.com/docs/nextjs/guides/development/verifying-oauth-access-tokens).

Build separate SwiftUI window, volumetric `WindowGroup` and `ImmersiveSpace` scenes. Use `RealityView`/RealityKit entities and supported USD/USDZ assets. Respect system placement and targeting. Ordinary gaze-and-pinch interactions do not require custom eye tracking. ARKit hand/world-data access needs capability checks, appropriate permissions and usage descriptions. [Apple 3D content](https://developer.apple.com/documentation/visionos/adding-3d-content-to-your-app), [privacy](https://developer.apple.com/documentation/visionOS/adopting-best-practices-for-privacy), [ARKit access](https://developer.apple.com/documentation/visionos/setting-up-access-to-arkit-data/).

Local read-only inventory found Xcode 26.0.1 (17A400), Swift 6.2, visionOS 26.0 SDK, visionOS Simulator 26.0 SDK, and installed visionOS 26.0 simulator runtime (23M336). Foundation-only generated contracts can be typechecked here. This inventory does not establish a native application build or simulator/device acceptance.

## Provider capabilities and cost boundaries

Current Gemini docs cover native image generation/editing and dedicated speech synthesis. The current video guide recommends `gemini-omni-1.2-flash` and explicitly marks Veo 3.1 Preview as shut down. Recheck the exact selected endpoint and account access before Phase 3 implementation; do not assume older model names remain available. Seed and a negative-prompt API were not established by this review, so they must not appear as functioning generic image settings. [Image generation](https://aistudio.google.com/docs/image-generation), [video](https://aistudio.google.com/docs/video), [speech](https://aistudio.google.com/docs/speech-generation).

The pricing snapshot lists Gemini 3.1 Flash Image at approximately $0.067 per 1K output image and Omni 1.2 Flash 720p video at approximately $0.07 per output second; input billing and other conditions are additional. These paid capabilities are not a price guarantee or proof of account access. Gemini API credentials remain server-only. [Pricing](https://aistudio.google.com/docs/pricing), [authentication](https://aistudio.google.com/docs/api-key).

Sarvam documents API-key authenticated STT and TTS. The current detailed pricing lists STT ₹0.49/minute, Bulbul v4 Flash TTS ₹1/1,000 characters, and Bulbul v3 ₹3/1,000 characters, subject to tiers and conditions. TTS uses `language_code` and returns encoded audio. These sources do not establish image/video/3D generation. [Pricing](https://docs.sarvam.ai/api/getting-started/pricing), [TTS](https://docs.sarvam.ai/api-reference/text-to-speech/convert), [STT](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe).

Existing text/speech adapters are not creative-media generation orchestration. This phase keeps creative generation unavailable until provider invocation, durable jobs, authorized private output storage, metadata persistence and failure recovery exist together. No provider credentials or live billing were exercised.

## Spatial interoperability decision

The new canonical scene boundary uses right-handed coordinates, metres, +Y up, -Z forward, unit XYZW quaternions and dimensionless scale. It bounds position to ±30 metres, scale to 0.1–10 and scenes to 50 objects. Object identities are unique. Existing A-Frame layouts retain Euler XYZ degrees and their current storage format. Explicit pure adapters translate rotations; no automatic storage migration is performed. Euler angles may differ after a round trip while representing the same orientation, particularly at gimbal lock.

Web GLB/glTF and native USD/USDZ remain source/derivative formats, not interchangeable promises. Future conversion must preserve source assets, record conversion provenance and constrain supported materials, lighting and animation. This phase does not ship a converter or native scene persistence.
