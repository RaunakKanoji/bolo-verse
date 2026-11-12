export interface RecorderPort extends EventTarget {
  readonly state: RecordingState;
  readonly mimeType: string;
  start(timeslice?: number): void;
  stop(): void;
}

export interface OwnedTrack {
  stop(): void;
}

export interface LocalRecording {
  blob: Blob;
  mimeType: string;
  extension: string;
}

export interface RecordingTake {
  result: Promise<LocalRecording>;
  stop(interruption?: string): Promise<LocalRecording>;
}

export function chooseRecordingMime(isSupported: (mime: string) => boolean): string | null {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
  ];
  return candidates.find((mime) => isSupported(mime)) ?? null;
}

export function beginLocalRecording(
  recorder: RecorderPort,
  ownedTracks: OwnedTrack[],
  durationMs: number,
): RecordingTake {
  let resolve!: (recording: LocalRecording) => void;
  let reject!: (error: Error) => void;
  const result = new Promise<LocalRecording>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  let chunks: Blob[] = [];
  let bytes = 0;
  let settled = false;
  let stopRequested = false;
  let failure: Error | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finalizationTimer: ReturnType<typeof setTimeout> | undefined;

  function cleanup() {
    clearTimeout(timer);
    clearTimeout(finalizationTimer);
    recorder.removeEventListener("dataavailable", onData);
    recorder.removeEventListener("stop", onStop);
    recorder.removeEventListener("error", onError);
    for (const track of new Set(ownedTracks)) track.stop();
  }

  function finish() {
    if (settled) return;
    settled = true;
    cleanup();
    const mimeType = recorder.mimeType || chunks.find((chunk) => chunk.type)?.type || "";
    const container = mimeType.split(";")[0].trim().toLowerCase();
    const extension = container === "video/webm" ? "webm" : container === "video/mp4" ? "mp4" : null;
    const blob = new Blob(chunks, { type: mimeType });
    chunks = [];
    if (failure) reject(failure);
    else if (!blob.size) reject(new Error("The recording was empty. Please try again."));
    else if (!extension) reject(new Error("The browser did not report a supported video format."));
    else resolve({ blob, mimeType, extension });
  }

  function stop(interruption?: string) {
    if (settled) return result;
    if (interruption) failure ??= new Error(interruption);
    if (stopRequested) return result;
    stopRequested = true;
    clearTimeout(timer);
    finalizationTimer = setTimeout(() => {
      failure ??= new Error("The browser could not finalize the recording. Please try again.");
      finish();
    }, 5_000);
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch (error) {
      failure = error instanceof Error ? error : new Error("The encoder could not stop.");
      finish();
    }
    return result;
  }

  function onData(event: Event) {
    const data = (event as BlobEvent).data;
    if (settled || failure || !data.size) return;
    bytes += data.size;
    if (bytes > 32 * 1024 * 1024) {
      stop("The recording exceeded the 32 MB local size limit. Try a shorter take.");
      return;
    }
    chunks.push(data);
  }

  function onStop() {
    if (!stopRequested) failure ??= new Error("The encoder stopped unexpectedly. Please try again.");
    finish();
  }

  function onError() {
    stop("The browser encoder failed. Please try a shorter take or another browser.");
  }

  recorder.addEventListener("dataavailable", onData);
  recorder.addEventListener("stop", onStop);
  recorder.addEventListener("error", onError);
  try {
    recorder.start(250);
    timer = setTimeout(() => stop(), durationMs);
  } catch (error) {
    failure = error instanceof Error ? error : new Error("The encoder could not start.");
    finish();
  }
  return { result, stop };
}
