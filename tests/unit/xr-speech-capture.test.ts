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
    // Cancellation must settle before the next browser task, without depending
    // on a particular number of internal promise continuations.
    const beforePermissionReturns = await Promise.race([
      pending.then(() => settled),
      new Promise<boolean>((done) => setTimeout(() => done(false), 0)),
    ]);
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

it("allows only one microphone owner and releases its lease after permission denial", async () => {
  let rejectPermission!: (error: Error) => void;
  const first = new VoiceCapture({ getUserMedia: () => new Promise((_resolve, reject) => { rejectPermission = reject; }), createRecorder: () => new Recorder() });
  const pending = first.start(); const rejected = expect(pending).rejects.toMatchObject({ name: "NotAllowedError" });
  const secondGetUserMedia = vi.fn().mockRejectedValue(new Error("Unexpected second microphone request"));
  const second = new VoiceCapture({ getUserMedia: secondGetUserMedia, createRecorder: () => new Recorder() });
  const competing = second.start();
  // Attach before settling first permission, so both failures remain observable.
  const competition = expect(competing).rejects.toThrow(/microphone.*in use|another.*recording/i);
  rejectPermission(new DOMException("denied", "NotAllowedError"));
  await rejected; await competition;
  expect(secondGetUserMedia).not.toHaveBeenCalled();
  const { stream, track } = streamHarness();
  let ready!: () => void; const started = new Promise<void>((resolve) => { ready = resolve; });
  const next = new VoiceCapture({ getUserMedia: async () => stream, createRecorder: () => new Recorder() }, ready);
  const take = next.start(); await started; next.stop(); await take;
  expect(track.stop).toHaveBeenCalledOnce();
});
