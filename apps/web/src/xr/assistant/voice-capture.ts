import { XR_SPEECH_MAX_BYTES } from "@/lib/contracts/xr-assistant";
import { claimMicrophone } from "@/lib/media/microphone-owner";

type Recorder = EventTarget & {
  state: RecordingState;
  mimeType: string;
  start(timeslice?: number): void;
  stop(): void;
};
type CaptureDependencies = {
  getUserMedia(): Promise<MediaStream>;
  createRecorder(stream: MediaStream): Recorder;
};

export function browserVoiceDependencies(): CaptureDependencies {
  return {
    getUserMedia: () => {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error("Voice recording needs a secure browser with microphone support.");
      return navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
    },
    createRecorder: (stream) => {
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"].find(
        (mime) => MediaRecorder.isTypeSupported(mime),
      );
      if (!mimeType)
        throw new Error("This browser does not support a compatible voice recording format.");
      return new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 64_000 });
    },
  };
}

/** One explicit recording; disposal also owns late permission completion. */
export class VoiceCapture {
  private static owner: VoiceCapture | null = null;
  private cancelled = false;
  private started = false;
  private stream?: MediaStream;
  private recorder?: Recorder;
  private reject?: (reason: Error) => void;
  private releaseMicrophone?: () => void;
  constructor(
    private readonly dependencies: CaptureDependencies,
    private readonly onRecording?: () => void,
  ) {}

  async start(): Promise<Blob> {
    if (this.started) throw new Error("This voice recording has already started.");
    if (this.cancelled) throw new DOMException("Voice recording cancelled", "AbortError");
    if (VoiceCapture.owner)
      throw new Error("The microphone is in use by another recording. Stop it or type a command.");
    this.releaseMicrophone = claimMicrophone(this);
    this.started = true;
    VoiceCapture.owner = this;
    try {
      return await this.captureRecording();
    } finally {
      if (VoiceCapture.owner === this) VoiceCapture.owner = null;
      this.reject = undefined;
      this.releaseMicrophone?.();
      this.releaseMicrophone = undefined;
    }
  }

  private async captureRecording(): Promise<Blob> {
    const permission = this.dependencies.getUserMedia();
    this.stream = await new Promise<MediaStream>((resolve, reject) => {
      // getUserMedia itself has no AbortSignal. Settle the UI immediately,
      // while retaining ownership of any stream the browser returns later.
      this.reject = reject;
      permission.then((stream) => {
        if (this.cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        resolve(stream);
      }, reject);
    });
    if (this.cancelled) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      throw new DOMException("Voice recording cancelled", "AbortError");
    }
    try {
      this.recorder = this.dependencies.createRecorder(this.stream);
    } catch (error) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      throw error;
    }
    const recorder = this.recorder;
    return new Promise((resolve, reject) => {
      const chunks: Blob[] = [];
      let bytes = 0;
      let finished = false;
      let timeout: ReturnType<typeof setTimeout>;
      const tracks = this.stream!.getTracks();
      const cleanup = () => {
        clearTimeout(timeout);
        recorder.removeEventListener("dataavailable", data);
        recorder.removeEventListener("stop", stopped);
        recorder.removeEventListener("error", interrupted);
        tracks.forEach((track) => {
          track.removeEventListener("ended", interrupted);
          track.stop();
        });
        this.stream = undefined;
        this.reject = undefined;
      };
      const fail = (error: Error) => {
        if (finished) return;
        finished = true;
        cleanup();
        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            /* resources already released */
          }
        }
        reject(error);
      };
      const interrupted = () =>
        fail(new Error("The microphone was interrupted. Record your message again."));
      const data = (event: Event) => {
        const chunk = (event as BlobEvent).data;
        bytes += chunk.size;
        if (bytes > XR_SPEECH_MAX_BYTES) {
          fail(new Error("The recording exceeds 4 MiB. Try a shorter message."));
          return;
        }
        if (chunk.size) chunks.push(chunk);
      };
      const stopped = () => {
        if (finished) return;
        finished = true;
        cleanup();
        const blob = new Blob(chunks, { type: recorder.mimeType });
        if (!blob.size) reject(new Error("The recording was empty. Please try again."));
        else resolve(blob);
      };
      this.reject = fail;
      recorder.addEventListener("dataavailable", data);
      recorder.addEventListener("stop", stopped, { once: true });
      recorder.addEventListener("error", interrupted, { once: true });
      tracks.forEach((track) => track.addEventListener("ended", interrupted, { once: true }));
      try {
        recorder.start(250);
        timeout = setTimeout(() => this.stop(), 20_000);
        this.onRecording?.();
      } catch {
        fail(new Error("The microphone recording could not start."));
      }
    });
  }
  stop() {
    if (this.recorder?.state === "recording") {
      try {
        this.recorder.stop();
      } catch {
        this.reject?.(new Error("The recording could not finish. Try again."));
      }
    }
  }
  cancel() {
    this.cancelled = true;
    this.reject?.(new DOMException("Voice recording cancelled", "AbortError"));
    if (VoiceCapture.owner === this) VoiceCapture.owner = null;
    this.releaseMicrophone?.();
  }
}
