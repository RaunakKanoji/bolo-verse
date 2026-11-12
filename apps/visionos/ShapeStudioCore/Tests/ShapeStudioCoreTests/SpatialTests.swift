import Foundation
import Testing
@testable import ShapeStudioCore

struct SpatialTests {
    @Test func rejectsNonfiniteAndInvalidTransforms() throws {
        #expect(throws: SpatialValidationError.self) {
            try SpatialTransform(position: .init(.nan, 0, 0)).validated()
        }
        #expect(throws: SpatialValidationError.self) {
            try SpatialTransform(rotation: .init(0, 0, 0, 0)).validated()
        }
        #expect(throws: SpatialValidationError.self) {
            try SpatialTransform(scale: -1).validated()
        }
        #expect(throws: SpatialValidationError.self) {
            try SpatialTransform(rotation: .init(0, 0, 0, 2)).validated()
        }
    }

    @Test func sphereStaysInsideResizedVolumeWithArbitraryRotation() throws {
        let transform = SpatialTransform(position: .init(10, -10, 10), rotation: .init(0, 0.6, 0, 0.8), scale: 2)
        let bounded = try transform.constrained(halfExtents: .init(0.4, 0.3, 0.2), radius: 0.16, margin: 0.02)
        #expect(abs(bounded.scale - 1.125) < 0.00001)
        #expect(abs(bounded.position.x - 0.2) < 0.00001)
        #expect(abs(bounded.position.y + 0.1) < 0.00001)
        #expect(abs(bounded.position.z) < 0.00001)
        #expect(bounded.rotation == transform.rotation)
        #expect(throws: SpatialValidationError.self) {
            try transform.constrained(halfExtents: .init(0, 0, 0), radius: 0.16)
        }
    }

    @Test func gesturesApplyCumulativeValuesToTheStartingTransform() {
        let gesture = SpatialGestureTransform(start: SpatialTransform(position: .init(0.1, 0, 0), scale: 1.5))
        #expect(gesture.translated(by: .init(0.1, 0, 0)).position.x == 0.2)
        #expect(abs(gesture.translated(by: .init(0.2, 0, 0)).position.x - 0.3) < 0.00001)
        #expect(gesture.scaled(by: 1.5).scale == 2.25)
        #expect(gesture.scaled(by: 2).scale == 3)
        let rotated = gesture.rotated(by: .init(0, 1, 0, 0))
        #expect(rotated.rotation == .init(0, 1, 0, 0))
    }

    @Test func undoRedoDropsAbandonedFutureAndIgnoresNoOps() {
        var history = SpatialHistory()
        history.record(.init(scale: 2))
        history.record(.init(scale: 2))
        #expect(history.undo()?.scale == 1)
        #expect(history.undo() == nil)
        #expect(history.redo()?.scale == 2)
        _ = history.undo()
        history.record(.init(scale: 0.5))
        #expect(history.redo() == nil)
        #expect(history.current.scale == 0.5)
    }

    @Test func localDocumentRoundTripsStableIDsWithoutAbsolutePaths() throws {
        let modelID = UUID()
        let document = SpatialDocument(source: .localUSDZ(id: modelID, name: "Bottle.usdz"), transform: .init(scale: 1.2))
        let data = try document.encoded()
        let restored = try SpatialDocument.decode(data)
        #expect(restored == document)
        #expect(restored.source == .localUSDZ(id: modelID, name: "Bottle.usdz"))
        #expect(throws: SpatialValidationError.self) {
            try SpatialDocument(source: .localUSDZ(id: modelID, name: "../secret.usdz")).encoded()
        }
    }

    @Test func documentRejectsUnknownVersionAndMalformedVectors() throws {
        let encoded = try SpatialDocument().encoded()
        var json = try #require(JSONSerialization.jsonObject(with: encoded) as? [String: Any])
        json["version"] = 999
        #expect(throws: (any Error).self) { try SpatialDocument.decode(JSONSerialization.data(withJSONObject: json)) }
        json["version"] = 1
        json["transform"] = ["position": [0, 0], "rotation": [0, 0, 0, 1], "scale": 1]
        #expect(throws: (any Error).self) { try SpatialDocument.decode(JSONSerialization.data(withJSONObject: json)) }
    }

    @Test func projectSourcePreservesAuthorizedIDsWithoutAcceptingPaths() throws {
        let source = SpatialDocument.Source.projectUSDZ(assetID: "asset_123", projectID: "project_123", name: "Product")
        let restored = try SpatialDocument.decode(SpatialDocument(source: source).encoded())
        #expect(restored.source == source)
        #expect(throws: SpatialValidationError.self) {
            try SpatialDocument(source: .projectUSDZ(assetID: "../asset", projectID: "project_123", name: "Product")).encoded()
        }
    }

    @Test func usdzPreflightAcceptsStoredStageAndRejectsCompressedOrEscapingResources() throws {
        let archive = zip(entries: [("model.usda", Data("#usda 1.0".utf8))])
        #expect(try USDZPreflight.inspect(archive).entries.first?.name == "model.usda")
        #expect(throws: SpatialValidationError.self) { try USDZPreflight.inspect(zip(entries: [("../model.usda", Data())])) }
        #expect(throws: SpatialValidationError.self) { try USDZPreflight.inspect(zip(entries: [("model.usda", Data())], method: 8)) }
        #expect(throws: SpatialValidationError.self) { try USDZPreflight.inspect(zip(entries: [("model.usda", Data()), ("script.js", Data())])) }
        #expect(throws: SpatialValidationError.self) { try USDZPreflight.inspect(archive.prefix(archive.count - 4)) }
    }

    @Test func usdzPreflightRejectsOversizedExpansionAndDuplicateEntries() {
        #expect(throws: SpatialValidationError.self) {
            try USDZPreflight.inspect(zip(entries: [("model.usda", Data())], declaredSize: 100_000_000))
        }
        #expect(throws: SpatialValidationError.self) {
            try USDZPreflight.inspect(zip(entries: [("model.usda", Data()), ("model.usda", Data())]))
        }
    }

    @Test func usdzPreflightRejectsInvalidTextureBeforeNativeLoading() {
        #expect(throws: SpatialValidationError.self) {
            try USDZPreflight.inspect(zip(entries: [("model.usda", Data()), ("texture.png", Data([0, 1, 2]))]))
        }
    }

    // Small stored ZIP fixtures; intentionally independent of the production parser.
    private func zip(entries: [(String, Data)], method: UInt16 = 0, declaredSize: UInt32? = nil) -> Data {
        var result = Data(), directory = Data()
        func word<T: FixedWidthInteger>(_ number: T) -> Data { withUnsafeBytes(of: number.littleEndian) { Data($0) } }
        for (name, payload) in entries {
            let nameData = Data(name.utf8), offset = UInt32(result.count), size = declaredSize ?? UInt32(payload.count)
            result += word(UInt32(0x04034b50)) + word(UInt16(20)) + word(UInt16(0)) + word(method)
            result += Data(repeating: 0, count: 8) + word(size) + word(size) + word(UInt16(nameData.count)) + word(UInt16(0))
            result += nameData + payload
            directory += word(UInt32(0x02014b50)) + word(UInt16(20)) + word(UInt16(20)) + word(UInt16(0)) + word(method)
            directory += Data(repeating: 0, count: 8) + word(size) + word(size) + word(UInt16(nameData.count))
            directory += Data(repeating: 0, count: 12) + word(offset) + nameData
        }
        let offset = UInt32(result.count)
        result += directory
        result += word(UInt32(0x06054b50)) + Data(repeating: 0, count: 4) + word(UInt16(entries.count)) + word(UInt16(entries.count))
        result += word(UInt32(directory.count)) + word(offset) + word(UInt16(0))
        return result
    }
}
