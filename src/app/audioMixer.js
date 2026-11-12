/**
 * Web Audio mixer feeding the recording. Sources (live mic narration now; a Sarvam
 * voice-over in milestone D) connect to one MediaStreamDestination, whose audio track
 * goes into the MediaRecorder. Nothing is routed to the speakers, so there is no feedback.
 */
import { LOG_PREFIX } from '../shared/config.js';

export class AudioMixer {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.dest = null;
    this.micStream = null;
    this.micNode = null;
  }

  /** Creates the AudioContext. Call from a user gesture (tap) so mobile Chrome allows it. */
  async init() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.dest = this.ctx.createMediaStreamDestination();
      this.bus = this.ctx.createGain();
      this.bus.connect(this.dest);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this;
  }

  /** The mixed audio track (silent when no source is connected). */
  get track() {
    return this.dest?.stream.getAudioTracks()[0] ?? null;
  }

  /** Connects the microphone for live narration. Throws if permission is denied. */
  async connectMic() {
    await this.init();
    if (this.micNode) return;
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.micNode = this.ctx.createMediaStreamSource(this.micStream);
    this.micNode.connect(this.bus);
  }

  /** Disconnects and releases the microphone. */
  disconnectMic() {
    try {
      this.micNode?.disconnect();
    } catch (err) {
      console.warn(LOG_PREFIX, err);
    }
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micNode = null;
    this.micStream = null;
  }
}
