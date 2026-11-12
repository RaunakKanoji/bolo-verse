import Foundation
import ShapeStudioCore
import SwiftUI

/// Reads may refresh automatically; applying or saving a transform always needs an explicit action.
struct ProjectSceneControls: View {
    let workspace: SpatialWorkspace
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @State private var snapshot: SpatialSceneSnapshot?
    @State private var snapshotContext: Context?
    @State private var requestID: UUID?
    @State private var requestTask: Task<Void, Never>?
    @State private var message: String?
    @State private var requiresReload = false

    private struct Context: Equatable {
        let subjectID: String
        let sessionRevision: UInt64
        let projectID: String
        let assetID: String
        let localObjectID: UUID
    }

    private enum Operation { case reload, save }

    private var context: Context? {
        guard coordinator.spatial === workspace,
              let subjectID = dependencies.authentication.session.subjectID,
              let projectID = workspace.projectID, let assetID = workspace.projectAssetID,
              dependencies.projects?.selectedProject?.id == projectID else { return nil }
        return Context(subjectID: subjectID, sessionRevision: dependencies.authentication.session.revision,
                       projectID: projectID, assetID: assetID, localObjectID: workspace.document.objectID)
    }

    var body: some View {
        Section("Project scene") {
            if context == nil || dependencies.scenes == nil {
                Text("Open this asset from its authorized project to save or restore a project scene.")
                    .foregroundStyle(.secondary)
            } else {
                if requestID != nil { ProgressView("Updating project scene…") }
                if let snapshot, snapshotContext == context {
                    LabeledContent("Saved revision", value: String(snapshot.revision))
                    Text(snapshot.canEdit ? "Your account can edit this project scene." : "Read-only access. You can inspect the saved transform.")
                        .font(.caption).foregroundStyle(.secondary)
                    if snapshot.document.objects.contains(where: { $0.assetId == workspace.projectAssetID }) {
                        Button("Apply saved transform", systemImage: "arrow.down.doc") { applySaved() }
                            .disabled(requestID != nil || requiresReload || workspace.isLoading)
                    } else {
                        Text("This asset has no saved instance in the project scene.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
                HStack {
                    Button("Reload scene", systemImage: "arrow.clockwise") { begin(.reload) }
                        .disabled(requestID != nil)
                    Button("Save object to project", systemImage: "square.and.arrow.up") { begin(.save) }
                        .disabled(requestID != nil || snapshot?.canEdit != true || snapshotContext != context || requiresReload || workspace.isLoading)
                }
                if let message { Text(message).font(.callout).accessibilityLabel(message) }
                Text("Saving updates this asset's single instance and preserves every other scene object. Positions use metres, with the original model's centre and scale accounted for.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .task(id: context) {
            clear()
            if context != nil { await perform(.reload) }
        }
        .onDisappear { clear() }
    }

    private func begin(_ operation: Operation) {
        requestTask?.cancel()
        requestTask = Task { @MainActor in await perform(operation) }
    }

    private func perform(_ operation: Operation) async {
        guard let expected = context, let service = dependencies.scenes else { return }
        let ticket = UUID()
        requestID = ticket; message = nil
        defer { if requestID == ticket { requestID = nil } }
        do {
            let result: SpatialSceneSnapshot
            let submittedTransform = workspace.document.transform
            switch operation {
            case .reload:
                result = try await service.get(projectID: expected.projectID)
            case .save:
                guard let snapshot, snapshotContext == expected, !requiresReload else { throw CanonicalSceneMappingError.invalidSnapshot }
                let input = try CanonicalSceneMapper.saveInput(snapshot: snapshot, assetID: expected.assetID,
                                                              newObjectID: expected.localObjectID.uuidString,
                                                              transform: submittedTransform, visible: workspace.document.isVisible,
                                                              basis: workspace.modelBasis)
                result = try await service.save(projectID: expected.projectID, input: input)
            }
            guard !Task.isCancelled, requestID == ticket, context == expected else { return }
            snapshot = result; snapshotContext = expected; requiresReload = false
            switch operation {
            case .reload: message = "Saved scene loaded. Your current object is unchanged."
            case .save:
                message = submittedTransform == workspace.document.transform
                    ? "Object saved at revision \(result.revision)."
                    : "The submitted transform was saved. Your newer local edits are still unsaved."
            }
        } catch {
            guard !Task.isCancelled, requestID == ticket, context == expected, !(error is CancellationError) else { return }
            if case APIClientError.server(let status, _, _) = error, status == 409 {
                requiresReload = true
                message = "The project scene changed elsewhere. Your local transform is retained. Reload the scene, review it, then save again."
            } else if case APIClientError.server(let status, _, _) = error, status == 403 {
                snapshot = nil; snapshotContext = nil; requiresReload = true
                message = APIClientError.server(status: 403, code: "forbidden", retryable: false).localizedDescription
            } else {
                message = (error as? CanonicalSceneMappingError)?.localizedDescription
                    ?? (error as? APIClientError)?.localizedDescription
                    ?? CanonicalSceneMappingError.invalidSnapshot.localizedDescription
            }
        }
    }

    private func applySaved() {
        guard let expected = context, let snapshot, snapshotContext == expected, !requiresReload else { return }
        do {
            guard let object = try CanonicalSceneMapper.selectedObject(snapshot: snapshot, assetID: expected.assetID) else {
                message = "This asset has no saved instance."; return
            }
            try workspace.applySavedObject(object)
            message = "Saved transform applied. Undo restores the previous transform."
        } catch { message = error.localizedDescription }
    }

    private func clear() {
        requestTask?.cancel(); requestTask = nil; requestID = nil
        snapshot = nil; snapshotContext = nil; requiresReload = false; message = nil
    }
}
