# Browser and device support

The app probes capabilities rather than identifying devices from user-agent strings. `detectCapabilities` and `useXRCapabilities` check secure context, WebGL2, WebXR, `immersive-vr`, `immersive-ar`, pointer/touch and microphone API availability. Rejected support promises are handled independently. Detection does not request microphone permission or start an XR session.

## Experience and evidence

| Target                        | Intended experience                                                | Current evidence                                                 |
| ----------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Desktop Chrome/Chromium       | Interactive 3D, keyboard/pointer controls, protected project tools | Automated Chromium canvas/UI flows; API fixtures where indicated |
| Desktop Edge and macOS Safari | Desktop 3D when WebGL2 is available                                | Not browser-verified in this implementation run                  |
| Meta Quest Browser            | Desktop view plus capability-gated immersive VR                    | No physical headset verification                                 |
| Apple Vision Pro Safari       | Browser 3D and whatever WebXR features the browser exposes         | No physical headset verification; no native visionOS app         |
| Mobile browsers               | Responsive companion controls and touch-capable 3D                 | No physical mobile-browser verification                          |

Immersive entry requires a secure context, a positive support probe and an explicit user gesture. The implemented VR path requests a `local-floor` reference space; a browser can report general VR support and still reject that session or permission request. A failure returns an actionable message while preserving the desktop layout. These checks follow the capability/session model of the [WebXR Device API](https://www.w3.org/TR/webxr/).

AR support is detected and reported, but no AR scene is configured and no AR entry is exposed. Hand tracking is not required or implemented. Do not interpret a capability badge or simulated session test as proof of hardware compatibility.

## Fallbacks

Without immersive XR, the desktop 3D workspace remains available. Without WebGL2, the navigator, inspector and standard project tools remain accessible. Microphone absence or denial leaves text input available when the text provider is configured. Codec support and media decoding can differ by browser; preview failures offer the standard asset route.

Use HTTPS on a phone or headset. A desktop's HTTP LAN address is not equivalent to browser localhost. The manifest supplies installation hints only: there is no service worker or offline storage of private content/audio.

## Physical verification still required

On each actual target device, check session permission/rejection, entry and exit, headset disconnect, controller rays/trigger selection, spatial transform controls, seated and standing recentering, readable text, comfort and frame performance. Also test real microphone permission, recording stop/cleanup and audio playback. Record browser/device versions and observed results in [implementation status](../IMPLEMENTATION_STATUS.md); do not infer them from desktop tests.
