import Foundation
import Testing
@testable import ShapeStudioCore

private let draftProjectID = "20000000-0000-4000-8000-000000000001"
private func draftSnapshot(revision: Int64 = 4, text: String = "Saved prompt", canEdit: Bool = true) -> CreativeDraftSnapshot {
    .init(projectId: draftProjectID, revision: revision, document: .init(schemaVersion: .value1, mode: .image, prompts: .init(image: text, video: "", audio: "", model3d: "")), updatedAt: nil, canEdit: canEdit)
}

private actor DraftFixture: DraftProviding {
    let initial: CreativeDraftSnapshot
    let failure: APIClientError?
    private(set) var submissions: [SaveCreativeDraft] = []
    init(initial: CreativeDraftSnapshot = draftSnapshot(), failure: APIClientError? = nil) {
        self.initial = initial; self.failure = failure
    }
    func get(projectID: String) async throws -> CreativeDraftSnapshot { initial }
    func save(projectID: String, input: SaveCreativeDraft) async throws -> CreativeDraftSnapshot {
        submissions.append(input)
        if let failure { throw failure }
        return draftSnapshot(revision: 5, text: input.document.prompts.image)
    }
}

private actor HeldDraftFixture: DraftProviding {
    let holdLoad: Bool
    private var load: CheckedContinuation<CreativeDraftSnapshot, any Error>?
    private var write: CheckedContinuation<CreativeDraftSnapshot, any Error>?
    private var loadWaiter: CheckedContinuation<Void, Never>?
    private var writeWaiter: CheckedContinuation<Void, Never>?
    init(holdLoad: Bool = false) { self.holdLoad = holdLoad }
    func get(projectID: String) async throws -> CreativeDraftSnapshot {
        if !holdLoad { return draftSnapshot() }
        return try await withCheckedThrowingContinuation { load = $0; loadWaiter?.resume(); loadWaiter = nil }
    }
    func save(projectID: String, input: SaveCreativeDraft) async throws -> CreativeDraftSnapshot {
        try await withCheckedThrowingContinuation { write = $0; writeWaiter?.resume(); writeWaiter = nil }
    }
    func waitForLoad() async { if load == nil { await withCheckedContinuation { loadWaiter = $0 } } }
    func waitForWrite() async { if write == nil { await withCheckedContinuation { writeWaiter = $0 } } }
    func finishLoad() { load?.resume(returning: draftSnapshot()); load = nil }
    func finishWrite() { write?.resume(returning: draftSnapshot(revision: 5, text: "Submitted prompt")); write = nil }
}

@MainActor struct PromptDraftStateTests {
    @Test func localModesKeepIndependentPromptsAndRespectUTF16Limit() {
        let state = PromptDraftState()
        state.setPrompt("Image idea")
        state.selectMode(.audio)
        state.setPrompt(String(repeating: "🙂", count: 1001))
        #expect(state.currentPrompt.utf16.count == 2000)
        #expect(state.currentPrompt.count == 1000)
        state.selectMode(.image)
        #expect(state.currentPrompt == "Image idea")
        #expect(state.isDirty && state.canEdit)
        state.clear()
        #expect(state.currentPrompt.isEmpty && !state.isDirty)
    }

    @Test func sharedDraftUsesRevisionAndBecomesCleanAfterSave() async {
        let fixture = DraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        #expect(state.currentPrompt == "Saved prompt")
        #expect(state.snapshot?.revision == 4 && !state.isDirty)
        state.setPrompt("Changed prompt")
        await state.save()
        let input = await fixture.submissions.first
        #expect(input?.expectedRevision == 4)
        #expect(input?.document.prompts.image == "Changed prompt")
        #expect(state.snapshot?.revision == 5 && !state.isDirty)
    }

    @Test func revisionConflictKeepsUnsavedText() async {
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: DraftFixture(failure: .server(status: 409, code: "CONFLICT", retryable: false)))
        state.setPrompt("Keep this work")
        await state.save()
        #expect(state.currentPrompt == "Keep this work")
        #expect(state.snapshot?.revision == 4)
        #expect(state.isDirty && state.errorMessage != nil && !state.isSaving)
    }

    @Test func readonlyDraftCannotBeChangedOrSubmitted() async {
        let fixture = DraftFixture(initial: draftSnapshot(canEdit: false))
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Unauthorized edit")
        await state.save()
        #expect(!state.canEdit && state.currentPrompt == "Saved prompt")
        #expect(await fixture.submissions.isEmpty)
    }
}

extension PromptDraftStateTests {
    @Test func clearingSessionDiscardsALateDraftLoad() async {
        let fixture = HeldDraftFixture(holdLoad: true)
        let state = PromptDraftState()
        let loading = Task { await state.bind(projectID: draftProjectID, service: fixture) }
        await fixture.waitForLoad()
        state.clear()
        await fixture.finishLoad()
        await loading.value
        #expect(state.snapshot == nil && state.projectID == nil)
        #expect(state.currentPrompt.isEmpty && !state.isDirty && !state.isLoading)
    }

    @Test func clearingSessionDiscardsALateSave() async {
        let fixture = HeldDraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Submitted prompt")
        let saving = Task { await state.save() }
        await fixture.waitForWrite()
        state.clear()
        await fixture.finishWrite()
        await saving.value
        #expect(state.snapshot == nil && state.projectID == nil && state.currentPrompt.isEmpty)
    }

    @Test func editsDuringSaveAreRetainedAsDirtyAgainstTheNewRevision() async {
        let fixture = HeldDraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Submitted prompt")
        let saving = Task { await state.save() }
        await fixture.waitForWrite()
        state.setPrompt("Newer unsaved prompt")
        await fixture.finishWrite()
        await saving.value
        #expect(state.currentPrompt == "Newer unsaved prompt")
        #expect(state.snapshot?.revision == 5 && state.isDirty)
    }

    @Test func cancellationDiscardsALateSaveWithoutClearingText() async {
        let fixture = HeldDraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Submitted prompt")
        let saving = Task { await state.save() }
        await fixture.waitForWrite()
        saving.cancel()
        await fixture.finishWrite()
        await saving.value
        #expect(state.currentPrompt == "Submitted prompt")
        #expect(state.snapshot?.revision == 4 && state.isDirty && state.errorMessage == nil)
    }
}

extension PromptDraftStateTests {
    @Test func rebindingTheSameProjectPreservesUnsavedPrompts() async {
        let fixture = DraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Unsaved text from another window")
        await state.bind(projectID: draftProjectID, service: fixture)
        #expect(state.currentPrompt == "Unsaved text from another window" && state.isDirty)
        #expect(state.snapshot?.revision == 4)
    }

    @Test func rebindingTheSameProjectDoesNotInterruptAnInFlightSave() async {
        let fixture = HeldDraftFixture()
        let state = PromptDraftState()
        await state.bind(projectID: draftProjectID, service: fixture)
        state.setPrompt("Submitted prompt")
        let saving = Task { await state.save() }
        await fixture.waitForWrite()
        await state.bind(projectID: draftProjectID, service: fixture)
        #expect(state.isSaving && state.currentPrompt == "Submitted prompt")
        await fixture.finishWrite()
        await saving.value
        #expect(state.snapshot?.revision == 5 && !state.isDirty)
    }
}

extension PromptDraftStateTests {
    @Test func rebindingRetriesACanceledInitialLoadWithoutASnapshot() async {
        let fixture = HeldDraftFixture(holdLoad: true)
        let state = PromptDraftState()
        let loading = Task { await state.bind(projectID: draftProjectID, service: fixture) }
        await fixture.waitForLoad()
        loading.cancel()
        await fixture.finishLoad()
        await loading.value
        #expect(state.snapshot == nil && !state.isLoading)

        await state.bind(projectID: draftProjectID, service: DraftFixture())
        #expect(state.currentPrompt == "Saved prompt")
        #expect(state.snapshot?.revision == 4 && state.canEdit && !state.isLoading)
    }
}
