# Integrations and assets

Reviewed 2026-11-12. Versions below are installed/pinned; `pnpm-lock.yaml` is the complete inventory. An interface or key presence does not establish a working integration.

| Dependency | Version | Use and evidence |
| --- | --- | --- |
| Next.js | 16.4.6 | App Router, Route Handlers, client-only loading, proxy |
| React / React DOM | 19.2.9 | Within Next and Clerk peer ranges |
| TypeScript | 5.9.3 | Strict build/type checks |
| Tailwind CSS | 4.3.5 | Normal web layout and design tokens |
| shadcn/Radix Slot | 1.5.0 (Slot) | Checked-in adapted Button with CVA; no hosted shadcn service |
| Three.js / types | 0.187.0 | Direct WebGLRenderer; local portrait experiment |
| A-Frame | 1.8.0 | Local UMD in disposable iframe; real desktop XR scene |
| A-Frame engine | super-three 0.184.0 | A-Frame's own pinned Three fork; never mixed with recorder objects |
| pnpm / Prettier | 11.12.0 / 3.10.1 | Single lockfile, scoped formatting and CI |
| Clerk Next.js | 7.9.25 | Real server identity boundary; live login unconfigured |
| Neon serverless | 1.2.0 | Server DB connector; live Neon unconfigured |
| Drizzle ORM / Kit | 0.45.4 / 0.31.11 | Typed tables, checked-in SQL, migration CLI |
| Zod | 4.6.7 | Strict shared input and provider contracts |
| Vitest | 5.1.0 | Behavior and PostgreSQL integration tests |
| Playwright | 1.65.0 | Chromium web flow/real recording with synthetic microphone |
| PGlite | 0.5.16 | Test-only PostgreSQL engine; not an alternate deployed database |
| AWS S3 SDK | 3.1165.0 | Bounded private R2 reads for authorized XR previews |
| esbuild | 0.28.2 | Test-only component harness bundling; no deployed auth fixture |

## Provider state

Clerk, Neon, R2, Sarvam and Gemini need credentials/account configuration; remote operation remains unverified in this environment. Project/layout reads and mutations use real Clerk/Drizzle paths. XR adds bounded R2 reads, Gemini structured responses, Sarvam transcription and speech synthesis through server-only adapters. Assistant readiness describes configuration, not verified remote success. Missing services return explicit unavailable states; local demo mode offers a clearly labeled text-only assistant and never substitutes for authentication. The original M0 adapter registry remains a historical contract boundary. Shotstack, background removal, uploads and full professional editing remain deferred. WebXR uses capability detection; actual headset/controller behavior remains physically unverified. See [XR integration details](xr/ai-integration.md).

A-Frame's manifest pins `three-bmfont-text` to Git commit `c3eec235b9188aa0d8ed949101236e6d5fccf071`. The identical pin is a direct dependency with a scoped override removing the exotic subdependency, preserving pnpm's default protection. The pinned UMD already contains the font implementation; our scene text uses local canvas textures. `scripts/prepare-xr.mjs` validates the A-Frame version and copies the bundle plus MIT license to the served vendor directory.

## Official references checked

- [Next.js installation and requirements](https://nextjs.org/docs/app/getting-started/installation), [client-only dynamic loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Clerk Route Handlers](https://clerk.com/docs/reference/nextjs/app-router/route-handlers), [Clerk proxy helper](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Tailwind 4 with shadcn](https://ui.shadcn.com/docs/tailwind-v4), [Radix Button](https://ui.shadcn.com/docs/components/radix/button)
- [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [A-Frame scene](https://aframe.io/docs/1.8.0/core/scene.html), [WebXR component](https://aframe.io/docs/1.8.0/components/webxr.html), [A-Frame 1.8.0 source](https://github.com/aframevr/aframe/tree/v1.8.0)
- [WebXR requestSession](https://developer.mozilla.org/en-US/docs/Web/API/XRSystem/requestSession), [pnpm settings](https://pnpm.io/settings)
- [Canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream), [MediaRecorder supported types](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static), [final data/stop ordering](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop_event)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [Drizzle Neon connection](https://orm.drizzle.team/docs/connect-neon)
- [Gemini structured generateContent](https://aistudio.google.com/api-reference/generate-content/generate-content), [Sarvam transcription](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe), [Sarvam text-to-speech](https://docs.sarvam.ai/api-reference/text-to-speech/convert)
- [Cloudflare R2 S3 access](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Vercel request and streaming response limits](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions)

The npm registry peer declarations were checked for Next/React/Clerk and engine requirements before pinning. Official API examples and the installed package types are used together; later adapter implementations must recheck their current provider contracts. Runtime validation and test evidence are in `IMPLEMENTATION_STATUS.md`.

## Asset/license inventory

- Textile preview and procedural canvas textile: original illustrative geometry/CSS/canvas code created for this repository; no downloaded product imagery. Fictional Ilkal sample, no certifications/discount claims. Not a photograph of a real sale item.
- Brand icon: original SVG in `src/app/icon.svg`.
- XR room, sample panels and canvas typography: original procedural assets; no external fonts, photos or controller models.
- Bundled `public/studio/campaign-studies.png` is used as an explicitly labeled illustrative study in the dashboard and local creative canvas, never as saved private project content.
- A-Frame: MIT licensed; its license is copied alongside the served local bundle. Preserve dependency license notices when distributing the app.
- UI icons: `lucide-react`, ISC licensed.
- Checked-in Button pattern: adapted from shadcn/ui, MIT licensed; attribution retained in `THIRD_PARTY_NOTICES.md`.
- Three.js, React, Next.js, Tailwind and Radix packages are distributed under their package licenses. Dependency license files remain in installed packages.
- No third-party models, VAD assets, cached voice clips or background-removal weights ship in M0. VAD asset/runtime version matching and vendor licensing are gates for their later installation.

## Hosting/phone limits

The recording lab requires WebGL2, a secure context, canvas capture and a supported MediaRecorder MIME. A supported MIME query can still fail at runtime; those errors remain visible. Browser automation proves encoded local media in a desktop test browser, not Android codecs, heat, stereo comfort, real microphone quality or a second device's playback. XR speech requests are capped at 4 MiB, synthesized audio at 2 MiB and streamed private previews at 20 MiB. Deployment/proxy limits and real R2 credentials still need acceptance testing. Browsers access media through the same-origin server endpoint, not direct R2 URLs.
