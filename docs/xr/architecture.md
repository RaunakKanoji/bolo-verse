# XR architecture

The [browser studio brief](../XR_BROWSER_STUDIO_SPEC.md) supersedes the earlier foundation-only phase boundary. The implementation extends the existing Next.js App Router application, Clerk identity and Neon/Drizzle repositories; it does not introduce another project database or authentication system.

## Boundaries

| Layer                               | Responsibility                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| App Router pages                    | Authorize private projects on the server and load their workspace/content                      |
| `src/xr/XRWorkspaceClient.tsx`      | React navigator, inspector, save/conflict states, capability controls and assistant            |
| `src/xr/runtime/studio-adapter.ts`  | One A-Frame scene, selection, transforms, session lifecycle, previews and measured diagnostics |
| `src/lib/contracts/xr-workspace.ts` | Strict shared layout, snapshot and content contracts                                           |
| `src/server/db/xr-workspaces.ts`    | Authorized catalog reads and atomic versioned layout writes                                    |
| `src/server/providers/`             | Server-only R2 preview, Gemini text and Sarvam speech adapters                                 |

React loads the scene client-side. A disposable same-origin iframe owns A-Frame 1.8 and its custom-element registry, canvas, listeners and runtime resources. The local pinned UMD bundle is prepared by `pnpm dev`/`pnpm build`. Scene construction does not interpolate project content into HTML: panel text becomes canvas typography. The iframe has a restrictive resource policy and does not load remote scripts, fonts or controller models.

A-Frame owns the render loop and supplies `AFRAME.THREE`. The direct Three.js dependency belongs to the separate M0 recording lab; its constructors are not mixed into the XR scene. React document updates change existing objects rather than creating another scene. Teardown aborts requests, ends owned sessions, removes listeners, stops media, releases object URLs and disposes owned GPU resources. Late async results cannot revive a discarded scene.

## Project and asset flow

`/studio` links to `/studio/xr`; `/studio/xr/[projectId]` loads an authorized snapshot and content catalog. The legacy `/xr/[projectId]` route uses the same implementation and authorization. `/xr/preview` is an explicitly unsaved public sample. Private projects never fall back to it.

The project catalog supplies briefs, selected artifact versions, ready asset metadata and recorded review comments/decisions. Layout JSON stores references and transforms, not copied project text, credentials or storage URLs. The project-scoped `xr_workspaces` table is separate from the older session-specific `scene_state` document. See [workspace schema](workspace-schema.md) for concurrency and reset behavior.

The asset endpoint resolves an asset ID through project membership, reads private R2 bytes on the server and rechecks authorization/metadata before delivery. It validates bytes before streaming the response in chunks. The 20 MiB limit still bounds the file buffered for validation; streaming is not an unbounded storage relay. The browser uses temporary object URLs and on-demand previews. PDF assets remain document cards/downloads. Unsupported previews retain the standard-workspace action.

GLB/glTF support intentionally accepts a conservative self-contained static glTF 2.0 subset. External resources, extensions (including compressed decoders), animations, skins, morph targets and sparse accessors are rejected. Triangle geometry, references, node hierarchy and decoded allocation budgets are checked before the model parser. The exact limits live in `src/lib/contracts/xr-assets.ts`. This is preview validation, not a general-purpose model ingestion or upload service. R2 uses its S3-compatible API through the AWS SDK v3, following the [Cloudflare integration reference](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).

## Extension points and limits

The assistant is a concrete XR extension of the existing provider boundaries. Its server-authorized context and command vocabulary are described in [AI integration](ai-integration.md); older unrelated provider contracts remain unimplemented where documented.

A future React Three Fiber or SwiftUI/RealityKit renderer could consume the HTTP project/layout/asset contracts. A native visionOS client would still need supported Clerk token verification, native networking/session handling and appropriate authorization/origin integration; the present browser cookie flow is not a native client implementation. Native rendering, hand tracking, collaboration transport, AR placement and professional asset editing are future work.

The original `/studio/feasibility` recorder remains isolated and records a mono portrait canvas, never the stereo XR display. No XR recording/export pipeline is claimed.

## Creative application shell and image canvas

The reference-led interface adds `src/features/workspace/StudioShell.tsx`, `StudioDashboard.tsx`, and `DashboardPage.tsx`. `/` and `/studio` load the same server-authorized project list and project search. Connection failures remain explicit; the public dashboard never impersonates a user. The three campaign studies are original generated illustration assets in `public/studio/campaign-studies.png`, labeled as examples rather than live campaigns. Dashboard counts use authorized projects only; deadlines, progress percentages and approvals are not invented.

`/studio/create` is a public local image canvas. The existing authorized `/app/projects/[projectId]/assets/[assetId]` route uses the same canvas for PNG/JPEG/WebP assets only after membership and project/asset matching checks. Brightness, contrast, saturation, softness, presets, comparison and PNG export run locally. Edits do not mutate the source or claim database persistence. Local files remain in the browser; decoded dimensions, MIME types and byte size are bounded. Object URLs are released on replacement/unmount. Other media continue through the existing protected viewer and spatial previews.

Image generation, advanced media editing and saved image edit documents are not implemented. The image screen links to the existing project assistant for brainstorming; this does not claim an image-generation service. The browser UI keeps BoloVerse branding while using the provided references' translucent lavender surfaces.
