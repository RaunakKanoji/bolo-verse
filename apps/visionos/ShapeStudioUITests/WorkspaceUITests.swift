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

    func testVolumeAndInspectorOpen() throws {
        let app = XCUIApplication()
        app.launch()
        let open = app.buttons["open-product-volume"]
        XCTAssertTrue(open.waitForExistence(timeout: 20))
        open.tap()
        XCTAssertTrue(app.buttons["Import USDZ"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["Reset"].exists)
        app.buttons["Reset"].tap()
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
