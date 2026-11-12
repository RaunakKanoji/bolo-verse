import XCTest

@MainActor
final class WorkspaceUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    func testLocalWorkspaceAndPromptModes() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["A little more space to create."].waitForExistence(timeout: 20))
        XCTAssertFalse(app.buttons["Sign in"].isEnabled, "An unconfigured app must not start fake authentication")
        app.buttons["Create"].tap()
        let prompt = app.textViews["creative-prompt"]
        XCTAssertTrue(prompt.waitForExistence(timeout: 5))
        prompt.tap()
        prompt.typeText("A calm product launch")
        app.buttons["Video"].tap()
        XCTAssertEqual(prompt.value as? String, "")
        app.buttons["Image"].tap()
        XCTAssertEqual(prompt.value as? String, "A calm product launch")
        XCTAssertFalse(app.buttons["Save draft"].isEnabled)
        app.buttons["Workspace"].tap()
        app.buttons["Create"].tap()
        XCTAssertEqual(prompt.value as? String, "A calm product launch")
    }

    func testRepeatedProductOpenDoesNotCreateEmptyDuplicateWindows() throws {
        let app = XCUIApplication()
        app.launch()
        let open = app.buttons["open-product-volume"]
        XCTAssertTrue(open.waitForExistence(timeout: 20))
        open.tap()
        XCTAssertTrue(app.buttons["Import USDZ"].waitForExistence(timeout: 15))
        open.tap()
        XCTAssertFalse(app.staticTexts["This workspace already has an open product volume."].waitForExistence(timeout: 3))
        XCTAssertEqual(app.buttons.matching(identifier: "Import USDZ").count, 1)
    }

    func testProductVolumeReturnsToWorkspaceAndReopensAfterClosing() throws {
        let app = XCUIApplication()
        app.launch()
        let heading = app.staticTexts["A little more space to create."]
        XCTAssertTrue(heading.waitForExistence(timeout: 20))
        app.buttons["open-product-volume"].tap()
        let returnToWorkspace = app.buttons["volume-open-workspace"]
        XCTAssertTrue(returnToWorkspace.waitForExistence(timeout: 15))
        returnToWorkspace.tap()
        XCTAssertTrue(heading.isHittable)
        // Bring the existing volume forward before interacting with its ornament.
        app.buttons["open-product-volume"].tap()
        let close = app.buttons["close-product-volume"]
        let hittable = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true"), object: close)
        XCTAssertEqual(XCTWaiter.wait(for: [hittable], timeout: 10), .completed)
        close.tap()
        XCTAssertTrue(returnToWorkspace.waitForNonExistence(timeout: 10))
        app.buttons["open-product-volume"].tap()
        XCTAssertTrue(returnToWorkspace.waitForExistence(timeout: 15))
        XCTAssertFalse(app.staticTexts["This workspace already has an open product volume."].exists)
        let model = app.otherElements["Procedural product study"]
        // The rendered model is present in simulator display captures after reopening,
        // but its reused RealityKit entity is missing from the automation AX snapshot.
        // Keep this strict expected failure visible until that registration issue is fixed.
        XCTExpectFailure("Reopened RealityKit model is missing from the visionOS 26 simulator accessibility snapshot; see native-validation.md") {
            XCTAssertTrue(model.waitForExistence(timeout: 3))
        }
        app.terminate()
        app.launch()
        XCTAssertTrue(heading.waitForExistence(timeout: 20))
        XCTAssertTrue(heading.isHittable)
    }

    func testProductModelIsAvailableForInteraction() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["open-product-volume"].waitForExistence(timeout: 20))
        app.buttons["open-product-volume"].tap()
        let model = app.otherElements["Procedural product study"]
        XCTAssertTrue(model.waitForExistence(timeout: 15), app.debugDescription)
        XCTAssertTrue(model.isHittable)
    }

    func testVolumeAndInspectorOpen() throws {
        let app = XCUIApplication()
        app.launch()
        let open = app.buttons["open-product-volume"]
        XCTAssertTrue(open.waitForExistence(timeout: 20))
        open.tap()
        XCTAssertTrue(app.buttons["Import USDZ"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["Reset"].exists)
        app.buttons["Reset"].tap()
        app.buttons["Spatial controls"].tap()
        XCTAssertTrue(app.buttons["inspector-open-workspace"].waitForExistence(timeout: 10))
        app.buttons["inspector-open-workspace"].tap()
        let heading = app.staticTexts["A little more space to create."]
        XCTAssertTrue(heading.waitForExistence(timeout: 10))
        XCTAssertTrue(heading.isHittable)
    }

    func testExplicitImmersiveEntryAndExit() throws {
        let app = XCUIApplication()
        app.launch()
        let enter = app.buttons["enter-immersive"]
        XCTAssertTrue(enter.waitForExistence(timeout: 20))
        if !enter.isHittable { app.scrollViews.firstMatch.swipeUp() }
        enter.tap()
        let exit = app.buttons["immersive-exit"]
        XCTAssertTrue(exit.waitForExistence(timeout: 20))
        exit.tap()
        XCTAssertTrue(enter.waitForExistence(timeout: 15))
        XCTAssertTrue(enter.isEnabled)
    }
}
