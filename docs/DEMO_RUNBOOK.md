# BoloVerse device runbook

## XR Phase 1 desktop acceptance

1. Use Node 24+ and pnpm 11.12.0. Run `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, then `pnpm dev`.
2. Open `http://localhost:3000/xr/preview`. Confirm **Desktop preview**, a rendered room and sample panels. This public sample is unsaved and needs no credentials.
3. Drag inside the canvas, then focus it and use W/A/S/D. Tab back to the companion controls; typing there must not move the camera. Try **Reset view**, **Seated**, **Standing**, and each **Inspect** button. The inspector and selected scene panel should agree.
4. On a desktop without a headset, **Enter VR** is disabled with an explanation. The 3D preview remains usable. Optional runtime statistics are measured locally, not performance guarantees.
5. Navigate Home and reopen the preview. Check one canvas, no stale input handlers or console errors. Open the recording lab and repeat its five-second capture acceptance below.
6. For private projects, follow README Clerk/Neon setup, use the exact configured origin, sign in and visit `/app/projects`. Create a project, reload its details, edit the objective and launch **Open XR studio**. Test an assigned client cannot edit and an unrelated account cannot read the project. Local SQL tests do not substitute for this live identity check.

## Headset acceptance — physically unverified

1. Deploy to a chosen HTTPS preview and open `/xr/preview` in a supported headset browser. Record the headset model, browser/OS versions and URL origin. Do not mark this complete from a desktop capability stub.
2. Confirm **Enter VR** enables only when immersive VR is supported. Click it, grant the browser request and verify stereoscopic head-tracked rendering. Rejected permission must return a visible error and leave the desktop scene usable.
3. Use left/right controller rays to select sample panels. Confirm local text is readable, selection updates, and no remote models are fetched. Compare **Seated** and **Standing** comfort; stop if uncomfortable.
4. Select the spatial **Exit VR** panel or headset system exit. Verify return to desktop, then enter again. Test disconnect/reconnect, route change and refresh while a session is active. There must be no continuing session or render loop after leaving.
5. Enable runtime stats and record observed FPS/draw calls/triangles during a real session; record judder, heat, battery and readability over time. No physical performance result is supplied by this implementation.

Scene movement/selection is temporary in Phase 1. Saved scene state is Phase 2; no save button or recovery is promised.

## M0: local capture acceptance

This sequence tests the implemented M0 only. It does not claim the later two-phone workflow is available.

1. On the development machine, run `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, and run `pnpm dev`. In desktop Chrome open `http://localhost:3000/studio/feasibility`. Provider secrets can remain blank.
2. Check the capability/readiness panel. The scene is a fixed **mono** portrait preview. No stereoscopy, head tracking, STT/TTS or paired phone is active.
3. Read the local narration disclosure, then select **I agree to record my microphone locally**. No microphone is requested before this action and recording is started.
4. Select **Record 5-second test**. Grant the browser microphone permission. Speak a short sentence and let the timer stop the take.
5. Confirm the result reads **Local recording ready — not saved**. Play the video and listen for your actual narration. Check reported width/height, MIME, byte size and elapsed time to readiness (including encoder finalization). Target FPS is not a measured sustained encoding/render FPS; track-level audio settings are not shown in this lab.
6. Download the take. Confirm the extension matches the MIME (normally WebM on Chromium), playback works and the draft watermark is visible. This watermark is encoded into pixels; future approval cannot remove it from this file.
7. Repeat with **Record 15-second test**. Test manual stop, deny microphone permission once, start another take, and leave/background the page during capture. Each interruption should show a recoverable error and release media resources; it must not claim a saved output. A finished local take is lost on reload/navigation unless downloaded. In-app links ask before discarding; browser Back/Forward may bypass that confirmation. Download first.
8. For **Android**, deploy the same code to an HTTPS preview. In Android Chrome open `https://<your-preview-host>/studio/feasibility`; do not use an HTTP development-machine LAN IP. Repeat steps 2–7 in portrait and landscape, with and without earphones. Keep the phone outside the headset for this milestone.
9. Play the downloaded file on the same phone and transfer that file manually to a second phone to check codec/audio playback. This transfer is not the future scoped watch-link feature.
10. Record the actual phone model, Android version, Chrome version, permission outcome, actual MIME/dimensions/duration, whether narration is audible, background-interruption result, observed failures and heat. Leave results **unverified** until someone performs these steps on real hardware.

Optional: Chrome menu → **Add to home screen**, if offered. The manifest supplies icons and standalone/landscape hints. There is no service worker or offline private-data cache; installation does not grant microphone/fullscreen/motion permissions.

## Recovery

| Symptom | Action |
| --- | --- |
| Insecure context / microphone unavailable | Use localhost on the same computer or an HTTPS preview on Android |
| Microphone denied | Change site microphone permission in Chrome, return to the visible page, retry |
| WebGL2/canvas capture/MediaRecorder unavailable | Try current Chrome with hardware acceleration; record the unsupported capability |
| Recorder constructor/start/encoding error | Retry a short take, close competing camera/mic apps, record the exact error |
| Page backgrounded or microphone lost | Return to the foreground and start a new take; the interrupted take is not accepted |
| Local recording ready | Play and download before leaving; no cloud recovery or reload persistence exists |
| Private project API 503 | Configure Clerk/Neon and run migrations; do not add a bypass token |
| Private project API 401/403 | Sign in with the assigned account; an arbitrary project UUID provides no access |

## Optional fictional development seed

Configure Clerk/Neon and apply migrations first. Obtain the real development user's Clerk subject ID from Clerk, then run:

```sh
pnpm db:seed user_your_real_clerk_subject
```

The seed verifies that the account exists with Clerk before database writes. Use a development database. It creates an idempotent fictional Ilkal campaign and linked draft artifacts; no client approval is fabricated. Facts are silk-cotton blend and handwoven in Ilkal; prohibited claims are pure silk and machine washable. This seed is not a login, a public API or a substitute for a real client assignment workflow. Live seed execution remains unverified without credentials.

## Original two-phone sequence (historical, not active)

- M1: Phone A preflight, consent, motion/recenter and landscape stereo inside the headset.
- M2: Real Sarvam/Gemini commands and spoken idea generation with language fixtures.
- M3: Atomic QR pairing; Phone B captures/uploads privately; Phone A renders the verified asset; unrelated sessions are denied.
- M4: Independent portrait recording, immutable private output, scoped watch link and second-phone playback.
- M5: Actual narration brand check against approved brief; assigned client comments/decision bound to the exact output version.
- M6: Reconnect/expiry/provider failure tests and a measured twenty-minute physical-device session.

The newer `XR_IMPLEMENTATION_SPEC.md` now governs the phase sequence. `BUILD_SPEC.md` retains the original two-phone proposal for reference. No link, approval or provider result should be invented to complete this runbook.
