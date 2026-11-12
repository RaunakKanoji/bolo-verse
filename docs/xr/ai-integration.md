# XR assistant and speech

The XR assistant has implemented server-side Gemini text and Sarvam STT/TTS adapters. They have bounded mocked-network and SQL-boundary tests; no configured-account live success is claimed. A readiness value of `live` means the configured network adapter is selected, not that a provider request has been verified.

The assistant and microphone controls are in the accessible React companion UI. A headset-native assistant panel/keyboard is not implemented; validate the desktop speech flow and physical XR separately.

## Configuration and provider requests

| Capability           | Required environment                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Gemini text          | `GEMINI_API_KEY`, `GEMINI_MODEL`                                                                                |
| Sarvam transcription | `SARVAM_API_KEY`, `SARVAM_STT_MODEL`                                                                            |
| Sarvam speech output | `SARVAM_API_KEY`, `SARVAM_TTS_MODEL`, `SARVAM_TTS_SPEAKER_EN`, `SARVAM_TTS_SPEAKER_HI`, `SARVAM_TTS_SPEAKER_KN` |

Choose model and speaker IDs from current provider documentation; there are no invented default IDs. The Gemini adapter calls `generateContent` with a structured JSON response schema and a 2,048 output-token limit. It accepts a complete, valid bounded reply rather than executing model-generated code. See the official [Gemini generateContent reference](https://aistudio.google.com/api-reference/generate-content/generate-content).

The Sarvam adapter uses multipart `/speech-to-text` and JSON `/text-to-speech`, with `language_code`, explicitly selected models/speakers and WAV speech output. Accepted STT model families are `saaras:v3`/`saaras:v4`; TTS families are `bulbul:v2`, `bulbul:v3` and `bulbul:v4-flash`. Speaker compatibility still needs a live check for the chosen model. Request fields follow the official [transcription](https://docs.sarvam.ai/api-reference/speech-to-text/transcribe) and [speech synthesis](https://docs.sarvam.ai/api-reference/text-to-speech/convert) references.

Provider hosts are fixed, credentials remain server-only, redirects are rejected and requests have a 25-second timeout with bounded responses. Provider failures produce sanitized errors. No automatic retry loop consumes repeated requests.

## Authorized context and proposals

`GET /api/xr/assistant/:projectId` reports text/STT/TTS readiness. `POST` accepts strict `{message, language}` with up to 2,000 message characters. Supported language codes are `en-IN`, `hi-IN` and `kn-IN`. The response contains a narrative of at most 6,000 characters, at most four commands and an explicit mode.

The server resolves Clerk identity, requires edit access to the project and constructs context from the authorized workspace: bounded project/brief/artifact/review text plus eligible panel and asset IDs. It sends no storage credentials or object keys. Access is checked again after provider latency. Assigned read-only clients do not have assistant access in this implementation.

| Command           | Allowed reference/action                                               |
| ----------------- | ---------------------------------------------------------------------- |
| `OPEN_ASSET`      | An authorized project asset UUID                                       |
| `FOCUS_PANEL`     | A panel ID in the authorized catalog                                   |
| `RESET_WORKSPACE` | A proposed reset requiring visible client confirmation                 |
| `GENERATE_IDEAS`  | The current authorized project UUID; another bounded assistant request |

The server validates both shape and reference membership; the client parses the command again. Returned actions are proposals presented as controls, not unrestricted JavaScript, SQL or browser automation. Replies and suggestions are not automatically persisted as approved artifacts.

Text, transcription and speech generation share an atomic PostgreSQL budget of **20 requests per account per hour**. A voice question generally consumes two calls (STT and text), with optional TTS consuming another. Missing configuration does not pretend to succeed; unavailable services return explicit configuration errors.

## Microphone and playback

Voice starts only after the user sees the consent disclosure and activates recording. The client owns one microphone stream, records at most 20 seconds and enforces a **4 MiB** cap. `POST /api/xr/assistant/:projectId/transcribe` requires the consent header `X-Speech-Consent: xr-voice-v1`, a supported audio MIME type and `X-Speech-Language`. The server bounds the raw body and checks container signatures; it does not independently decode the recording duration.

The application sends audio to Sarvam and the returned text with project context to Gemini. It does not durably store command audio or transcripts. Provider-side handling is governed by the configured provider account/policies. Cancellation, page hiding, project changes and unmount release tracks, listeners, timers and pending requests, including a microphone permission prompt that resolves late.

Optional **Prepare spoken reply** posts at most 1,500 characters to `/api/xr/assistant/:projectId/speak`. The server validates a bounded base64 WAV response (at most 2 MiB decoded); the UI provides native audio controls for a separate playback gesture. It does not automatically play assistant audio. Blob URLs are revoked when replaced or discarded, and decode failures are visible.

## Local development example

With missing Gemini configuration, `APP_MODE=demo` during local `pnpm dev` selects a separate deterministic development mock. The guard requires a nonproduction runtime and no Vercel deployment markers; tests can exercise the same class. The UI and reply explicitly label the example, and it returns no commands. Configured Gemini still uses the network adapter.

This mock supplies neither fake identity nor fake project/database data: real Clerk authorization and Neon access remain required. There is no mock STT/TTS. Production and Vercel must use `APP_MODE=live`. The public preview does not expose the assistant.
