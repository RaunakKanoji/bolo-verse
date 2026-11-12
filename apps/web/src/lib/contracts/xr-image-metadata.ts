/** Header-only image inspection: bound decoder allocations without decoding pixels. */
export function imageDimensions(
  bytes: Uint8Array,
  mimeType: string,
): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const invalid = () => {
    throw new Error("The image dimensions or structure are invalid.");
  };
  const ascii = (at: number, count: number) =>
    String.fromCharCode(...bytes.subarray(at, at + count));
  const bounds = (width: number, height: number) => {
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width <= 0 ||
      height <= 0 ||
      width > 8192 ||
      height > 8192 ||
      width * height > 4096 * 4096
    )
      throw new Error("The image exceeds the preview pixel dimension limit.");
    return { width, height };
  };
  if (mimeType === "image/png") {
    if (
      bytes.length < 33 ||
      ascii(1, 3) !== "PNG" ||
      bytes[0] !== 137 ||
      bytes[4] !== 13 ||
      bytes[5] !== 10 ||
      bytes[6] !== 26 ||
      bytes[7] !== 10 ||
      view.getUint32(8) !== 13 ||
      ascii(12, 4) !== "IHDR"
    )
      return invalid();
    const dimensions = bounds(view.getUint32(16), view.getUint32(20));
    // Keep decoded channel storage within the four-byte-per-pixel allocation budget.
    if (![1, 2, 4, 8].includes(bytes[24]))
      throw new Error("Only PNG images with up to 8-bit channels are supported in previews.");
    let offset = 8;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset);
      if (offset + 12 + length > bytes.length) return invalid();
      const type = ascii(offset + 4, 4);
      if (type === "IHDR" && offset !== 8) return invalid();
      if (type === "acTL" || type === "fcTL" || type === "fdAT")
        throw new Error("Animated images are not supported in spatial previews.");
      offset += 12 + length;
      if (type === "IEND") return length === 0 ? dimensions : invalid();
    }
    return invalid();
  }
  if (mimeType === "image/jpeg") {
    if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return invalid();
    let offset = 2;
    let dimensions: { width: number; height: number } | undefined;
    while (offset < bytes.length) {
      // Entropy-coded scans may contain escaped FF bytes and restart markers.
      if (bytes[offset++] !== 255) continue;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (marker === 0xd9) return dimensions ?? invalid();
      if (marker === 0xdc || marker === 0xd8 || offset + 2 > bytes.length) return invalid();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return invalid();
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        if (
          ![0xc0, 0xc1, 0xc2].includes(marker) ||
          dimensions ||
          length < 8 ||
          bytes[offset + 2] !== 8
        )
          return invalid();
        dimensions = bounds(view.getUint16(offset + 5), view.getUint16(offset + 3));
      }
      offset += length;
    }
    return invalid();
  }
  if (mimeType === "image/gif") {
    if (bytes.length < 13 || !["GIF87a", "GIF89a"].includes(ascii(0, 6))) return invalid();
    const dimensions = bounds(view.getUint16(6, true), view.getUint16(8, true));
    let offset = 13 + (bytes[10] & 0x80 ? 3 * 2 ** ((bytes[10] & 7) + 1) : 0);
    let frames = 0;
    const skipBlocks = () => {
      while (offset < bytes.length) {
        const length = bytes[offset++];
        if (!length) return;
        offset += length;
        if (offset > bytes.length) invalid();
      }
      invalid();
    };
    while (offset < bytes.length) {
      const block = bytes[offset++];
      if (block === 0x3b) return frames === 1 ? dimensions : invalid();
      if (block === 0x21) {
        offset++;
        skipBlocks();
        continue;
      }
      if (block !== 0x2c || offset + 9 > bytes.length) return invalid();
      if (++frames > 1) throw new Error("Animated images are not supported in spatial previews.");
      const left = view.getUint16(offset, true),
        top = view.getUint16(offset + 2, true);
      const frame = bounds(view.getUint16(offset + 4, true), view.getUint16(offset + 6, true));
      if (left + frame.width > dimensions.width || top + frame.height > dimensions.height)
        return invalid();
      const packed = bytes[offset + 8];
      offset += 9 + (packed & 0x80 ? 3 * 2 ** ((packed & 7) + 1) : 0);
      offset++; // LZW minimum code size; blocks are bounded before the browser decodes them.
      skipBlocks();
    }
    return invalid();
  }
  if (mimeType === "image/webp") {
    if (
      bytes.length < 20 ||
      ascii(0, 4) !== "RIFF" ||
      ascii(8, 4) !== "WEBP" ||
      view.getUint32(4, true) + 8 !== bytes.length
    )
      return invalid();
    let dimensions: { width: number; height: number } | undefined;
    let extended: { width: number; height: number } | undefined;
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const type = ascii(offset, 4),
        length = view.getUint32(offset + 4, true),
        data = offset + 8;
      if (data + length > bytes.length) return invalid();
      if (type === "ANIM" || type === "ANMF")
        throw new Error("Animated images are not supported in spatial previews.");
      if (type === "VP8X") {
        if (length !== 10 || extended) return invalid();
        if (bytes[data] & 2)
          throw new Error("Animated images are not supported in spatial previews.");
        extended = bounds(
          1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16),
          1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16),
        );
      } else if (type === "VP8 ") {
        if (
          dimensions ||
          length < 10 ||
          ascii(data + 3, 3) !== "\u009d\u0001\u002a" ||
          bytes[data] & 1
        )
          return invalid();
        dimensions = bounds(
          view.getUint16(data + 6, true) & 0x3fff,
          view.getUint16(data + 8, true) & 0x3fff,
        );
      } else if (type === "VP8L") {
        if (dimensions || length < 5 || bytes[data] !== 0x2f) return invalid();
        const bits = view.getUint32(data + 1, true);
        dimensions = bounds((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
      }
      offset = data + length + (length & 1);
    }
    if (
      offset !== bytes.length ||
      !dimensions ||
      (extended && (extended.width !== dimensions.width || extended.height !== dimensions.height))
    )
      return invalid();
    return dimensions;
  }
  throw new Error("This embedded image format is not supported.");
}
