import "server-only";
import { z } from "zod";
import { LanguageSchema } from "@/lib/contracts";
import { XRSpeakRequestSchema } from "@/lib/contracts/xr-assistant";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv, type ServerEnv } from "@/server/config/env";
import { isAudioContainer } from "@/server/xr-assistant/audio";
import type { SpeechToTextAdapter, TextToSpeechAdapter } from "./interfaces";
import { hasSarvamSTT, hasSarvamTTS } from "./xr-assistant";
import { providerJson, type ProviderFetch } from "./xr-http";

export function createXRSpeechProvider(
  env: ServerEnv = getServerEnv(),
  fetcher: ProviderFetch = fetch,
): { stt: SpeechToTextAdapter; tts: TextToSpeechAdapter } {
  return {
    stt: {
      async transcribe({ audio, mimeType, language, signal }) {
        if (!hasSarvamSTT(env))
          throw new BoundaryError(
            503,
            "PROVIDER_UNCONFIGURED",
            "Sarvam speech recognition is not configured.",
          );
        if (!isAudioContainer(audio, mimeType))
          throw new BoundaryError(400, "INVALID_INPUT", "Use a supported audio recording.");
        const started = performance.now();
        const body = new FormData();
        const extension = mimeType.split("/")[1];
        body.set(
          "file",
          new Blob([new Uint8Array(audio).buffer], { type: mimeType }),
          `voice.${extension}`,
        );
        body.set("model", env.SARVAM_STT_MODEL!);
        body.set("language_code", language);
        body.set("mode", "transcribe");
        const result = await providerJson(fetcher, "https://api.sarvam.ai/speech-to-text", {
          method: "POST",
          headers: { "api-subscription-key": env.SARVAM_API_KEY! },
          body,
          signal,
        });
        const parsed = z
          .object({
            transcript: z.string().trim().min(1).max(2000),
            language_code: LanguageSchema.nullable(),
          })
          .safeParse(result);
        if (!parsed.success)
          throw new BoundaryError(
            503,
            "SERVICE_UNAVAILABLE",
            "Speech recognition did not return a supported transcript. Try a shorter recording.",
          );
        return {
          text: parsed.data.transcript,
          language: parsed.data.language_code ?? language,
          durationMs: Math.round(performance.now() - started),
        };
      },
    },
    tts: {
      async synthesize(input) {
        if (!hasSarvamTTS(env))
          throw new BoundaryError(
            503,
            "PROVIDER_UNCONFIGURED",
            "Sarvam speech playback is not configured.",
          );
        const { text, language } = XRSpeakRequestSchema.parse({
          text: input.text,
          language: input.language,
        });
        const speakers = {
          "en-IN": env.SARVAM_TTS_SPEAKER_EN,
          "hi-IN": env.SARVAM_TTS_SPEAKER_HI,
          "kn-IN": env.SARVAM_TTS_SPEAKER_KN,
        };
        const result = await providerJson(
          fetcher,
          "https://api.sarvam.ai/text-to-speech",
          {
            method: "POST",
            signal: input.signal,
            headers: {
              "Content-Type": "application/json",
              "api-subscription-key": env.SARVAM_API_KEY!,
            },
            body: JSON.stringify({
              text,
              language_code: language,
              model: env.SARVAM_TTS_MODEL,
              speaker: speakers[language],
              output_audio_codec: "wav",
              speech_sample_rate: 22050,
            }),
          },
          3 * 1024 * 1024,
        );
        const parsed = z
          .object({
            audios: z
              .array(
                z
                  .string()
                  .min(16)
                  .max(2_800_000)
                  .regex(/^[A-Za-z0-9+/]+={0,2}$/),
              )
              .length(1),
          })
          .safeParse(result);
        if (!parsed.success)
          throw new BoundaryError(
            503,
            "SERVICE_UNAVAILABLE",
            "Speech playback did not return valid audio.",
          );
        const audio = new Uint8Array(Buffer.from(parsed.data.audios[0], "base64"));
        if (audio.byteLength > 2 * 1024 * 1024 || !isAudioContainer(audio, "audio/wav"))
          throw new BoundaryError(
            503,
            "SERVICE_UNAVAILABLE",
            "Speech playback did not return a supported WAV recording.",
          );
        return { audio, mimeType: "audio/wav" };
      },
    },
  };
}
