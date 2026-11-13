import { expect, it } from "vitest";
import { validateWorkspaceUpload } from "@/lib/contracts/workspace-uploads";
export function pcmWav() {
  const bytes = new Uint8Array(48);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("RIFF"), 0);
  view.setUint32(4, 40, true);
  bytes.set(new TextEncoder().encode("WAVEfmt "), 8);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  bytes.set(new TextEncoder().encode("data"), 36);
  view.setUint32(40, 4, true);
  return bytes;
}
it("accepts bounded PCM WAVE while enforcing container, chunk and frame structure", () => {
  expect(() => validateWorkspaceUpload(pcmWav(), "audio/wav")).not.toThrow();
  for (const mutate of [
    (v: DataView) => v.setUint32(4, 1, true),
    (v: DataView) => v.setUint16(20, 3, true),
    (v: DataView) => v.setUint16(32, 3, true),
    (v: DataView) => v.setUint32(28, 1, true),
    (v: DataView) => v.setUint32(40, 3, true),
    (v: DataView) => v.setUint32(16, 1000, true),
  ]) {
    const bytes = pcmWav();
    mutate(new DataView(bytes.buffer));
    expect(() => validateWorkspaceUpload(bytes, "audio/wav")).toThrow();
  }
  expect(() => validateWorkspaceUpload(new Uint8Array([82, 73, 70, 70]), "audio/wav")).toThrow();
});
it("keeps audio types without supported structural validation unavailable", () => {
  for (const mime of ["audio/ogg", "audio/mpeg", "audio/webm", "image/png"])
    expect(() => validateWorkspaceUpload(pcmWav(), mime)).toThrow();
});
