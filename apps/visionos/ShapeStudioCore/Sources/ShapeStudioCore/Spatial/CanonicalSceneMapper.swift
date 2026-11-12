import Foundation

public struct SpatialModelBasis: Equatable, Sendable {
    public var center: SpatialVector3
    public var normalizationScale: Double
    public static let identity = Self(center: .init(), normalizationScale: 1)
    public init(center: SpatialVector3, normalizationScale: Double) { self.center = center; self.normalizationScale = normalizationScale }
}

public enum CanonicalSceneMappingError: Error, LocalizedError, Sendable {
    case readOnly, ambiguousAsset, unsupportedTransform, outsideVolume, invalidSnapshot
    public var errorDescription: String? {
        switch self {
        case .readOnly: "This project scene is read-only for your account."
        case .ambiguousAsset: "This scene has several instances of this asset. The single-object viewer cannot choose an instance safely."
        case .unsupportedTransform: "This transform is outside the shared scene's supported range or uses different scale values on each axis. It was not changed."
        case .outsideVolume: "The saved object does not fit in this volume. Its saved transform was not applied or changed."
        case .invalidSnapshot: "Reload the project scene before saving. The scene data is unsupported."
        }
    }
}

public enum CanonicalSceneMapper {
    public static func viewerTransform(object: SpatialSceneSnapshotDocumentObjectsItem, basis: SpatialModelBasis, halfExtents: SpatialVector3, radius: Double = 0.16) throws -> SpatialTransform {
        try validate(basis)
        guard object.position.count == 3, object.rotation.count == 4, object.scale.count == 3,
              object.position.allSatisfy({ $0.isFinite && abs($0) <= 30 }),
              object.scale.allSatisfy({ $0.isFinite && (0.1...10).contains($0) }),
              abs(object.scale[0] - object.scale[1]) <= 0.000001,
              abs(object.scale[0] - object.scale[2]) <= 0.000001 else { throw CanonicalSceneMappingError.unsupportedTransform }
        let rotation = SpatialQuaternion(object.rotation[0], object.rotation[1], object.rotation[2], object.rotation[3])
        let offset = rotate(basis.center, by: rotation, scale: object.scale[0])
        let transform = SpatialTransform(position: .init(object.position[0] + offset.x, object.position[1] + offset.y, object.position[2] + offset.z), rotation: rotation, scale: object.scale[0] / basis.normalizationScale)
        do {
            try transform.validated()
            let constrained = try transform.constrained(halfExtents: halfExtents, radius: radius)
            guard abs(constrained.position.x - transform.position.x) <= 0.000001,
                  abs(constrained.position.y - transform.position.y) <= 0.000001,
                  abs(constrained.position.z - transform.position.z) <= 0.000001,
                  abs(constrained.scale - transform.scale) <= 0.000001 else { throw CanonicalSceneMappingError.outsideVolume }
        } catch let error as CanonicalSceneMappingError { throw error }
        catch { throw CanonicalSceneMappingError.unsupportedTransform }
        return transform
    }

    public static func selectedObject(snapshot: SpatialSceneSnapshot, assetID: String) throws -> SpatialSceneSnapshotDocumentObjectsItem? {
        let matches = snapshot.document.objects.filter { $0.assetId == assetID }
        guard matches.count <= 1 else { throw CanonicalSceneMappingError.ambiguousAsset }
        return matches.first
    }

    public static func saveInput(snapshot: SpatialSceneSnapshot, assetID: String, newObjectID: String, transform: SpatialTransform, visible: Bool, basis: SpatialModelBasis) throws -> SaveSpatialScene {
        guard snapshot.canEdit else { throw CanonicalSceneMappingError.readOnly }
        guard snapshot.projectId == snapshot.sceneId, snapshot.document.sceneId == snapshot.sceneId,
              snapshot.revision >= 0, snapshot.revision <= 2_147_483_646,
              snapshot.document.objects.count <= 50,
              Set(snapshot.document.objects.map(\.id)).count == snapshot.document.objects.count else { throw CanonicalSceneMappingError.invalidSnapshot }
        try validate(basis)
        try transform.validated()
        let existing = try selectedObject(snapshot: snapshot, assetID: assetID)
        guard existing != nil || snapshot.document.objects.count < 50 else { throw CanonicalSceneMappingError.invalidSnapshot }
        let physicalScale = transform.scale * basis.normalizationScale
        let offset = rotate(basis.center, by: transform.rotation, scale: physicalScale)
        let position = [transform.position.x - offset.x, transform.position.y - offset.y, transform.position.z - offset.z]
        guard physicalScale.isFinite, (0.1...10).contains(physicalScale), position.allSatisfy({ $0.isFinite && abs($0) <= 30 }) else {
            throw CanonicalSceneMappingError.unsupportedTransform
        }
        let q = transform.rotation
        let norm = sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
        let updated = SaveSpatialSceneDocumentObjectsItem(id: existing?.id ?? newObjectID, assetId: assetID, position: position,
                                                         rotation: [q.x / norm, q.y / norm, q.z / norm, q.w / norm],
                                                         scale: [physicalScale, physicalScale, physicalScale], visible: visible)
        var objects = snapshot.document.objects.map {
            SaveSpatialSceneDocumentObjectsItem(id: $0.id, assetId: $0.assetId, position: $0.position, rotation: $0.rotation, scale: $0.scale, visible: $0.visible)
        }
        if let existing, let index = objects.firstIndex(where: { $0.id == existing.id }) { objects[index] = updated }
        else { objects.append(updated) }
        return SaveSpatialScene(expectedRevision: snapshot.revision, document: .init(sceneId: snapshot.sceneId, version: .value1, objects: objects))
    }

    private static func validate(_ basis: SpatialModelBasis) throws {
        guard [basis.center.x, basis.center.y, basis.center.z, basis.normalizationScale].allSatisfy(\.isFinite), basis.normalizationScale > 0 else {
            throw CanonicalSceneMappingError.unsupportedTransform
        }
    }

    private static func rotate(_ vector: SpatialVector3, by q: SpatialQuaternion, scale: Double) -> SpatialVector3 {
        let x = vector.x * scale, y = vector.y * scale, z = vector.z * scale
        let tx = 2 * (q.y * z - q.z * y), ty = 2 * (q.z * x - q.x * z), tz = 2 * (q.x * y - q.y * x)
        return .init(x + q.w * tx + q.y * tz - q.z * ty,
                     y + q.w * ty + q.z * tx - q.x * tz,
                     z + q.w * tz + q.x * ty - q.y * tx)
    }
}
