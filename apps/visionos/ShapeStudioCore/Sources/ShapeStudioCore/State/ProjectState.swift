import Foundation
import Observation

@MainActor @Observable
public final class ProjectState {
    @ObservationIgnored public var onSelectionInvalidated: (@MainActor () -> Void)?
    public private(set) var projects: [ProjectSummary] = []
    public private(set) var selectedProject: ProjectSummary?
    public private(set) var assets: [AssetSummary] = []
    public private(set) var hasMoreAssets = false
    public private(set) var errorMessage: String?
    public var isLoading: Bool { listRequestID != nil || selectionRequestID != nil }
    private let projectService: ProjectService
    private let assetService: AssetService
    private var listRequestID: UUID?
    private var selectionRequestID: UUID?
    private var selectionProjectID: String?
    @ObservationIgnored private var listTask: Task<[ProjectSummary], any Error>?
    @ObservationIgnored private var selectionTask: Task<(ProjectSummary, AssetPage), any Error>?

    public init(projectService: ProjectService, assetService: AssetService) {
        self.projectService = projectService
        self.assetService = assetService
    }

    public func loadProjects() async {
        listTask?.cancel()
        let id = UUID()
        listRequestID = id
        errorMessage = nil
        let task = Task { [projectService] in try await projectService.list() }
        listTask = task
        defer {
            if listRequestID == id { listRequestID = nil; listTask = nil }
        }
        do {
            let result = try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }
            guard listRequestID == id, !Task.isCancelled else { return }
            projects = result
            if let selectionProjectID, !result.contains(where: { $0.id == selectionProjectID }) {
                invalidateSelection()
            }
        } catch {
            guard listRequestID == id, !(error is CancellationError), !Task.isCancelled else { return }
            errorMessage = (error as? APIClientError)?.localizedDescription ?? APIClientError.unavailable.localizedDescription
        }
    }

    public func selectProject(_ id: String) async {
        invalidateSelection()
        let requestID = UUID()
        selectionRequestID = requestID
        selectionProjectID = id
        errorMessage = nil
        let task = Task { [projectService, assetService] in
            async let project = projectService.get(id: id)
            async let page = assetService.list(projectID: id)
            return try await (project, page)
        }
        selectionTask = task
        defer {
            if selectionRequestID == requestID { selectionRequestID = nil; selectionTask = nil }
        }
        do {
            let (project, page) = try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }
            guard selectionRequestID == requestID, !Task.isCancelled else { return }
            selectedProject = project
            assets = page.assets
            hasMoreAssets = page.hasMore
        } catch {
            guard selectionRequestID == requestID, !(error is CancellationError), !Task.isCancelled else { return }
            errorMessage = (error as? APIClientError)?.localizedDescription ?? APIClientError.unavailable.localizedDescription
        }
    }

    public func clear() {
        listTask?.cancel()
        listTask = nil
        listRequestID = nil
        projects = []
        invalidateSelection()
        errorMessage = nil
    }

    private func invalidateSelection() {
        selectionTask?.cancel()
        selectionTask = nil
        selectionRequestID = nil
        selectionProjectID = nil
        selectedProject = nil
        assets = []
        hasMoreAssets = false
        onSelectionInvalidated?()
    }
}
