import Foundation
import RealityKit
import ShapeStudioCore
import XCTest
import simd
@testable import ShapeStudio

/// App-hosted on the visionOS simulator/device: these exercise the real RealityKit loader.
@MainActor
final class RealityKitImportTests: XCTestCase {
    func testProceduralStudyGesturesHistoryAndResizedVolumeBounds() throws {
        let workspace = SpatialWorkspace()
        XCTAssertTrue(workspace.hasModel)
        XCTAssertNil(workspace.errorMessage)
        XCTAssertNotNil(workspace.objectPivot.components[InputTargetComponent.self])
        XCTAssertNotNil(workspace.objectPivot.components[CollisionComponent.self])
        XCTAssertTrue(workspace.objectPivot.components[AccessibilityComponent.self]?.isAccessibilityElement == true)

        // Both drag values are cumulative from the beginning of the same gesture.
        workspace.drag([0.1, 0, 0])
        workspace.drag([0.2, 0, 0])
        workspace.endDrag()
        XCTAssertEqual(workspace.objectPivot.position.x, 0.2, accuracy: 0.0001)
        workspace.undo()
        XCTAssertEqual(workspace.objectPivot.position.x, 0, accuracy: 0.0001)
        workspace.redo()
        XCTAssertEqual(workspace.objectPivot.position.x, 0.2, accuracy: 0.0001)

        workspace.setVolumeBounds(BoundingBox(min: [-0.4, -0.3, -0.2], max: [0.4, 0.3, 0.2]))
        workspace.setTransform(.init(position: .init(3, -3, 3), rotation: .init(0, 0.6, 0, 0.8), scale: 3))
        XCTAssertNil(workspace.errorMessage)
        XCTAssertEqual(workspace.objectPivot.scale.x, 1.125, accuracy: 0.0001)
        assertVisualBoundsInside(workspace, halfExtents: [0.4, 0.3, 0.2])

        // Resize constrains the actual RealityKit entity immediately, independently of UI updates.
        workspace.setVolumeBounds(BoundingBox(min: [-0.2, -0.2, -0.15], max: [0.2, 0.2, 0.15]))
        assertVisualBoundsInside(workspace, halfExtents: [0.2, 0.2, 0.15])
    }

    func testRealUSDZImportsAndRestoresStableLocalDocument() async throws {
        let fixture = try fixtureURL()
        let workspace = SpatialWorkspace()
        await workspace.importModel(from: fixture)
        XCTAssertNil(workspace.errorMessage, workspace.errorMessage ?? "")
        guard case .localUSDZ(let modelID, _) = workspace.document.source else {
            XCTFail("The real USDZ did not replace the procedural study."); return
        }
        // Remove only the file created by this test; never erase another import.
        defer {
            if let file = try? LocalModelStore.modelURL(id: modelID) { try? FileManager.default.removeItem(at: file) }
        }
        XCTAssertFalse(workspace.isLoading)
        XCTAssertEqual(workspace.modelBasis.center.x, 0.25, accuracy: 0.001)
        XCTAssertEqual(workspace.modelBasis.center.y, 0.5, accuracy: 0.001)
        XCTAssertEqual(workspace.modelBasis.center.z, -0.125, accuracy: 0.001)
        XCTAssertNotNil(workspace.root.findEntity(named: "OffsetBox"))

        let halfAngle = sqrt(0.5)
        workspace.setTransform(.init(position: .init(0.05, -0.02, 0.03), rotation: .init(0, halfAngle, 0, halfAngle), scale: 1.25))
        workspace.setVisible(false)
        let expected = workspace.document
        let exported = try workspace.exportDocument()

        let restored = SpatialWorkspace()
        try await restored.restoreDocument(from: exported)
        XCTAssertNil(restored.errorMessage)
        XCTAssertEqual(restored.document, expected)
        XCTAssertFalse(restored.objectPivot.isEnabled)
        XCTAssertEqual(restored.objectPivot.position.x, 0.05, accuracy: 0.0001)
        XCTAssertEqual(restored.objectPivot.scale.x, 1.25, accuracy: 0.0001)
        restored.setVisible(true)
        assertVisualBoundsInside(restored, halfExtents: [0.4, 0.4, 0.4])
    }

    func testFailedAndCancelledImportsRetainTheRealProjectModel() async throws {
        let bytes = try Data(contentsOf: fixtureURL())
        let workspace = SpatialWorkspace()
        let projectID = "11111111-1111-4111-8111-111111111111"
        let assetID = "22222222-2222-4222-8222-222222222222"
        await workspace.importBackendModel(data: bytes, assetID: assetID, projectID: projectID, name: "Fixture model")
        XCTAssertNil(workspace.errorMessage, workspace.errorMessage ?? "")
        XCTAssertEqual(workspace.projectAssetID, assetID)
        XCTAssertNotNil(workspace.root.findEntity(named: "OffsetBox"))
        let original = workspace.document

        await workspace.importBackendModel(data: Data([0, 1, 2]), assetID: "invalid_asset", projectID: projectID, name: "Invalid model")
        XCTAssertNotNil(workspace.errorMessage)
        XCTAssertEqual(workspace.document, original)
        XCTAssertFalse(workspace.isLoading)

        // Cancel before this MainActor task starts: this deterministically exercises caller cancellation.
        let cancelled = Task { @MainActor in
            await workspace.importBackendModel(data: bytes, assetID: "cancelled_asset", projectID: projectID, name: "Cancelled model")
        }
        cancelled.cancel()
        await cancelled.value
        XCTAssertEqual(workspace.document, original)
        XCTAssertFalse(workspace.isLoading)
        XCTAssertEqual(workspace.projectAssetID, assetID)
        XCTAssertThrowsError(try workspace.exportDocument(), "Project content must not become a persistent local import.")
        assertVisualBoundsInside(workspace, halfExtents: [0.4, 0.4, 0.4])
    }

    private func fixtureURL() throws -> URL {
        let bundle = Bundle(for: RealityKitImportTests.self)
        return try XCTUnwrap(bundle.url(forResource: "bounded-product", withExtension: "usdz", subdirectory: "Fixtures")
                             ?? bundle.url(forResource: "bounded-product", withExtension: "usdz"), "Copy the USDZ fixture into the test bundle resources.")
    }

    private func assertVisualBoundsInside(_ workspace: SpatialWorkspace, halfExtents: SIMD3<Float>, file: StaticString = #filePath, line: UInt = #line) {
        let bounds = workspace.objectPivot.visualBounds(relativeTo: workspace.root)
        XCTAssertFalse(bounds.isEmpty, file: file, line: line)
        for axis in 0..<3 {
            XCTAssertTrue(bounds.min[axis].isFinite && bounds.max[axis].isFinite, file: file, line: line)
            XCTAssertGreaterThanOrEqual(bounds.min[axis], -halfExtents[axis] + 0.019, file: file, line: line)
            XCTAssertLessThanOrEqual(bounds.max[axis], halfExtents[axis] - 0.019, file: file, line: line)
        }
    }
}
