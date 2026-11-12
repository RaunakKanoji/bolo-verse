import Foundation
import ShapeStudioCore

/// App-private local files, never backend assets. Documents contain UUIDs, not paths.
enum LocalModelStore {
    nonisolated static func modelURL(id: UUID) throws -> URL {
        try directory().appendingPathComponent(id.uuidString).appendingPathExtension("usdz")
    }

    nonisolated static func prepare(_ source: URL) throws -> URL {
        guard source.isFileURL, source.pathExtension.lowercased() == "usdz" else {
            throw SpatialValidationError.invalidArchive
        }
        let accessed = source.startAccessingSecurityScopedResource()
        defer { if accessed { source.stopAccessingSecurityScopedResource() } }
        let values = try source.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
        guard values.isRegularFile == true, values.isSymbolicLink != true,
              let size = values.fileSize, size <= USDZPreflight.maximumArchiveBytes else {
            throw SpatialValidationError.resourceLimit
        }
        let handle = try FileHandle(forReadingFrom: source)
        defer { try? handle.close() }
        var data = Data()
        while true {
            try Task.checkCancellation()
            let remaining = USDZPreflight.maximumArchiveBytes + 1 - data.count
            guard remaining > 0 else { throw SpatialValidationError.resourceLimit }
            guard let chunk = try handle.read(upToCount: min(65_536, remaining)), !chunk.isEmpty else { break }
            data.append(chunk)
        }
        return try prepare(data: data)
    }

    nonisolated static func prepare(data: Data) throws -> URL {
        try Task.checkCancellation()
        _ = try USDZPreflight.inspect(data)
        try Task.checkCancellation()
        let temporary = FileManager.default.temporaryDirectory.appendingPathComponent("ShapeStudio-\(UUID()).usdz")
        try data.write(to: temporary, options: [.atomic, .completeFileProtection])
        return temporary
    }

    nonisolated static func retain(_ temporary: URL, id: UUID) throws {
        let directory = try directory()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let existing = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.fileSizeKey])
        let size = try existing.reduce(0) { try $0 + ($1.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0) }
        let incoming = try temporary.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
        guard existing.count < 8, size + incoming <= 128 * 1_024 * 1_024 else { throw SpatialValidationError.resourceLimit }
        let destination = try modelURL(id: id)
        try FileManager.default.moveItem(at: temporary, to: destination)
        var excluded = destination
        var values = URLResourceValues(); values.isExcludedFromBackup = true
        try excluded.setResourceValues(values)
    }

    nonisolated static func removeAll() throws {
        let directory = try directory()
        if FileManager.default.fileExists(atPath: directory.path) { try FileManager.default.removeItem(at: directory) }
    }

    nonisolated private static func directory() throws -> URL {
        try FileManager.default.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
            .appendingPathComponent("ShapeStudio/LocalModels", isDirectory: true)
    }
}
