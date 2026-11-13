import { getServerEnv } from "../apps/web/src/server/config/env";
import { createXRSpeechProvider } from "../apps/web/src/server/providers/xr-speech";
import { readBoundedBytes } from "../apps/web/src/server/providers/xr-http";

// Explicit operator-only smoke test. No env-file loading, user audio, DB writes,
// stored media, public route or automatic retry. Run only when requested.
async function main() {
  const env = getServerEnv();
  const statuses: { provider: string; status: number }[] = [];
  const observedFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    const host = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).hostname;
    statuses.push({ provider: host === "api.sarvam.ai" ? "sarvam" : "gemini", status: response.status });
    return response;
  };
  const speech = createXRSpeechProvider(env, observedFetch);
  const checks: Record<string, boolean> = {};
  try {
    const output = await speech.tts.synthesize({ text: "Hello. Shape Studio is ready for your creative ideas.", language: "en-IN", signal: AbortSignal.timeout(30000) });
    checks.textToSpeech = output.audio.byteLength > 44;
    const transcript = await speech.stt.transcribe({ audio: output.audio, mimeType: output.mimeType, language: "en-IN", signal: AbortSignal.timeout(30000) });
    checks.speechToText = transcript.text.trim().length > 0;
  } catch { checks.speechRoundtrip = false; }
  try {
    if (!env.GEMINI_API_KEY || !env.GEMINI_MODEL || !/^[a-zA-Z0-9._-]{1,100}$/.test(env.GEMINI_MODEL)) throw new Error("Missing configuration");
    const response = await observedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`, {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(30000),
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word Ready." }] }], generationConfig: { maxOutputTokens: 64 } }),
    });
    if (!response.ok) { await response.body?.cancel(); throw new Error("Rejected"); }
    const body = JSON.parse(new TextDecoder().decode(await readBoundedBytes(response, 65536))) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    checks.assistant = !!body.candidates?.some(c => c.content?.parts?.some(p => p.text?.trim()));
  } catch { checks.assistant = false; }
  // Only public model names, booleans and HTTP status codes may enter build logs.
  console.log("LIVE_PROVIDER_CHECK " + JSON.stringify({ checks, statuses, sttModel: env.SARVAM_STT_MODEL, ttsModel: env.SARVAM_TTS_MODEL, assistantModel: env.GEMINI_MODEL }));
}
main().catch(() => { console.log('LIVE_PROVIDER_CHECK {"setup":false}'); });
