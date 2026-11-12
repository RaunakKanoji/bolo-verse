import Foundation
import Observation
import ShapeStudioCore

@MainActor @Observable
final class AppDependencies {
    let authentication: ClerkAuthenticationService
    let client: APIClient?
    let projects: ProjectState?
    let capabilities: CapabilityService?
    let drafts: DraftService?
    let scenes: SceneService?
    let configurationMessage: String?
    @ObservationIgnored private var observationTask: Task<Void, Never>?
    @ObservationIgnored private var projectLoadTask: Task<Void, Never>?

    init(bundle: Bundle = .main) {
        let key = bundle.object(forInfoDictionaryKey: "SHAPE_CLERK_PUBLISHABLE_KEY") as? String
        authentication = ClerkAuthenticationService(publishableKey: key)
        let rawURL = (bundle.object(forInfoDictionaryKey: "SHAPE_API_BASE_URL") as? String ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        var resolvedClient: APIClient?
        var message: String?
        if let url = URL(string: rawURL), !rawURL.isEmpty {
            do { resolvedClient = try APIClient(baseURL: url, tokenProvider: authentication) }
            catch { message = "The backend address must be a valid HTTPS origin. Check Config/Local.xcconfig." }
        } else {
            message = "Connect the shared backend in Config/Local.xcconfig to sign in and load private projects. The local spatial study works without an account."
        }
        client = resolvedClient
        projects = resolvedClient.map { ProjectState(projectService: ProjectService(client: $0), assetService: AssetService(client: $0)) }
        capabilities = resolvedClient.map { CapabilityService(client: $0) }
        drafts = resolvedClient.map { DraftService(client: $0) }
        scenes = resolvedClient.map { SceneService(client: $0) }
        configurationMessage = message
    }

    func clearSessionData(coordinator: AppCoordinator) async {
        projectLoadTask?.cancel(); projectLoadTask = nil
        projects?.clear()
        coordinator.clearPrivateSelection()
        await client?.invalidateSession()
    }

    func startSessionObservation(coordinator: AppCoordinator) {
        guard observationTask == nil else { return }
        projects?.onSelectionInvalidated = { [weak coordinator] in coordinator?.clearPrivateSelection() }
        observationTask = Task { [weak self] in
            guard let self else { return }
            await authentication.observeSessionChanges { [weak self] in
                guard let self else { return }
                let revision = self.authentication.session.revision
                await self.clearSessionData(coordinator: coordinator)
                guard self.authentication.session.revision == revision,
                      self.authentication.session.isAuthenticated else { return }
                self.projectLoadTask = Task { [weak self] in
                    guard let self, self.authentication.session.revision == revision else { return }
                    await self.projects?.loadProjects()
                }
            }
        }
    }
}
