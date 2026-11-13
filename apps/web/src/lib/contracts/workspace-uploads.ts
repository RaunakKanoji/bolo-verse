import { MAX_PREVIEW_BYTES, previewSupported, validatePreviewAsset } from "./xr-assets";
export const workspaceUploadExtensions: Readonly<Record<string, string>> = {
  "application/pdf": "pdf",
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "audio/wav": "wav",
};
/** Conservative PCM RIFF/WAVE subset. Structure is verified; no playback or codec run is claimed.
 * Format relationships: https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/ns-mmeapi-waveformatex
 */
function validatePcmWav(bytes: Uint8Array) {
  const invalid = () => {
    throw new Error("Use a complete, bounded PCM RIFF/WAVE file.");
  };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (at: number) => String.fromCharCode(...bytes.subarray(at, at + 4));
  if (
    bytes.length < 44 ||
    ascii(0) !== "RIFF" ||
    ascii(8) !== "WAVE" ||
    view.getUint32(4, true) + 8 !== bytes.length
  )
    return invalid();
  let offset = 12,
    format = false,
    data = false,
    blockAlign = 0,
    chunks = 0;
  while (offset < bytes.length) {
    if (++chunks > 256 || offset + 8 > bytes.length) return invalid();
    const id = ascii(offset),
      length = view.getUint32(offset + 4, true);
    const start = offset + 8,
      end = start + length;
    if (end > bytes.length) return invalid();
    if (id === "fmt ") {
      if (format || data || !(length === 16 || length === 18)) return invalid();
      const tag = view.getUint16(start, true),
        channels = view.getUint16(start + 2, true),
        rate = view.getUint32(start + 4, true),
        byteRate = view.getUint32(start + 8, true),
        align = view.getUint16(start + 12, true),
        bits = view.getUint16(start + 14, true);
      if (
        tag !== 1 ||
        channels < 1 ||
        channels > 8 ||
        rate < 8000 ||
        rate > 192000 ||
        ![8, 16].includes(bits) ||
        align !== (channels * bits) / 8 ||
        byteRate !== rate * align ||
        (length === 18 && view.getUint16(start + 16, true) !== 0)
      )
        return invalid();
      blockAlign = align;
      format = true;
    }
    if (id === "data") {
      if (!format || data || length < blockAlign || length % blockAlign !== 0) return invalid();
      data = true;
    }
    offset = end + (length % 2);
    if (offset > bytes.length) return invalid();
  }
  if (!format || !data || offset !== bytes.length) return invalid();
}
export function validateWorkspaceUpload(bytes: Uint8Array, mimeType: string): void {
  if (
    !Object.hasOwn(workspaceUploadExtensions, mimeType) ||
    !bytes.length ||
    bytes.length > MAX_PREVIEW_BYTES
  )
    throw new Error("This asset type or size is not supported for library uploads.");
  if (mimeType === "audio/wav") validatePcmWav(bytes);
  else validatePreviewAsset(bytes, mimeType);
}
/** Existing image uploads remain independently codec-validated; this only gates safe downloads. */
export function workspaceDownloadSupported(mimeType: string, byteSize: number) {
  return (
    previewSupported(mimeType, byteSize) ||
    (mimeType === "audio/wav" && byteSize > 0 && byteSize <= MAX_PREVIEW_BYTES)
  );
}
export function validateWorkspaceDownload(bytes: Uint8Array, mimeType: string) {
  if (!workspaceDownloadSupported(mimeType, bytes.length))
    throw new Error("This asset has no bounded private download.");
  if (mimeType === "audio/wav") validatePcmWav(bytes);
  else validatePreviewAsset(bytes, mimeType);
}
