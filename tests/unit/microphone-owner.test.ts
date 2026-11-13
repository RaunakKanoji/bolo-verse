import { expect, it, vi } from "vitest";
import { claimMicrophone } from "@/lib/media/microphone-owner";
import { VoiceCapture } from "@/xr/assistant/voice-capture";
it("prevents voice capture while a device recorder owns the microphone and releases an old lease safely", async () => {
  const device = {}, release = claimMicrophone(device), media = vi.fn();
  await expect(new VoiceCapture({ getUserMedia: media, createRecorder: vi.fn() }).start()).rejects.toThrow(/microphone.*use/i);
  expect(media).not.toHaveBeenCalled();
  release();
  const next = claimMicrophone({});
  release();
  expect(() => claimMicrophone({})).toThrow(/microphone.*use/i);
  next();
});
