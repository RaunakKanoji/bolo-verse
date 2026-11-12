import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginLocalRecording,
  chooseRecordingMime,
  type RecorderPort,
} from "../../apps/web/src/features/studio/recording/local-recording";

// MediaRecorder is a browser boundary. This adapter lets tests control the
// documented asynchronous final dataavailable → stop sequence.
class BrowserRecorder extends EventTarget implements RecorderPort {
  state: RecordingState = "inactive";
  mimeType = "video/webm;codecs=vp8,opus";
  stopRequests = 0;
  failStart = false;

  start() {
    if (this.failStart) throw new Error("Encoder unavailable");
    this.state = "recording";
  }

  stop() {
    this.stopRequests += 1;
    this.state = "inactive";
  }

  data(value: string, type = this.mimeType) {
    const event = new Event("dataavailable");
    Object.defineProperty(event, "data", { value: new Blob([value], { type }) });
    this.dispatchEvent(event);
  }

  finish() {
    this.state = "inactive";
    this.dispatchEvent(new Event("stop"));
  }
}

function makeTracks() {
  return [
    { readyState: "live", stop() { this.readyState = "ended"; } },
    { readyState: "live", stop() { this.readyState = "ended"; } },
  ];
}

afterEach(() => vi.useRealTimers());

describe("local recording", () => {
  it("negotiates a browser-supported container and rejects no supported format", () => {
    expect(chooseRecordingMime((mime) => mime === "video/mp4")).toBe("video/mp4");
    expect(chooseRecordingMime(() => false)).toBeNull();
    expect(chooseRecordingMime((mime) => mime === "video/webm")).toBe("video/webm");
  });

  it("waits for the final chunk and finalizes duplicate stops only once", async () => {
    const recorder = new BrowserRecorder();
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    recorder.data("first");
    const firstStop = take.stop();
    expect(take.stop()).toBe(firstStop);
    expect(recorder.stopRequests).toBe(1);
    expect(tracks.every((track) => track.readyState === "live")).toBe(true);
    recorder.data("last");
    recorder.finish();
    const result = await take.result;
    expect(await result.blob.text()).toBe("firstlast");
    expect(result.extension).toBe("webm");
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("labels the file using the actual recorder MIME, including MP4", async () => {
    const recorder = new BrowserRecorder();
    recorder.mimeType = "video/mp4;codecs=avc1.42E01E,mp4a.40.2";
    const take = beginLocalRecording(recorder, makeTracks(), 5_000);
    take.stop();
    recorder.data("encoded data");
    recorder.finish();
    const result = await take.result;
    expect(result.mimeType).toBe("video/mp4;codecs=avc1.42E01E,mp4a.40.2");
    expect(result.blob.type).toBe("video/mp4;codecs=avc1.42e01e,mp4a.40.2");
    expect(result.extension).toBe("mp4");
  });

  it("rejects zero-byte output and releases every owned track", async () => {
    const recorder = new BrowserRecorder();
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    const rejected = expect(take.result).rejects.toThrow(/empty/i);
    take.stop();
    recorder.data("");
    recorder.finish();
    await rejected;
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("auto-stops at the duration even without a manual stop", async () => {
    vi.useFakeTimers();
    const recorder = new BrowserRecorder();
    const take = beginLocalRecording(recorder, makeTracks(), 5_000);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(recorder.state).toBe("recording");
    await vi.advanceTimersByTimeAsync(1);
    expect(recorder.state).toBe("inactive");
    recorder.data("timed take");
    recorder.finish();
    expect((await take.result).blob.size).toBe(10);
  });

  it("does not present interrupted output as a completed take", async () => {
    const recorder = new BrowserRecorder();
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    const rejected = expect(take.result).rejects.toThrow("Page hidden");
    recorder.data("partial take");
    take.stop("Page hidden");
    recorder.data("final partial data");
    recorder.finish();
    await rejected;
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("releases tracks when the recorder refuses to start", async () => {
    const recorder = new BrowserRecorder();
    recorder.failStart = true;
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    await expect(take.result).rejects.toThrow("Encoder unavailable");
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("rejects an encoder runtime failure even when some data exists", async () => {
    const recorder = new BrowserRecorder();
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    const rejected = expect(take.result).rejects.toThrow(/encoder/i);
    recorder.data("partial");
    recorder.dispatchEvent(new Event("error"));
    recorder.finish();
    await rejected;
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("bounds finalization when the browser never emits its stop event", async () => {
    vi.useFakeTimers();
    const recorder = new BrowserRecorder();
    const tracks = makeTracks();
    const take = beginLocalRecording(recorder, tracks, 5_000);
    const rejected = expect(take.result).rejects.toThrow(/finaliz/i);
    take.stop();
    await vi.advanceTimersByTimeAsync(5_000);
    await rejected;
    expect(tracks.every((track) => track.readyState === "ended")).toBe(true);
  });

  it("rejects an unsolicited stop instead of claiming a complete recording", async () => {
    const recorder = new BrowserRecorder();
    const take = beginLocalRecording(recorder, makeTracks(), 5_000);
    const rejected = expect(take.result).rejects.toThrow(/unexpected/i);
    recorder.data("truncated recording");
    recorder.finish();
    await rejected;
  });

  it("uses the encoded chunk format when the recorder omits its MIME", async () => {
    const recorder = new BrowserRecorder();
    recorder.mimeType = "";
    const take = beginLocalRecording(recorder, makeTracks(), 5_000);
    take.stop();
    recorder.data("video", "video/webm");
    recorder.finish();
    const result = await take.result;
    expect(result.mimeType).toBe("video/webm");
    expect(result.extension).toBe("webm");
  });

  it("stops a take that exceeds the local memory limit", async () => {
    const recorder = new BrowserRecorder();
    const take = beginLocalRecording(recorder, makeTracks(), 5_000);
    const rejected = expect(take.result).rejects.toThrow(/size limit/i);
    recorder.data("x".repeat(33 * 1024 * 1024));
    expect(recorder.state).toBe("inactive");
    recorder.finish();
    await rejected;
  });
});
