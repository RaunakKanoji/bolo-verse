import Foundation

public enum SpatialValidationError: Error, LocalizedError, Sendable {
    case invalidTransform, invalidDocument, invalidVolume, invalidArchive, resourceLimit
    public var errorDescription: String? {
        switch self {
        case .invalidTransform: "The object transform contains invalid values."
        case .invalidDocument: "This is not a supported Shape Studio local scene document."
        case .invalidVolume: "The volume is too small to display this object."
        case .invalidArchive: "Import a self-contained, uncompressed USDZ with USD and PNG or JPEG resources."
        case .resourceLimit: "This model exceeds the local viewer's resource limits."
        }
    }
}

public struct SpatialVector3: Codable, Equatable, Sendable {
    public var x: Double, y: Double, z: Double
    public init(_ x: Double = 0, _ y: Double = 0, _ z: Double = 0) { self.x = x; self.y = y; self.z = z }
    public init(from decoder: any Decoder) throws {
        var values = try decoder.unkeyedContainer()
        x = try values.decode(Double.self); y = try values.decode(Double.self); z = try values.decode(Double.self)
        guard values.isAtEnd else { throw SpatialValidationError.invalidTransform }
    }
    public func encode(to encoder: any Encoder) throws {
        var values = encoder.unkeyedContainer(); try values.encode(x); try values.encode(y); try values.encode(z)
    }
}

public struct SpatialQuaternion: Codable, Equatable, Sendable {
    public var x: Double, y: Double, z: Double, w: Double
    public init(_ x: Double = 0, _ y: Double = 0, _ z: Double = 0, _ w: Double = 1) { self.x = x; self.y = y; self.z = z; self.w = w }
    public init(from decoder: any Decoder) throws {
        var values = try decoder.unkeyedContainer()
        x = try values.decode(Double.self); y = try values.decode(Double.self); z = try values.decode(Double.self); w = try values.decode(Double.self)
        guard values.isAtEnd else { throw SpatialValidationError.invalidTransform }
    }
    public func encode(to encoder: any Encoder) throws {
        var values = encoder.unkeyedContainer(); try values.encode(x); try values.encode(y); try values.encode(z); try values.encode(w)
    }
}

/// Right-handed metres, +Y up, -Z forward. Rotation is XYZW; scale is uniform.
public struct SpatialTransform: Codable, Equatable, Sendable {
    public var position: SpatialVector3
    public var rotation: SpatialQuaternion
    public var scale: Double
    public init(position: SpatialVector3 = .init(), rotation: SpatialQuaternion = .init(), scale: Double = 1) {
        self.position = position; self.rotation = rotation; self.scale = scale
    }
    @discardableResult public func validated() throws -> Self {
        let values = [position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, rotation.w, scale]
        let norm = rotation.x * rotation.x + rotation.y * rotation.y + rotation.z * rotation.z + rotation.w * rotation.w
        guard values.allSatisfy(\.isFinite), scale > 0, scale <= 100,
              abs(position.x) <= 100, abs(position.y) <= 100, abs(position.z) <= 100,
              abs(norm - 1) < 0.001 else { throw SpatialValidationError.invalidTransform }
        return self
    }
    public func constrained(halfExtents: SpatialVector3, radius: Double, margin: Double = 0.02) throws -> Self {
        try validated()
        guard [halfExtents.x, halfExtents.y, halfExtents.z, radius, margin].allSatisfy(\.isFinite),
              radius > 0, margin >= 0 else { throw SpatialValidationError.invalidVolume }
        let maximum = min(halfExtents.x, halfExtents.y, halfExtents.z) - margin
        guard maximum > 0 else { throw SpatialValidationError.invalidVolume }
        var result = self
        let upperScale = min(3, maximum / radius)
        result.scale = min(max(scale, min(0.1, upperScale)), upperScale)
        let extent = radius * result.scale + margin
        func clamp(_ value: Double, _ half: Double) -> Double {
            let limit = max(0, half - extent)
            return min(limit, max(-limit, value))
        }
        result.position = .init(clamp(position.x, halfExtents.x), clamp(position.y, halfExtents.y), clamp(position.z, halfExtents.z))
        return result
    }
}

public struct SpatialGestureTransform: Sendable {
    public let start: SpatialTransform
    public init(start: SpatialTransform) { self.start = start }
    public func translated(by delta: SpatialVector3) -> SpatialTransform {
        var result = start
        result.position = .init(start.position.x + delta.x, start.position.y + delta.y, start.position.z + delta.z)
        return result
    }
    public func scaled(by factor: Double) -> SpatialTransform {
        var result = start; result.scale *= factor; return result
    }
    public func rotated(by a: SpatialQuaternion) -> SpatialTransform {
        let b = start.rotation
        var result = start
        result.rotation = .init(a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
                                a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
                                a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
                                a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z)
        return result
    }
}

public struct SpatialHistory: Sendable {
    public private(set) var current: SpatialTransform
    private var past: [SpatialTransform] = []
    private var future: [SpatialTransform] = []
    public init(_ transform: SpatialTransform = .init()) { current = transform }
    public var canUndo: Bool { !past.isEmpty }
    public var canRedo: Bool { !future.isEmpty }
    public mutating func record(_ transform: SpatialTransform) {
        guard transform != current else { return }
        past.append(current)
        if past.count > 50 { past.removeFirst() }
        future.removeAll(); current = transform
    }
    public mutating func undo() -> SpatialTransform? {
        guard let value = past.popLast() else { return nil }
        future.append(current); current = value; return value
    }
    public mutating func redo() -> SpatialTransform? {
        guard let value = future.popLast() else { return nil }
        past.append(current); current = value; return value
    }
}

public struct SpatialDocument: Codable, Equatable, Sendable {
    public enum Source: Codable, Equatable, Sendable {
        case study
        case localUSDZ(id: UUID, name: String)
        case projectUSDZ(assetID: String, projectID: String, name: String)
        public var label: String {
            switch self {
            case .study: "Procedural product study"
            case .localUSDZ(_, let name), .projectUSDZ(_, _, let name): name
            }
        }
    }
    public var version = 1
    public var sceneID: UUID
    public var objectID: UUID
    public var source: Source
    public var transform: SpatialTransform
    public var isVisible: Bool
    public init(source: Source = .study, transform: SpatialTransform = .init()) {
        sceneID = UUID(); objectID = UUID(); self.source = source; self.transform = transform; isVisible = true
    }
    private func validate() throws {
        guard version == 1 else { throw SpatialValidationError.invalidDocument }
        try transform.validated()
        if case .localUSDZ(_, let name) = source {
            guard !name.isEmpty, name.utf8.count <= 200, !name.contains("/"), !name.contains("\\"),
                  !name.unicodeScalars.contains(where: { CharacterSet.controlCharacters.contains($0) }),
                  name.lowercased().hasSuffix(".usdz") else { throw SpatialValidationError.invalidDocument }
        }
        if case .projectUSDZ(let assetID, let projectID, let name) = source {
            let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "_-"))
            guard [assetID, projectID].allSatisfy({ !$0.isEmpty && $0.utf8.count <= 128 && $0.unicodeScalars.allSatisfy(allowed.contains) }),
                  !name.isEmpty, name.utf8.count <= 200,
                  !name.unicodeScalars.contains(where: CharacterSet.controlCharacters.contains) else { throw SpatialValidationError.invalidDocument }
        }
    }
    public func encoded() throws -> Data {
        try validate()
        let encoder = JSONEncoder(); encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try encoder.encode(self)
    }
    public static func decode(_ data: Data) throws -> Self {
        guard data.count <= 16_384 else { throw SpatialValidationError.invalidDocument }
        let document = try JSONDecoder().decode(Self.self, from: data)
        try document.validate(); return document
    }
}
