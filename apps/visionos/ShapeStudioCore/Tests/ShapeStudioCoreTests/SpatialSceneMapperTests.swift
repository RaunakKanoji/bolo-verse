import Foundation
import Testing
@testable import ShapeStudioCore

struct SpatialSceneMapperTests {
    private let project = "11111111-1111-4111-8111-111111111111"
    private let asset = "22222222-2222-4222-8222-222222222222"
    private let otherAsset = "33333333-3333-4333-8333-333333333333"

    @Test func sourceBasisPreservesPhysicalCoordinatesAcrossSaveAndRestore() throws {
        let basis = SpatialModelBasis(center: .init(1, 0, 0), normalizationScale: 0.5)
        let transform = SpatialTransform(position: .init(0.1, 0, 0), rotation: .init(0, 1, 0, 0))
        let input = try CanonicalSceneMapper.saveInput(snapshot: snapshot([]), assetID: asset, newObjectID: "stable_object", transform: transform, visible: true, basis: basis)
        let saved = try #require(input.document.objects.first)
        #expect(abs(saved.position[0] - 0.6) < 0.000001)
        #expect(saved.rotation == [0, 1, 0, 0])
        #expect(saved.scale == [0.5, 0.5, 0.5])
        let object = SpatialSceneSnapshotDocumentObjectsItem(id: saved.id, assetId: saved.assetId, position: saved.position, rotation: saved.rotation, scale: saved.scale, visible: saved.visible)
        let restored = try CanonicalSceneMapper.viewerTransform(object: object, basis: basis, halfExtents: .init(0.4, 0.4, 0.4))
        #expect(abs(restored.position.x - 0.1) < 0.000001)
        #expect(restored.rotation == transform.rotation)
        #expect(restored.scale == 1)
    }

    @Test func savePreservesOtherObjectsStableIdentityAndRevision() throws {
        let existing = object(id: "existing_object", assetID: asset)
        let untouched = object(id: "another_object", assetID: otherAsset, position: [5, 6, 7], scale: [1, 2, 3])
        let input = try CanonicalSceneMapper.saveInput(snapshot: snapshot([untouched, existing]), assetID: asset, newObjectID: "wrong_new_id", transform: .init(scale: 2), visible: false, basis: .identity)
        #expect(input.expectedRevision == 7)
        #expect(input.document.objects.count == 2)
        #expect(input.document.objects[0].position == [5, 6, 7])
        #expect(input.document.objects[0].scale == [1, 2, 3])
        #expect(input.document.objects[1].id == "existing_object")
        #expect(input.document.objects[1].scale == [2, 2, 2])
        #expect(!input.document.objects[1].visible)
    }

    @Test func restoreRejectsAnisotropicAndOutOfBoundsInsteadOfClamping() {
        #expect(throws: CanonicalSceneMappingError.self) {
            try CanonicalSceneMapper.viewerTransform(object: object(id: "one", assetID: asset, scale: [1, 2, 1]), basis: .identity, halfExtents: .init(0.4, 0.4, 0.4))
        }
        #expect(throws: CanonicalSceneMappingError.self) {
            try CanonicalSceneMapper.viewerTransform(object: object(id: "one", assetID: asset, position: [5, 0, 0]), basis: .identity, halfExtents: .init(0.4, 0.4, 0.4))
        }
    }

    @Test func saveRejectsReadOnlyAmbiguousInstancesAndUnsupportedPhysicalScale() {
        var readOnly = snapshot([]); readOnly.canEdit = false
        #expect(throws: CanonicalSceneMappingError.self) {
            try CanonicalSceneMapper.saveInput(snapshot: readOnly, assetID: asset, newObjectID: "new", transform: .init(), visible: true, basis: .identity)
        }
        #expect(throws: CanonicalSceneMappingError.self) {
            try CanonicalSceneMapper.saveInput(snapshot: snapshot([object(id: "a", assetID: asset), object(id: "b", assetID: asset)]), assetID: asset, newObjectID: "new", transform: .init(), visible: true, basis: .identity)
        }
        #expect(throws: CanonicalSceneMappingError.self) {
            try CanonicalSceneMapper.saveInput(snapshot: snapshot([]), assetID: asset, newObjectID: "new", transform: .init(), visible: true, basis: .init(center: .init(), normalizationScale: 0.001))
        }
    }

    private func snapshot(_ objects: [SpatialSceneSnapshotDocumentObjectsItem]) -> SpatialSceneSnapshot {
        .init(projectId: project, sceneId: project, revision: 7, document: .init(sceneId: project, version: .value1, objects: objects), updatedAt: nil, canEdit: true)
    }
    private func object(id: String, assetID: String, position: [Double] = [0, 0, 0], scale: [Double] = [1, 1, 1]) -> SpatialSceneSnapshotDocumentObjectsItem {
        .init(id: id, assetId: assetID, position: position, rotation: [0, 0, 0, 1], scale: scale, visible: true)
    }
}
