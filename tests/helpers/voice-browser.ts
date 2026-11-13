import { expect, type Page } from "@playwright/test";

/** Observe real browser MediaRecorder output/tracks with Playwright's synthetic microphone. */
export async function instrumentVoice(page: Page) {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      (window as Window & { voiceTracks?: MediaStreamTrack[] }).voiceTracks = stream.getTracks();
      return stream;
    };
    const start = MediaRecorder.prototype.start;
    MediaRecorder.prototype.start = function (this: MediaRecorder, timeslice?: number) {
      const state = window as Window & { voiceRecordedBytes?: number };
      state.voiceRecordedBytes = 0;
      this.addEventListener("dataavailable", (event) => {
        state.voiceRecordedBytes = (state.voiceRecordedBytes ?? 0) + event.data.size;
      });
      return start.call(this, timeslice);
    };
  });
}
export async function waitForVoiceData(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { voiceRecordedBytes?: number }).voiceRecordedBytes ?? 0,
      ),
    )
    .toBeGreaterThan(0);
}
