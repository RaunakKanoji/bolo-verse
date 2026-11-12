import SwiftUI
import ShapeStudioCore

struct CreativeStudioView: View {
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.openWindow) private var openWindow
    @State private var catalog: CreativeCapabilities?
    @State private var catalogError: String?
    @State private var reloadPresented = false

    private var prompt: PromptDraftState { coordinator.prompt }
    private var projectID: String? {
        dependencies.authentication.session.isAuthenticated ? dependencies.projects?.selectedProject?.id : nil
    }
    private var selectedCapability: CreativeCapabilitiesModesItem? {
        catalog?.modes.first { $0.id.rawValue == prompt.mode.rawValue }
    }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                HStack {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Creative studio").font(.title.bold())
                        Text(dependencies.projects?.selectedProject?.name ?? "Local prompt workspace").foregroundStyle(.secondary)
                    }
                    Spacer()
                    if prompt.isLoading { ProgressView("Loading draft…") }
                    else { SpatialStatusIndicator(title: prompt.isDirty ? "Unsaved changes" : (prompt.snapshot == nil ? "On this device" : "Draft loaded"), symbol: "doc.text") }
                }
                Picker("Creation mode", selection: Binding(get: { prompt.mode }, set: { prompt.selectMode($0) })) {
                    Text("Image").tag(PromptMode.image)
                    Text("Video").tag(PromptMode.video)
                    Text("Audio").tag(PromptMode.audio)
                    Text("3D").tag(PromptMode.model3d)
                }.pickerStyle(.segmented).accessibilityIdentifier("creation-mode")
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: 24) { promptPanel.frame(width: 340); previewPanel.frame(minWidth: 280) }
                    VStack(spacing: 24) { promptPanel; previewPanel }
                }
                SpatialGlassPanel(title: "Available tools", symbol: "slider.horizontal.3") {
                    Text(selectedCapability?.reason ?? catalogError ?? "Connect a backend to check supported generation capabilities.")
                        .foregroundStyle(.secondary)
                    Text("Model, resolution, reference uploads and advanced controls appear when a connected provider supports them. Prompt drafts can be saved independently.")
                        .font(.caption).foregroundStyle(.secondary)
                    Button("Generation unavailable", systemImage: "sparkles") {}.disabled(true)
                }
            }.padding(28)
        }
        .task(id: "\(dependencies.authentication.session.revision):\(projectID ?? "local")") {
            await prompt.bind(projectID: projectID, service: dependencies.drafts)
        }
        .task {
            guard let service = dependencies.capabilities else { return }
            do { catalog = try await service.get() }
            catch { catalogError = "Generation capabilities could not be loaded. Your prompt stays available." }
        }
        .confirmationDialog("Discard unsaved prompt changes and reload the saved draft?", isPresented: $reloadPresented, titleVisibility: .visible) {
            Button("Discard and reload", role: .destructive) {
                let id = projectID
                prompt.clear()
                Task { await prompt.bind(projectID: id, service: dependencies.drafts) }
            }
        }
    }
    private var promptPanel: some View {
        SpatialGlassPanel(title: "Describe your idea", symbol: "text.alignleft") {
            TextEditor(text: Binding(get: { prompt.currentPrompt }, set: { prompt.setPrompt($0) }))
                .frame(minHeight: 180).padding(10).background(.thinMaterial, in: .rect(cornerRadius: 16))
                .disabled(!prompt.canEdit || prompt.isLoading).accessibilityLabel("Creative prompt").accessibilityIdentifier("creative-prompt")
            Text("\(prompt.currentPrompt.utf16.count) / 2,000 · Private project draft").font(.caption).foregroundStyle(.secondary)
            if let error = prompt.errorMessage { Text(error).foregroundStyle(.orange).font(.callout) }
            HStack {
                Button(prompt.isSaving ? "Saving…" : "Save draft", systemImage: "square.and.arrow.down") { Task { await prompt.save() } }
                    .disabled(projectID == nil || !prompt.canEdit || prompt.isLoading || prompt.isSaving || !prompt.isDirty)
                Button("Reload") { reloadPresented = true }.disabled(projectID == nil || prompt.isLoading || prompt.isSaving)
            }
            Text(projectID == nil ? "Local prompts last for this app session. Select a project to save to your account." : "Shared across your web and native workspace. Other project members cannot read your prompt draft.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }
    private var previewPanel: some View {
        SpatialGlassPanel(title: "Give your work some room", symbol: "rectangle.on.rectangle") {
            Image(systemName: prompt.mode == .model3d ? "cube.transparent" : "photo.on.rectangle.angled")
                .font(.system(size: 64, weight: .ultraLight)).foregroundStyle(SpatialDesign.accent)
                .frame(maxWidth: .infinity, minHeight: 120).accessibilityHidden(true)
            Text("Open media in its own window, or inspect a supported USDZ in a volume.").foregroundStyle(.secondary)
            Button("Browse project assets", systemImage: "square.stack") { openWindow(id: "assets") }.disabled(projectID == nil)
            Button("Open product volume", systemImage: "cube") { openWindow(id: "spatial-controls"); openWindow(id: "product-volume") }
            Text("Generation history will appear when the shared backend supports generation jobs. No sample output is presented as a completed request.").font(.caption).foregroundStyle(.secondary)
        }
    }
}
