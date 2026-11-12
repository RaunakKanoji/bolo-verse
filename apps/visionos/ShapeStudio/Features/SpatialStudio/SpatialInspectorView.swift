import Foundation
import ShapeStudioCore
import SwiftUI
import UniformTypeIdentifiers
import simd

struct SpatialInspectorView: View {
    @Bindable var workspace: SpatialWorkspace
    @State private var importingModel = false
    @State private var importingScene = false
    @State private var exportingScene = false
    @State private var confirmingRemoval = false
    @State private var export = LocalSceneFile()
    @State private var fileTask: Task<Void, Never>?
    @State private var pitch = 0.0
    @State private var yaw = 0.0
    @State private var roll = 0.0

    var body: some View {
        Form {
            Section(workspace.projectAssetID == nil ? "Local product studio" : "Project product studio") {
                Text(workspace.title).font(.headline)
                Text(workspace.status).foregroundStyle(.secondary)
                if let error = workspace.errorMessage {
                    Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.orange)
                }
                HStack {
                    Button("Import USDZ", systemImage: "square.and.arrow.down") { importingModel = true }
                    Button("Load study", systemImage: "cube") { workspace.loadStudy() }
                }
                .disabled(workspace.isLoading)
                if workspace.isLoading {
                    HStack { ProgressView(); Button("Cancel import") { fileTask?.cancel(); workspace.cancelLoading() } }
                }
                Text("The study is a procedural sample. Local models stay on this device and are not project assets.")
                    .font(.caption).foregroundStyle(.secondary)
            }

            Section("Selected object") {
                Toggle("Show object", isOn: Binding(get: { workspace.document.isVisible }, set: { workspace.setVisible($0) }))
                Toggle("Selected", isOn: $workspace.isSelected)
                if workspace.isSelected {
                    scalarControl("X position · metres", value: position(\.x), range: -0.35...0.35, step: 0.01)
                    scalarControl("Y position · metres", value: position(\.y), range: -0.35...0.35, step: 0.01)
                    scalarControl("Z position · metres", value: position(\.z), range: -0.35...0.35, step: 0.01)
                    scalarControl("Uniform scale", value: Binding(get: { workspace.document.transform.scale }, set: { value in
                        var transform = workspace.document.transform; transform.scale = value; workspace.setTransform(transform)
                    }), range: 0.1...3, step: 0.05)
                    scalarControl("Pitch · degrees", value: angle(\.pitch), range: -180...180, step: 5)
                    scalarControl("Yaw · degrees", value: angle(\.yaw), range: -180...180, step: 5)
                    scalarControl("Roll · degrees", value: angle(\.roll), range: -180...180, step: 5)
                    Text("+Y is up; −Z is forward. Position and size are constrained to the volume.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                HStack {
                    Button("Undo", systemImage: "arrow.uturn.backward") { workspace.undo() }.disabled(!workspace.canUndo)
                    Button("Redo", systemImage: "arrow.uturn.forward") { workspace.redo() }.disabled(!workspace.canRedo)
                    Button("Reset", systemImage: "arrow.counterclockwise") { workspace.resetTransform() }
                }
            }
            .disabled(workspace.isLoading)

            if workspace.projectAssetID != nil {
                ProjectSceneControls(workspace: workspace)
            }

            Section("Local scene document") {
                HStack {
                    Button("Export scene", systemImage: "square.and.arrow.up") {
                        do { export = LocalSceneFile(data: try workspace.exportDocument()); exportingScene = true }
                        catch { workspace.errorMessage = error.localizedDescription }
                    }
                    .disabled(workspace.projectAssetID != nil)
                    Button("Restore scene", systemImage: "arrow.clockwise") { importingScene = true }
                }
                .disabled(workspace.isLoading)
                Text("Documents store the transform and local model ID. Imported USDZ files must still be stored in this app to restore them. Models are not included in the JSON export.")
                    .font(.caption).foregroundStyle(.secondary)
                Button("Remove local imports", role: .destructive) { confirmingRemoval = true }
            }

            Section("Supported imports") {
                Text("USDZ up to 32 MiB, 64 stored files; USD with PNG/JPEG textures. Maximum texture dimension 4,096 pixels, 16 megapixels total. Models are limited to 256 entities, 250,000 vertices/triangles and 64 material slots.")
                    .font(.caption).foregroundStyle(.secondary)
                Text("The app retains at most 8 local models and 128 MiB. Removing imports also makes their saved documents unavailable until reimported.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Product inspector")
        .fileImporter(isPresented: $importingModel, allowedContentTypes: [.usdz]) { result in
            handleImport(result, isModel: true)
        }
        .fileImporter(isPresented: $importingScene, allowedContentTypes: [.json]) { result in
            handleImport(result, isModel: false)
        }
        .fileExporter(isPresented: $exportingScene, document: export, contentType: .json, defaultFilename: "Shape Studio Local Scene") { result in
            if case .failure(let error) = result { workspace.errorMessage = error.localizedDescription }
        }
        .confirmationDialog("Remove all imported models from this device? Saved documents will no longer find those models.", isPresented: $confirmingRemoval, titleVisibility: .visible) {
            Button("Remove imports", role: .destructive) { fileTask?.cancel(); workspace.removeLocalImports() }
        }
        .onAppear { synchronizeAngles() }
        .onChange(of: workspace.document.transform.rotation) { _, _ in synchronizeAngles() }
        .onDisappear { fileTask?.cancel(); fileTask = nil }
    }

    private func scalarControl(_ title: String, value: Binding<Double>, range: ClosedRange<Double>, step: Double) -> some View {
        VStack(alignment: .leading) {
            HStack {
                Text(title)
                Spacer()
                TextField(title, value: value, format: .number.precision(.fractionLength(2)))
                    .multilineTextAlignment(.trailing).frame(width: 90)
                    .accessibilityLabel(title)
            }
            Slider(value: value, in: range, step: step) { Text(title) }
        }
    }

    private func position(_ key: WritableKeyPath<SpatialVector3, Double>) -> Binding<Double> {
        Binding(get: { workspace.document.transform.position[keyPath: key] }, set: { value in
            var transform = workspace.document.transform; transform.position[keyPath: key] = value
            workspace.setTransform(transform)
        })
    }

    private func angle(_ key: WritableKeyPath<SpatialInspectorView, Double>) -> Binding<Double> {
        Binding(get: { self[keyPath: key] }, set: { value in
            guard value.isFinite else { return }
            var pitch = self.pitch, yaw = self.yaw, roll = self.roll
            if key == \Self.pitch { pitch = value }
            else if key == \Self.yaw { yaw = value }
            else { roll = value }
            let qx = simd_quatf(angle: Float(pitch * .pi / 180), axis: [1, 0, 0])
            let qy = simd_quatf(angle: Float(yaw * .pi / 180), axis: [0, 1, 0])
            let qz = simd_quatf(angle: Float(roll * .pi / 180), axis: [0, 0, 1])
            let q = simd_normalize(qz * qy * qx)
            var transform = workspace.document.transform
            transform.rotation = .init(Double(q.imag.x), Double(q.imag.y), Double(q.imag.z), Double(q.real))
            workspace.setTransform(transform)
        })
    }

    private func synchronizeAngles() {
        let q = workspace.document.transform.rotation
        pitch = atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y)) * 180 / .pi
        yaw = asin(min(1, max(-1, 2 * (q.w * q.y - q.z * q.x)))) * 180 / .pi
        roll = atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z)) * 180 / .pi
    }

    private func handleImport(_ result: Result<URL, any Error>, isModel: Bool) {
        switch result {
        case .failure(let error): workspace.errorMessage = error.localizedDescription
        case .success(let url):
            fileTask?.cancel()
            fileTask = Task { @MainActor in
                if isModel { await workspace.importModel(from: url) }
                else {
                    let accessed = url.startAccessingSecurityScopedResource()
                    defer { if accessed { url.stopAccessingSecurityScopedResource() } }
                    do {
                        let handle = try FileHandle(forReadingFrom: url)
                        defer { try? handle.close() }
                        let data = try handle.read(upToCount: 16_385) ?? Data()
                        try await workspace.restoreDocument(from: data)
                    } catch is CancellationError {} catch { workspace.errorMessage = error.localizedDescription }
                }
            }
        }
    }
}

private struct LocalSceneFile: FileDocument {
    static let readableContentTypes: [UTType] = [.json]
    var data = Data()
    init(data: Data = Data()) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}
