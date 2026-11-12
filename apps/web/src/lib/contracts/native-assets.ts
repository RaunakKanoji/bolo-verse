import { imageDimensions } from "./xr-image-metadata";

export const MAX_NATIVE_CONTENT_BYTES = 32 * 1024 * 1024;
export const USDZ_MIME_TYPE = "model/vnd.usdz+zip";
export function nativeContentSupported(mimeType: string, byteSize: number): boolean {
  return mimeType === USDZ_MIME_TYPE && Number.isSafeInteger(byteSize) && byteSize > 0 && byteSize <= MAX_NATIVE_CONTENT_BYTES;
}
const invalid = (): never => { throw new Error("This USDZ archive is invalid or unsupported."); };
const oversized = (): never => { throw new Error("This USDZ archive exceeds the native resource limits."); };

/** Matches the native USDZPreflight subset; does not decompress or decode USD models. */
export function validateNativeUSDZ(bytes: Uint8Array): void {
  if (bytes.length > MAX_NATIVE_CONTENT_BYTES) return oversized();
  if (bytes.length < 22) return invalid();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (offset: number) => offset >= 0 && offset + 2 <= bytes.length ? view.getUint16(offset, true) : invalid();
  const u32 = (offset: number) => offset >= 0 && offset + 4 <= bytes.length ? view.getUint32(offset, true) : invalid();
  let end = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset--) {
    if (u32(offset) === 0x06054b50 && offset + 22 + u16(offset + 20) === bytes.length) { end = offset; break; }
  }
  if (end < 0 || u16(end + 4) !== 0 || u16(end + 6) !== 0) return invalid();
  const count = u16(end + 10), directorySize = u32(end + 12), directoryOffset = u32(end + 16);
  if (count < 1 || count > 64) return oversized();
  if (u16(end + 8) !== count || directoryOffset + directorySize !== end) return invalid();
  let cursor = directoryOffset, expandedTotal = 0, textureCount = 0, pixels = 0;
  const names = new Set<string>(), ranges: { start: number; end: number }[] = [];
  const allowed = new Set(["usd", "usda", "usdc", "png", "jpg", "jpeg"]);
  for (let index = 0; index < count; index++) {
    if (cursor + 46 > end || u32(cursor) !== 0x02014b50) return invalid();
    const flags = u16(cursor + 8), method = u16(cursor + 10);
    const packed = u32(cursor + 20), expanded = u32(cursor + 24);
    const nameLength = u16(cursor + 28), extraLength = u16(cursor + 30), commentLength = u16(cursor + 32);
    const local = u32(cursor + 42), externalMode = u32(cursor + 38) >>> 16;
    if ((flags & ~0x0800) !== 0 || method !== 0 || packed !== expanded || (externalMode & 0xf000) === 0xa000 || u16(cursor + 34) !== 0 || cursor + 46 + nameLength + extraLength + commentLength > end) return invalid();
    expandedTotal += expanded;
    if (expandedTotal > MAX_NATIVE_CONTENT_BYTES) return oversized();
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    let name: string;
    try { name = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes); } catch { return invalid(); }
    const filename = name.split("/").at(-1) ?? "", dot = filename.lastIndexOf(".");
    const extension = dot > 0 ? filename.slice(dot + 1).toLowerCase() : "";
    const folded = name.normalize("NFC").toLowerCase();
    if (!nameLength || nameLength > 240 || name.startsWith("/") || name.includes("\\") || name.includes(":") || /[\p{Cc}\p{Cf}]/u.test(name) || name.split("/").some((part) => !part || part === "." || part === "..") || !allowed.has(extension) || names.has(folded)) return invalid();
    if (index === 0 && !["usd", "usda", "usdc"].includes(extension)) return invalid();
    names.add(folded);
    if (u32(local) !== 0x04034b50 || u16(local + 6) !== flags || u16(local + 8) !== method || u32(local + 18) !== packed || u32(local + 22) !== expanded) return invalid();
    const localNameLength = u16(local + 26), localExtraLength = u16(local + 28);
    const payload = local + 30 + localNameLength + localExtraLength, payloadEnd = payload + packed;
    if (payloadEnd > directoryOffset || localNameLength !== nameLength || !nameBytes.every((byte, at) => bytes[local + 30 + at] === byte) || ranges.some((range) => local < range.end && payloadEnd > range.start)) return invalid();
    ranges.push({ start: local, end: payloadEnd });
    if (["png", "jpg", "jpeg"].includes(extension)) {
      if (++textureCount > 16) return oversized();
      let dimensions: { width: number; height: number };
      try { dimensions = imageDimensions(bytes.subarray(payload, payloadEnd), extension === "png" ? "image/png" : "image/jpeg"); } catch { return invalid(); }
      pixels += dimensions.width * dimensions.height;
      if (dimensions.width > 4096 || dimensions.height > 4096 || pixels > 16_777_216) return oversized();
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== end) return invalid();
}
