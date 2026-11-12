import SwiftUI
import ShapeStudioCore

struct AssetLibraryView: View {
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.openWindow) private var openWindow
    @State private var loadingAssetID: String?
    @State private var loadError: String?
    @State private var loadTask: Task<Void, Never>?
    @State private var discardPresented = false

    var body: some View {
        NavigationStack {
            if let state = dependencies.projects, let project = state.selectedProject,
               dependencies.authentication.session.isAuthenticated {
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text(project.name).font(.title2.bold())
                        Text("Ready assets in this project. The service returns up to 100 recent records.").foregroundStyle(.secondary)
                        if state.isLoading { ProgressView("Loading assets…") }
                        if let error = state.errorMessage { Text(error).foregroundStyle(.orange) }
                        if let loadError { Text(loadError).foregroundStyle(.orange) }
                        if loadingAssetID != nil { ProgressView("Preparing private model…") }
                        if state.assets.isEmpty && !state.isLoading {
                            ContentUnavailableView("No ready assets", systemImage: "photo.on.rectangle.angled", description: Text("Uploaded or generated assets will appear when they are ready in the shared backend."))
                        }
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 220))], spacing: 20) {
                            ForEach(state.assets, id: \.id) { asset in
                                Button {
                                    open(asset, projectID: project.id)
                                } label: {
                                    VStack(alignment: .leading, spacing: 12) {
                                        Image(systemName: asset.mimeType.hasPrefix("image/") ? "photo" : "doc")
                                            .font(.largeTitle).foregroundStyle(SpatialDesign.accent)
                                        Text(asset.mimeType).font(.headline)
                                        Text(ByteCountFormatter.string(fromByteCount: asset.byteSize, countStyle: .file)).font(.caption).foregroundStyle(.secondary)
                                        Text(String(asset.id.prefix(8))).font(.caption.monospaced()).foregroundStyle(.secondary)
                                        Label("Inspect asset", systemImage: "arrow.up.right").font(.callout)
                                    }.frame(maxWidth: .infinity, alignment: .leading).padding(20)
                                }.buttonStyle(.bordered).disabled(loadingAssetID != nil)
                            }
                        }
                    }.padding(28)
                }
                .toolbar { Button("Refresh", systemImage: "arrow.clockwise") {
                    if coordinator.prompt.isDirty || coordinator.spatial.projectID != nil { discardPresented = true }
                    else { Task { await state.selectProject(project.id) } }
                }.disabled(state.isLoading) }
                .confirmationDialog("Refreshing closes the current model. Discard unsaved prompts and model changes?", isPresented: $discardPresented, titleVisibility: .visible) {
                    Button("Discard and refresh", role: .destructive) { Task { await state.selectProject(project.id) } }
                }
                .navigationTitle("Asset Library")
            } else {
                UnavailableModule(title: "Open a project first", symbol: "square.stack", detail: "Choose an authorized project from Projects to browse its private assets. Local USDZ files can be opened separately in Spatial controls.")
            }
        }
        .onChange(of: dependencies.authentication.session.revision) { _, _ in cancelLoad() }
        .onChange(of: dependencies.projects?.selectedProject?.id) { _, _ in cancelLoad() }
        .onDisappear { cancelLoad() }
    }
    private func cancelLoad() {
        loadTask?.cancel(); loadTask = nil; loadingAssetID = nil
    }
    private func open(_ asset: AssetSummary, projectID: String) {
        guard asset.nativeContentUrl != nil, let client = dependencies.client else {
            coordinator.selectedAsset = asset
            openWindow(id: "media-preview")
            return
        }
        let sessionRevision = dependencies.authentication.session.revision
        loadingAssetID = asset.id; loadError = nil
        loadTask = Task {
            do {
                let data = try await AssetService(client: client).modelData(asset: asset)
                try Task.checkCancellation()
                guard sessionRevision == dependencies.authentication.session.revision,
                      projectID == dependencies.projects?.selectedProject?.id else { return }
                await coordinator.spatial.importBackendModel(data: data, assetID: asset.id, projectID: projectID, name: "Project model \(asset.id.prefix(8))")
                try Task.checkCancellation()
                guard sessionRevision == dependencies.authentication.session.revision,
                      projectID == dependencies.projects?.selectedProject?.id else { return }
                if coordinator.spatial.projectAssetID == asset.id {
                    openWindow(id: "spatial-controls"); openWindow(id: "product-volume")
                } else { loadError = coordinator.spatial.errorMessage }
            } catch is CancellationError { }
            catch { if !Task.isCancelled { loadError = error.localizedDescription } }
            if !Task.isCancelled, loadingAssetID == asset.id { loadingAssetID = nil; loadTask = nil }
        }
    }
}
