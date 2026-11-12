import SwiftUI
import UIKit
import UniformTypeIdentifiers
import ShapeStudioCore

private struct PreviewPNG: FileDocument {
    static let readableContentTypes: [UTType] = [.png]
    var data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct NativeMediaPreview: View {
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @State private var png: Data?
    @State private var image: UIImage?
    @State private var errorMessage: String?
    @State private var zoom = 1.0
    @State private var exportPresented = false
    @State private var retry = 0
    private let decoder = ImagePreviewDecoder()

    private var identity: String { "\(dependencies.authentication.session.revision):\(coordinator.selectedAsset?.id ?? "none"):\(retry)" }
    var body: some View {
        NavigationStack {
            Group {
                if let asset = coordinator.selectedAsset, dependencies.authentication.session.isAuthenticated {
                    if !["image/png", "image/jpeg", "image/webp"].contains(asset.mimeType) {
                        UnavailableModule(title: "Native preview unavailable", symbol: "doc", detail: "This asset is \(asset.mimeType). Native video and audio previews are not connected yet. Eligible USDZ assets open from the asset library in a product volume.")
                    } else if let image {
                        ScrollView([.horizontal, .vertical]) {
                            Image(uiImage: image).resizable().scaledToFit()
                                .frame(width: min(image.size.width, 720) * zoom)
                                .accessibilityLabel("Authorized project image preview")
                        }.padding(24)
                    } else if let errorMessage {
                        VStack(spacing: 20) {
                            ContentUnavailableView("Preview could not load", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                            Button("Retry") { retry += 1 }
                        }
                    } else { ProgressView("Loading private preview…") }
                } else { ContentUnavailableView("Choose an asset", systemImage: "photo", description: Text("Select an image from an authorized project's Asset Library.")) }
            }
            .navigationTitle("Creative Preview")
            .toolbar {
                ToolbarItemGroup(placement: .bottomOrnament) {
                    Button("Zoom out", systemImage: "minus.magnifyingglass") { zoom = max(0.5, zoom - 0.25) }.disabled(image == nil || zoom <= 0.5)
                    Text("\(Int(zoom * 100))%")
                    Button("Zoom in", systemImage: "plus.magnifyingglass") { zoom = min(3, zoom + 0.25) }.disabled(image == nil || zoom >= 3)
                    Button("Fit") { zoom = 1 }.disabled(image == nil)
                    Button("Export preview", systemImage: "square.and.arrow.up") { exportPresented = true }.disabled(png == nil)
                }
            }
        }
        .task(id: identity) {
            png = nil; image = nil; errorMessage = nil; zoom = 1
            guard let asset = coordinator.selectedAsset, let client = dependencies.client,
                  dependencies.authentication.session.isAuthenticated,
                  ["image/png", "image/jpeg", "image/webp"].contains(asset.mimeType) else { return }
            do {
                let data = try await AssetService(client: client).preview(asset: asset)
                let decoded = try await decoder.thumbnailPNG(from: data)
                try Task.checkCancellation()
                png = decoded; image = UIImage(data: decoded)
            } catch is CancellationError { }
            catch { if !Task.isCancelled { errorMessage = error.localizedDescription } }
        }
        .fileExporter(isPresented: $exportPresented, document: png.map { PreviewPNG(data: $0) }, contentType: .png, defaultFilename: "shape-preview") { result in
            if case .failure(let error) = result { errorMessage = error.localizedDescription }
        }
        .onDisappear { png = nil; image = nil }
    }
}
