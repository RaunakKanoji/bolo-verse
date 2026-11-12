import Foundation
import Observation

public enum PromptMode: String, CaseIterable, Sendable {
    case image, video, audio, model3d
}

public protocol DraftProviding: Sendable {
    func get(projectID: String) async throws -> CreativeDraftSnapshot
    func save(projectID: String, input: SaveCreativeDraft) async throws -> CreativeDraftSnapshot
}
extension DraftService: DraftProviding { }

@MainActor @Observable
public final class PromptDraftState {
    public static let promptLimit = 2000
    public private(set) var snapshot: CreativeDraftSnapshot?
    public private(set) var projectID: String?
    public private(set) var isLoading = false
    public private(set) var isSaving = false
    public private(set) var errorMessage: String?
    public var mode: PromptMode { content.mode }
    public var currentPrompt: String { content.prompts[mode, default: ""] }
    public var canEdit: Bool { projectID == nil || snapshot?.canEdit == true }
    public var isDirty: Bool { canEdit && content != baseline }
    private var content = PromptContent.empty
    private var baseline = PromptContent.empty
    @ObservationIgnored private var service: (any DraftProviding)?
    @ObservationIgnored private var generation: UInt64 = 0
    @ObservationIgnored private var loadTask: Task<CreativeDraftSnapshot, any Error>?
    @ObservationIgnored private var saveTask: Task<CreativeDraftSnapshot, any Error>?

    public init() { }

    public func setPrompt(_ text: String) {
        guard canEdit else { return }
        var bounded = ""
        var count = 0
        for character in text {
            let length = character.utf16.count
            guard count + length <= Self.promptLimit else { break }
            bounded.append(character)
            count += length
        }
        content.prompts[mode] = bounded
    }

    public func selectMode(_ mode: PromptMode) { content.mode = mode }

    public func bind(projectID: String?, service: (any DraftProviding)?) async {
        // Several windows may bind one project. Preserve existing work and active operations;
        // a canceled or failed initial load with no snapshot can retry when a view returns.
        if projectID == self.projectID {
            guard projectID != nil, snapshot == nil, !isLoading, !isSaving else { return }
        }
        clear()
        self.projectID = projectID
        self.service = service
        guard let projectID else { return }
        guard let service else { errorMessage = APIClientError.unavailable.localizedDescription; return }
        isLoading = true
        let requestGeneration = generation
        let task = Task { try await service.get(projectID: projectID) }
        loadTask = task
        defer { if requestGeneration == generation { isLoading = false; loadTask = nil } }
        do {
            let result = try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }
            guard requestGeneration == generation, !Task.isCancelled else { return }
            guard result.projectId == projectID else { throw APIClientError.invalidResponse }
            snapshot = result
            content = PromptContent(result)
            baseline = content
        } catch {
            guard requestGeneration == generation, !Task.isCancelled else { return }
            if !(error is CancellationError) { errorMessage = safeMessage(error) }
        }
    }

    public func save() async {
        guard !isLoading, !isSaving, canEdit, isDirty else { return }
        guard let projectID, let service, let snapshot else {
            errorMessage = "Choose a project to save this draft."
            return
        }
        isSaving = true
        errorMessage = nil
        let submitted = content
        let input = SaveCreativeDraft(expectedRevision: snapshot.revision, document: submitted.saveDocument)
        let requestGeneration = generation
        let task = Task { try await service.save(projectID: projectID, input: input) }
        saveTask = task
        defer { if requestGeneration == generation { isSaving = false; saveTask = nil } }
        do {
            let result = try await withTaskCancellationHandler { try await task.value } onCancel: { task.cancel() }
            guard requestGeneration == generation, !Task.isCancelled else { return }
            guard result.projectId == projectID else { throw APIClientError.invalidResponse }
            self.snapshot = result
            baseline = PromptContent(result)
            if content == submitted { content = baseline }
        } catch {
            guard requestGeneration == generation, !Task.isCancelled else { return }
            if !(error is CancellationError) { errorMessage = safeMessage(error) }
        }
    }

    public func clear() {
        generation &+= 1
        loadTask?.cancel()
        saveTask?.cancel()
        loadTask = nil
        saveTask = nil
        projectID = nil
        snapshot = nil
        service = nil
        content = .empty
        baseline = .empty
        isLoading = false
        isSaving = false
        errorMessage = nil
    }

    private func safeMessage(_ error: any Error) -> String {
        (error as? APIClientError)?.localizedDescription ?? APIClientError.unavailable.localizedDescription
    }
}

private struct PromptContent: Equatable, Sendable {
    var mode: PromptMode
    var prompts: [PromptMode: String]
    static let empty = Self(mode: .image, prompts: [.image: "", .video: "", .audio: "", .model3d: ""])

    init(mode: PromptMode, prompts: [PromptMode: String]) { self.mode = mode; self.prompts = prompts }
    init(_ snapshot: CreativeDraftSnapshot) {
        mode = PromptMode(rawValue: snapshot.document.mode.rawValue) ?? .image
        let value = snapshot.document.prompts
        prompts = [.image: value.image, .video: value.video, .audio: value.audio, .model3d: value.model3d]
    }
    var saveDocument: SaveCreativeDraftDocument {
        let saveMode: SaveCreativeDraftDocumentMode
        switch mode {
        case .image: saveMode = .image
        case .video: saveMode = .video
        case .audio: saveMode = .audio
        case .model3d: saveMode = .model3d
        }
        return .init(schemaVersion: .value1, mode: saveMode, prompts: .init(image: prompts[.image, default: ""], video: prompts[.video, default: ""], audio: prompts[.audio, default: ""], model3d: prompts[.model3d, default: ""]))
    }
}
