# M0 integrations and assets

Reviewed 2026-11-12. Versions below are installed/pinned; `package-lock.json` is the complete inventory. An interface or key presence does not establish a working integration.

| Dependency | Version | M0 use and evidence |
| --- | --- | --- |
| Next.js | 16.4.6 | App Router, Route Handlers, client-only loading, proxy |
| React / React DOM | 19.2.9 | Within Next and Clerk peer ranges |
| TypeScript | 5.9.3 | Strict build/type checks |
| Tailwind CSS | 4.3.5 | Normal web layout and design tokens |
| shadcn/Radix Slot | 1.5.0 (Slot) | Checked-in adapted Button with CVA; no hosted shadcn service |
| Three.js / types | 0.187.0 | Direct WebGLRenderer; local portrait experiment |
| Clerk Next.js | 7.9.25 | Real server identity boundary; live login unconfigured |
| Neon serverless | 1.2.0 | Server DB connector; live Neon unconfigured |
| Drizzle ORM / Kit | 0.45.4 / 0.31.11 | Typed tables, checked-in SQL, migration CLI |
| Zod | 4.6.7 | Strict shared input and provider contracts |
| Vitest | 5.1.0 | Behavior and PostgreSQL integration tests |
| Playwright | 1.65.0 | Chromium web flow/real recording with synthetic microphone |
| PGlite | 0.5.16 | Test-only PostgreSQL engine; not an alternate deployed database |

## Provider state

Clerk, Neon, R2, Sarvam and Gemini need credentials/account configuration. Live STT, TTS, interpretation, storage and external editing are not implemented in M0. Configured key presence is labeled **configured-unverified**, never **ready**. Missing/disabled adapters fail with structured errors. No command/audio upload endpoint or live evaluation runner is exposed yet. Sarvam models/speakers and a Gemini model are deliberately unset until verified against the installed integration and an actual request in M2. Shotstack, background removal and WebXR remain disabled/deferred.

## Official references checked

- [Next.js installation and requirements](https://nextjs.org/docs/app/getting-started/installation), [client-only dynamic loading](https://nextjs.org/docs/app/guides/lazy-loading)
- [Clerk Route Handlers](https://clerk.com/docs/reference/nextjs/app-router/route-handlers), [Clerk proxy helper](https://clerk.com/docs/reference/nextjs/clerk-middleware)
- [Tailwind 4 with shadcn](https://ui.shadcn.com/docs/tailwind-v4), [Radix Button](https://ui.shadcn.com/docs/components/radix/button)
- [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream), [MediaRecorder supported types](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static), [final data/stop ordering](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/stop_event)
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver), [Drizzle Neon connection](https://orm.drizzle.team/docs/connect-neon)

The npm registry peer declarations were checked for Next/React/Clerk and engine requirements before pinning. Official API examples and the installed package types are used together; later adapter implementations must recheck their current provider contracts. Runtime validation and test evidence are in `IMPLEMENTATION_STATUS.md`.

## Asset/license inventory

- Textile preview and procedural canvas textile: original illustrative geometry/CSS/canvas code created for this repository; no downloaded product imagery. Fictional Ilkal sample, no certifications/discount claims. Not a photograph of a real sale item.
- Brand icon: original SVG in `src/app/icon.svg`.
- UI icons: `lucide-react`, ISC licensed.
- Checked-in Button pattern: adapted from shadcn/ui, MIT licensed; attribution retained in `THIRD_PARTY_NOTICES.md`.
- Three.js, React, Next.js, Tailwind and Radix packages are distributed under their package licenses. Dependency license files remain in installed packages.
- No third-party models, VAD assets, cached voice clips or background-removal weights ship in M0. VAD asset/runtime version matching and vendor licensing are gates for their later installation.

## Hosting/phone limits

WebGL2, a secure context, canvas capture and a supported MediaRecorder MIME are required. A supported MIME query can still fail at recorder construction/start/runtime; those errors must remain visible. Browser automation proves encoded local media in a desktop test browser, not Android codecs, gyroscope axes, phone heat, stereo comfort, real microphone quality or a second device's playback. Output upload/body limits and R2 CORS are not yet exercised.
