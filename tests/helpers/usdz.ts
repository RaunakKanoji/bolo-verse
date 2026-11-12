export const tinyPNG = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGMwqfj2HwAFKAKi8NmfRgAAAABJRU5ErkJggg==", "base64"));
/** Independent minimal stored ZIP builder; payloads are never decompressed by tests. */
export function storedUSDZ(entries: { name: string; bytes: Uint8Array }[] = [{ name: "model.usda", bytes: new TextEncoder().encode("#usda 1.0\ndef Xform \"Product\" {}") }], options: { flags?: number; method?: number; externalMode?: number } = {}) {
  const local: Buffer[] = [], central: Buffer[] = [], localOffsets: number[] = [], centralOffsets: number[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name), header = Buffer.alloc(30), directory = Buffer.alloc(46);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4);
    header.writeUInt16LE(options.flags ?? 0, 6); header.writeUInt16LE(options.method ?? 0, 8);
    header.writeUInt32LE(entry.bytes.length, 18); header.writeUInt32LE(entry.bytes.length, 22); header.writeUInt16LE(name.length, 26);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(options.flags ?? 0, 8); directory.writeUInt16LE(options.method ?? 0, 10);
    directory.writeUInt32LE(entry.bytes.length, 20); directory.writeUInt32LE(entry.bytes.length, 24); directory.writeUInt16LE(name.length, 28);
    directory.writeUInt32LE(((options.externalMode ?? 0) * 65536) >>> 0, 38); directory.writeUInt32LE(offset, 42);
    localOffsets.push(offset); local.push(header, name, Buffer.from(entry.bytes)); central.push(directory, name);
    offset += header.length + name.length + entry.bytes.length;
  }
  let centralOffset = offset;
  for (let index = 0; index < central.length; index += 2) { centralOffsets.push(centralOffset); centralOffset += central[index].length + central[index + 1].length; }
  const directory = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return { bytes: Buffer.concat([...local, directory, end]), localOffsets, centralOffsets, endOffset: offset + directory.length };
}
