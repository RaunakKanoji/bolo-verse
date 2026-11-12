import Observation
import ShapeStudioCore

@MainActor @Observable
final class AppCoordinator {
    var selectedAsset: AssetSummary?
    var immersive = ImmersivePresentationState()
    let spatial = SpatialWorkspace()
    let prompt = PromptDraftState()

    func clearPrivateSelection() {
        selectedAsset = nil
        prompt.clear()
        spatial.loadStudy()
    }
}
