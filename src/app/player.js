/**
 * Drives the compositor: a looping preview, and a timed recording via
 * canvas.captureStream(30) + the mixer's audio track → MediaRecorder → webm Blob.
 */
import { LOG_PREFIX, VIDEO } from '../shared/config.js';

const MIME_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

/** First webm type this browser can record, or '' if none. */
export const pickMimeType = () =>
  MIME_TYPES.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) ?? '';

export class Player {
  /** @param {import('./compositor.js').Compositor} compositor */
  constructor(compositor) {
    this.c = compositor;
    this.raf = 0;
    this.t0 = performance.now();
    this.recording = null; // { start, durationMs, onTick }
  }

  get durationMs() {
    return (this.c.brief?.duration_s ?? 8) * 1000;
  }

  /** Starts (or restarts) the looping preview from the beginning. */
  play() {
    cancelAnimationFrame(this.raf);
    this.t0 = performance.now();
    const loop = (now) => {
      let p;
      if (this.recording) {
        const elapsed = now - this.recording.start;
        p = Math.min(1, elapsed / this.recording.durationMs);
        this.recording.onTick?.(elapsed);
      } else {
        p = ((now - this.t0) % this.durationMs) / this.durationMs;
      }
      this.c.render(p);
      // While recording, push each drawn frame to the encoder explicitly (see record()).
      this.recording?.videoTrack?.requestFrame?.();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  /**
   * Records one pass of the animation (brief.duration_s long).
   * @param {{ audioTrack?: MediaStreamTrack|null, onTick?: (elapsedMs:number) => void }} opts
   * @returns {Promise<{ blob: Blob, mimeType: string, ms: number }>}
   */
  record({ audioTrack, onTick } = {}) {
    const mimeType = pickMimeType();
    if (!mimeType) return Promise.reject(new Error('This browser cannot record webm video'));

    // captureStream(0) + requestFrame() after every draw delivers frames deterministically;
    // automatic sampling (captureStream(30)) was seen to stall under heavy load.
    const canRequest = typeof CanvasCaptureMediaStreamTrack !== 'undefined' && 'requestFrame' in CanvasCaptureMediaStreamTrack.prototype;
    const stream = this.c.canvas.captureStream(canRequest ? 0 : VIDEO.fps);
    const videoTrack = canRequest ? stream.getVideoTracks()[0] : null;
    if (audioTrack) stream.addTrack(audioTrack);
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: VIDEO.bitrate });
    const chunks = [];
    const durationMs = this.durationMs;
    const t0 = performance.now();

    return new Promise((resolve, reject) => {
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onerror = (e) => {
        this.recording = null;
        reject(e.error ?? new Error('MediaRecorder error'));
      };
      rec.onstop = () => {
        this.recording = null;
        // Stop only the canvas video track; the mixer's audio track is reused.
        stream.getVideoTracks().forEach((t) => t.stop());
        console.info(LOG_PREFIX, 'recorder stopped', { chunks: chunks.length, bytes: chunks.reduce((n, c) => n + c.size, 0), state: rec.state });
        resolve({ blob: new Blob(chunks, { type: 'video/webm' }), mimeType, ms: Math.round(performance.now() - t0) });
      };

      // Draw and push the first frame before starting, so the file never begins empty.
      this.c.render(0);
      videoTrack?.requestFrame();
      rec.start(250);
      // Restart the animation at p=0 in sync with the recorder.
      this.recording = {
        start: performance.now(),
        durationMs,
        videoTrack,
        onTick: (elapsed) => {
          onTick?.(elapsed);
          if (elapsed >= durationMs + 120 && rec.state === 'recording') {
            console.info(LOG_PREFIX, 'recording done', durationMs, 'ms');
            rec.stop();
          }
        },
      };
    });
  }
}
