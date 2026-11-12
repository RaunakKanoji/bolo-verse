import { afterEach, describe, expect, it, vi } from "vitest";
import { VoiceCapture } from "@/xr/assistant/voice-capture";

class Recorder extends EventTarget {
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.dispatchEvent(
      Object.assign(new Event("dataavailable"), {
        data: new Blob(["recorded audio bytes"], { type: this.mimeType }),
      }),
    );
    this.dispatchEvent(new Event("stop"));
  }
}
const streamHarness = () => {
  const track = Object.assign(new EventTarget(), { stop: vi.fn() });
  const stream = { getTracks: () => [track] } as unknown as MediaStream;
  return { track, stream };
};
afterEach(() => vi.useRealTimers());
describe("explicit voice capture ownership", () => {
  it("rejects more than 4 MiB of microphone data before creating an upload", async () => {
    const { stream, track } = streamHarness();
    const recorder = new Recorder();
    let ready!: () => void;
    const recording = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const capture = new VoiceCapture(
      { getUserMedia: async () => stream, createRecorder: () => recorder },
      ready,
    );
    const pending = capture.start();
    const rejected = expect(pending).rejects.toThrow(/too large|4 MiB/);
    await recording;
    recorder.dispatchEvent(
      Object.assign(new Event("dataavailable"), {
        data: new Blob([new Uint8Array(4 * 1024 * 1024 + 1)]),
      }),
    );
    // Force finalization too, so an incorrectly accepted upload fails promptly.
    capture.stop();
    await rejected;
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("keeps the last data chunk, then releases microphone resources", async () => {
    const { stream, track } = streamHarness();
    const recorder = new Recorder();
    let ready!: () => void;
    const recording = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const capture = new VoiceCapture(
      { getUserMedia: async () => stream, createRecorder: () => recorder },
      ready,
    );
    const pending = capture.start();
    await recording;
    capture.stop();
    expect((await pending).size).toBeGreaterThan(0);
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("releases a microphone permission result that arrives after cancellation", async () => {
    const { stream, track } = streamHarness();
    let resolve!: (stream: MediaStream) => void;
    const getUserMedia = () =>
      new Promise<MediaStream>((done) => {
        resolve = done;
      });
    const createRecorder = vi.fn(() => new Recorder());
    const capture = new VoiceCapture({ getUserMedia, createRecorder });
    const pending = capture.start();
    const rejection = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    capture.cancel();
    resolve(stream);
    await rejection;
    expect(track.stop).toHaveBeenCalledOnce();
    expect(createRecorder).not.toHaveBeenCalled();
  });
  it("settles cancellation while the browser permission prompt is still pending", async () => {
    const { stream, track } = streamHarness();
    let resolve!: (stream: MediaStream) => void;
    let settled = false;
    const capture = new VoiceCapture({
      getUserMedia: () =>
        new Promise((done) => {
          resolve = done;
        }),
      createRecorder: () => new Recorder(),
    });
    const pending = capture.start().catch(() => {
      settled = true;
    });
    capture.cancel();
    await Promise.resolve();
    await Promise.resolve();
    const beforePermissionReturns = settled;
    resolve(stream);
    await pending;
    expect(beforePermissionReturns).toBe(true);
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("does not accept an interrupted microphone as a successful take", async () => {
    const { stream, track } = streamHarness();
    let ready!: () => void;
    const recording = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const capture = new VoiceCapture(
      { getUserMedia: async () => stream, createRecorder: () => new Recorder() },
      ready,
    );
    const pending = capture.start();
    const rejection = expect(pending).rejects.toThrow(/interrupted/);
    await recording;
    track.dispatchEvent(new Event("ended"));
    await rejection;
    expect(track.stop).toHaveBeenCalledOnce();
  });
  it("automatically stops at20 seconds without retaining an active microphone", async () => {
    vi.useFakeTimers();
    const { stream, track } = streamHarness();
    let ready!: () => void;
    const recording = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const capture = new VoiceCapture(
      { getUserMedia: async () => stream, createRecorder: () => new Recorder() },
      ready,
    );
    const pending = capture.start();
    await recording;
    await vi.advanceTimersByTimeAsync(20_000);
    expect((await pending).size).toBeGreaterThan(0);
    expect(track.stop).toHaveBeenCalledOnce();
  });
});
