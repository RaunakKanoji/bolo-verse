import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseServerEnv } from "@/server/config/env";
import { createXRSpeechProvider } from "@/server/providers/xr-speech";
import { readSpeechAudio } from "@/server/xr-assistant/audio";

const env = parseServerEnv({
  SARVAM_API_KEY: "private-key",
  SARVAM_STT_MODEL: "saaras:v4",
  SARVAM_TTS_MODEL: "bulbul:v4-flash",
  SARVAM_TTS_SPEAKER_EN: "configured_en_voice",
  SARVAM_TTS_SPEAKER_HI: "configured_hi_voice",
  SARVAM_TTS_SPEAKER_KN: "configured_kn_voice",
});
const wav = Uint8Array.from([
  82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69, 102, 109, 116, 32, 16, 0, 0, 0,
]);
const audioRequest = (
  bytes: Uint8Array = wav,
  contentType = "audio/wav",
  extra: Record<string, string> = {},
) =>
  new Request("http://localhost/speech", {
    method: "POST",
    headers: { "Content-Type": contentType, "X-Speech-Consent": "xr-voice-v1", ...extra },
    body: new Uint8Array(bytes).buffer,
  });

describe("bounded speech inputs and outputs", () => {
  it("accepts a recognized audio container only after explicit consent", async () => {
    expect(await readSpeechAudio(audioRequest())).toEqual({ audio: wav, mimeType: "audio/wav" });
    await expect(
      readSpeechAudio(audioRequest(wav, "audio/wav", { "X-Speech-Consent": "" })),
    ).rejects.toMatchObject({ status: 400 });
    await expect(readSpeechAudio(audioRequest(wav, "text/html"))).rejects.toMatchObject({
      status: 415,
    });
    await expect(
      readSpeechAudio(audioRequest(new TextEncoder().encode("not really an audio file"))),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("rejects oversized declared and streamed bodies before provider access", async () => {
    await expect(
      readSpeechAudio(audioRequest(wav, "audio/wav", { "Content-Length": "4194305" })),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readSpeechAudio(audioRequest(new Uint8Array(4 * 1024 * 1024 + 1))),
    ).rejects.toMatchObject({ status: 413 });
  });
  it("uses Sarvam multipart transcription and validates returned language/text", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ transcript: "Show the brief", language_code: "en-IN" }));
    const result = await createXRSpeechProvider(env, fetcher).stt.transcribe({
      audio: wav,
      mimeType: "audio/wav",
      language: "en-IN",
    });
    expect(result).toMatchObject({ text: "Show the brief", language: "en-IN" });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.sarvam.ai/speech-to-text");
    expect(init.headers["api-subscription-key"]).toBe("private-key");
    expect(init.body.get("model")).toBe("saaras:v4");
    expect(init.body.get("language_code")).toBe("en-IN");
    expect(init.body.get("file")).toBeInstanceOf(File);
  });
  it("rejects empty and unsupported-language transcription results", async () => {
    for (const data of [
      { transcript: "", language_code: "en-IN" },
      { transcript: "Unrecognized locale", language_code: "xx-XX" },
    ]) {
      await expect(
        createXRSpeechProvider(env, vi.fn().mockResolvedValue(Response.json(data))).stt.transcribe({
          audio: wav,
          mimeType: "audio/wav",
          language: "en-IN",
        }),
      ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    }
  });
  it("requests and verifies actual WAV output using the configured speaker", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ audios: [Buffer.from(wav).toString("base64")] }));
    expect(
      await createXRSpeechProvider(env, fetcher).tts.synthesize({
        text: "Hello",
        language: "en-IN",
      }),
    ).toEqual({ audio: wav, mimeType: "audio/wav" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.sarvam.ai/text-to-speech");
    expect(JSON.parse(init.body)).toMatchObject({
      text: "Hello",
      language_code: "en-IN",
      speaker: "configured_en_voice",
      output_audio_codec: "wav",
    });
  });
  it("does not relabel arbitrary base64 or malformed data as playable audio", async () => {
    await expect(
      createXRSpeechProvider(
        env,
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ audios: [Buffer.from("<html>bad audio</html>").toString("base64")] }),
          ),
      ).tts.synthesize({ text: "Hello", language: "en-IN" }),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
  it("does not fake speech when the service is unconfigured", async () => {
    const speech = createXRSpeechProvider(parseServerEnv({ APP_MODE: "demo" }));
    await expect(
      speech.stt.transcribe({ audio: wav, mimeType: "audio/wav", language: "en-IN" }),
    ).rejects.toMatchObject({ code: "PROVIDER_UNCONFIGURED" });
    await expect(speech.tts.synthesize({ text: "Hello", language: "en-IN" })).rejects.toMatchObject(
      { code: "PROVIDER_UNCONFIGURED" },
    );
  });
  it("rejects synthesized WAV above 2 MiB, below the buffered deployment response limit", async () => {
    const oversized = new Uint8Array(2 * 1024 * 1024 + 1);
    oversized.set(wav);
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ audios: [Buffer.from(oversized).toString("base64")] }));
    await expect(
      createXRSpeechProvider(env, fetcher).tts.synthesize({ text: "Hello", language: "en-IN" }),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});
