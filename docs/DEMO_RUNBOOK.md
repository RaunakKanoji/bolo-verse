# BoloVerse device runbook

## M0: local capture acceptance

This sequence tests the implemented M0 only. It does not claim the later two-phone workflow is available.

1. On the development machine, run `npm ci`, copy `.env.example` to `.env.local`, and run `npm run dev`. In desktop Chrome open `http://localhost:3000/studio/feasibility`. Provider secrets can remain blank.
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
npm run db:seed -- user_your_real_clerk_subject
```

The seed verifies that the account exists with Clerk before database writes. Use a development database. It creates an idempotent fictional Ilkal campaign and linked draft artifacts; no client approval is fabricated. Facts are silk-cotton blend and handwoven in Ilkal; prohibited claims are pure silk and machine washable. This seed is not a login, a public API or a substitute for a real client assignment workflow. Live seed execution remains unverified without credentials.

## Later two-phone sequence (not active in M0)

- M1: Phone A preflight, consent, motion/recenter and landscape stereo inside the headset.
- M2: Real Sarvam/Gemini commands and spoken idea generation with language fixtures.
- M3: Atomic QR pairing; Phone B captures/uploads privately; Phone A renders the verified asset; unrelated sessions are denied.
- M4: Independent portrait recording, immutable private output, scoped watch link and second-phone playback.
- M5: Actual narration brand check against approved brief; assigned client comments/decision bound to the exact output version.
- M6: Reconnect/expiry/provider failure tests and a measured twenty-minute physical-device session.

See `BUILD_SPEC.md` for the full acceptance sequence. No link, approval or provider result should be invented to complete this runbook.
