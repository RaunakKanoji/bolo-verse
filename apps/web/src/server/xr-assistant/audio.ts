import "server-only";
import { BoundaryError } from "@/server/auth/errors";
import { XR_SPEECH_MAX_BYTES } from "@/lib/contracts/xr-assistant";

export const MAX_SPEECH_BYTES = XR_SPEECH_MAX_BYTES;
const formats = ["audio/webm", "audio/wav", "audio/ogg", "audio/mp4"];
export function isAudioContainer(bytes: Uint8Array, mimeType: string): boolean {
  const ascii = (offset: number, text: string) =>
    [...text].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
  if (bytes.length < 12) return false;
  if (mimeType === "audio/wav") return ascii(0, "RIFF") && ascii(8, "WAVE");
  if (mimeType === "audio/ogg") return ascii(0, "OggS");
  if (mimeType === "audio/mp4") return ascii(4, "ftyp");
  return (
    mimeType === "audio/webm" &&
    [0x1a, 0x45, 0xdf, 0xa3].every((byte, index) => bytes[index] === byte)
  );
}

export async function readSpeechAudio(
  request: Request,
): Promise<{ audio: Uint8Array; mimeType: string }> {
  if (request.headers.get("x-speech-consent") !== "xr-voice-v1")
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Confirm the speech disclosure before recording.",
    );
  const mimeType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() ?? "";
  if (!formats.includes(mimeType))
    throw new BoundaryError(415, "INVALID_INPUT", "Use supported WebM, WAV, Ogg or MP4 audio.");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_SPEECH_BYTES))
    throw new BoundaryError(413, "INVALID_INPUT", "Voice recordings must be at most 4 MiB.");
  if (!request.body)
    throw new BoundaryError(400, "INVALID_INPUT", "Record a short voice message first.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > MAX_SPEECH_BYTES)
        throw new BoundaryError(413, "INVALID_INPUT", "Voice recordings must be at most 4 MiB.");
      chunks.push(next.value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof BoundaryError) throw error;
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "The audio upload was interrupted. Record again.",
    );
  } finally {
    reader.releaseLock();
  }
  const audio = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    audio.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (!isAudioContainer(audio, mimeType))
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "The recording is empty or has an unsupported audio container.",
    );
  return { audio, mimeType };
}
