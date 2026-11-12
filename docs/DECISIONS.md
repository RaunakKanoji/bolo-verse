# Architecture decisions

## XR Phase 1 amendment — 2026-11-12

The user's newer [XR specification](XR_IMPLEMENTATION_SPEC.md) supersedes the original engine, package manager and roadmap. Start with Phase 1; retain working M0 behavior and tenant/privacy invariants.

- **Engine boundary:** a browser-only adapter owns one A-Frame 1.8.0 scene in a same-origin iframe. The iframe contains A-Frame's custom elements, global styles, listeners and render loop. Teardown ends the owned session, disposes resources and removes the realm. React owns accessible companion controls. Runtime objects use `AFRAME.THREE`; never mix them with the recording lab's Three 0.187 objects.
- **Local assets:** copy the exact installed A-Frame distribution/license during dev/build. Canvas-rendered spatial text and model-free controller rays require no runtime CDN requests. Disable the upstream inspector, screenshot component and native session offer UI.
- **Tooling:** pnpm 11.12.0 replaces npm with one committed lockfile. A-Frame's exact Git-pinned font dependency is declared directly and removed from its subdependency path by a scoped override; pnpm's exotic-subdependency protection stays enabled. Prettier initially covers new XR/project UI modules, avoiding unrelated legacy formatting churn. CI runs lint/types/tests/build/browser checks.
- **Project management:** reuse the existing Drizzle tables and migrations. Create only in the authenticated user's personal workspace, atomically with creator membership and a database-backed ten-creations/hour limit. Strict JSON, 16 KiB bounds, trusted-origin checks and role authorization protect mutations.
- **Preview boundary:** private `/xr/[projectId]` resolves authorization before rendering project metadata. `/xr/preview` contains only original, explicitly unsaved public samples. No fixture auth, database fallback or fake save path is exposed.
- **VR behavior:** capability detection and explicit session requests control entry; immersive status requires an actual presenting XR session. The obsolete, unused `ENABLE_WEBXR` flag is removed because XR is a core capability of the new specification. Hardware acceptance stays open until a real headset is tested.
- **Phase boundary:** Phase 1 implements project metadata and a working scene. Scene manipulation/persistence is Phase 2; speech/AI/storage/review integration remains later work.

## Original M0 decisions (historical)

Recorded 2026-11-12, Asia/Kolkata.

- **Starting point:** only `Implementation_Prompt.md`; no existing app, Git history, lockfile or repository guidance. The original prompt is retained; its implementation specification is also saved as `BUILD_SPEC.md`.
- **Milestone boundary:** implement M0 and stop. Public recording feasibility and private read boundaries are useful independently; no placeholder buttons suggest stereo, speech, pairing, review or cloud saving works.
- **Runtime:** Next.js App Router/Node with React and strict TypeScript. npm is the sole package manager. Versions are checked against peer ranges and pinned; lockfile committed. Node 24 satisfies the selected Vitest and application runtimes. TypeScript 5.9 is a stable compatible compiler for this foundation.
- **UI:** Tailwind 4 and the checked-in shadcn/Radix Button pattern. A focused indigo workspace surrounds a textile illustration. Fonts use the operating system to avoid a build-time font service dependency. No dashboard metrics are invented.
- **Identity/data:** Clerk subjects are text; application resources are UUIDs. Neon + Drizzle is the single selected live database. A local embedded PostgreSQL engine runs integration tests only, never serves as a live auth fallback. Server repositories enforce resource membership, independent of proxy/UI checks.
- **Cloud adapters:** define validated contracts and explicit unavailable states in M0. No Sarvam/Gemini/storage API request is claimed. Provider SDKs and model IDs will be added at the milestone where actual operations are verified. Private R2 remains the selected storage interface; no second storage provider.
- **Capture:** a fixed monoscopic portrait Three.js scene is recorded directly with browser MediaRecorder and microphone audio. No headset/head-pose/stereo rendering is part of this experiment. M1/M4 must measure the additional render load and use independent recording/view cameras before full studio capture is accepted.
- **Privacy:** consent precedes microphone access. Local narration stays in browser memory until user download; no provider upload, persistence or retained transcript exists. Leaving/backgrounding during capture is an interruption, not a successful cloud save. A future command-audio consent flow must disclose actual provider transmission separately.
- **Persistence boundary:** only a configured, authorized server database path stores project data. Local video is explicitly unsaved. M4 will add private uploads and immutable content version creation.
- **Media honesty:** downloads use the actual recorder MIME/extension; WebM is not renamed MP4. The encoded draft watermark is part of the pixels and cannot disappear through a UI approval badge. The textile is a procedural 2.5D illustration, not a reconstructed physical product or accurate photo relighting.
- **Deployment:** repository is prepared for a Node-compatible Vercel deployment; no account/project is selected or deployed in this local initialization. Physical phone testing requires HTTPS and remains a separate evidence gate.
