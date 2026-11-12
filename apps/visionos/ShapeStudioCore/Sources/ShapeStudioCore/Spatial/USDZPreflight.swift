import Foundation
import ImageIO

public enum USDZPreflight {
    public static let maximumArchiveBytes = 32 * 1_024 * 1_024
    public struct Entry: Sendable {
        public let name: String
        public let range: Range<Int>
    }
    public struct Report: Sendable { public let entries: [Entry] }
    /// USDZ requires stored ZIP entries. Rejects ZIP64, encryption, descriptors,
    /// links and paths that escape the package before RealityKit sees the file.
    public static func inspect(_ data: Data) throws -> Report {
        guard data.count <= maximumArchiveBytes else { throw SpatialValidationError.resourceLimit }
        guard data.count >= 22 else { throw SpatialValidationError.invalidArchive }
        func u16(_ offset: Int) throws -> Int {
            guard offset >= 0, offset + 2 <= data.count else { throw SpatialValidationError.invalidArchive }
            return Int(data[offset]) | Int(data[offset + 1]) << 8
        }
        func u32(_ offset: Int) throws -> Int {
            try u16(offset) | u16(offset + 2) << 16
        }
        var end: Int?
        for offset in stride(from: data.count - 22, through: max(0, data.count - 65_557), by: -1) {
            if try u32(offset) == 0x06054b50, try offset + 22 + u16(offset + 20) == data.count { end = offset; break }
        }
        guard let end, try u16(end + 4) == 0, try u16(end + 6) == 0 else { throw SpatialValidationError.invalidArchive }
        let count = try u16(end + 10), directorySize = try u32(end + 12), directoryOffset = try u32(end + 16)
        guard count > 0, count <= 64 else { throw SpatialValidationError.resourceLimit }
        guard try u16(end + 8) == count, directoryOffset + directorySize == end else { throw SpatialValidationError.invalidArchive }
        var cursor = directoryOffset, total = 0, names: Set<String> = [], ranges: [Range<Int>] = [], entries: [Entry] = []
        let allowed = Set(["usd", "usda", "usdc", "png", "jpg", "jpeg"])
        for _ in 0..<count {
            guard try u32(cursor) == 0x02014b50, cursor + 46 <= end else { throw SpatialValidationError.invalidArchive }
            let flags = try u16(cursor + 8), method = try u16(cursor + 10)
            let packed = try u32(cursor + 20), expanded = try u32(cursor + 24)
            let nameLength = try u16(cursor + 28), extraLength = try u16(cursor + 30), commentLength = try u16(cursor + 32)
            let local = try u32(cursor + 42), externalMode = try u32(cursor + 38) >> 16
            guard flags & ~0x0800 == 0, method == 0, packed == expanded,
                  externalMode & 0xF000 != 0xA000, try u16(cursor + 34) == 0,
                  cursor + 46 + nameLength + extraLength + commentLength <= end else { throw SpatialValidationError.invalidArchive }
            total += expanded
            guard total <= maximumArchiveBytes else { throw SpatialValidationError.resourceLimit }
            let nameBytes = data[(cursor + 46)..<(cursor + 46 + nameLength)]
            guard let name = String(data: nameBytes, encoding: .utf8), !name.isEmpty, name.utf8.count <= 240,
                  !name.hasPrefix("/"), !name.contains("\\"), !name.contains(":"),
                  !name.split(separator: "/", omittingEmptySubsequences: false).contains(where: { $0 == ".." || $0 == "." || $0.isEmpty }),
                  !name.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }),
                  allowed.contains((name as NSString).pathExtension.lowercased()), names.insert(name.lowercased()).inserted else { throw SpatialValidationError.invalidArchive }
            guard try u32(local) == 0x04034b50, try u16(local + 6) == flags, try u16(local + 8) == method,
                  try u32(local + 18) == packed, try u32(local + 22) == expanded else { throw SpatialValidationError.invalidArchive }
            let localNameLength = try u16(local + 26), localExtraLength = try u16(local + 28)
            let payload = local + 30 + localNameLength + localExtraLength
            guard payload + packed <= directoryOffset, localNameLength == nameLength,
                  data[(local + 30)..<(local + 30 + localNameLength)] == nameBytes,
                  !ranges.contains(where: { $0.overlaps(local..<(payload + packed)) }) else { throw SpatialValidationError.invalidArchive }
            ranges.append(local..<(payload + packed))
            entries.append(Entry(name: name, range: payload..<(payload + packed)))
            cursor += 46 + nameLength + extraLength + commentLength
        }
        guard cursor == end, let first = entries.first,
              ["usd", "usda", "usdc"].contains((first.name as NSString).pathExtension.lowercased()) else { throw SpatialValidationError.invalidArchive }
        var textureCount = 0, totalPixels = 0
        for entry in entries where ["png", "jpg", "jpeg"].contains((entry.name as NSString).pathExtension.lowercased()) {
            textureCount += 1
            guard textureCount <= 16,
                  let source = CGImageSourceCreateWithData(data.subdata(in: entry.range) as CFData, [kCGImageSourceShouldCache: false] as CFDictionary),
                  CGImageSourceGetCount(source) == 1,
                  let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
                  let width = properties[kCGImagePropertyPixelWidth] as? Int,
                  let height = properties[kCGImagePropertyPixelHeight] as? Int,
                  width > 0, height > 0, width <= 4_096, height <= 4_096 else { throw SpatialValidationError.resourceLimit }
            totalPixels += width * height
            guard totalPixels <= 16_777_216 else { throw SpatialValidationError.resourceLimit }
        }
        return Report(entries: entries)
    }
}
