import SwiftUI

@main @MainActor
struct ShapeStudioApp: App {
    @State private var dependencies = AppDependencies()
    @State private var coordinator = AppCoordinator()

    var body: some Scene {
        WindowGroup("Shape Studio", id: "workspace") {
            WorkspaceView()
                .environment(dependencies).environment(coordinator)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }
        .defaultSize(width: 1120, height: 760)

        WindowGroup("Projects", id: "projects") {
            ProjectsView().environment(dependencies).environment(coordinator)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }.defaultSize(width: 940, height: 700)

        WindowGroup("Asset Library", id: "assets") {
            AssetLibraryView().environment(dependencies).environment(coordinator)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }.defaultSize(width: 850, height: 680)

        WindowGroup("Creative Preview", id: "media-preview") {
            NativeMediaPreview().environment(dependencies).environment(coordinator)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }.defaultSize(width: 800, height: 700)

        WindowGroup("Shape AI", id: "assistant") {
            UnavailableModule(title: "Shape AI", symbol: "sparkles", detail: "The existing web project assistant remains available. Native conversation and microphone services are not connected yet. No audio is being recorded.")
        }.defaultSize(width: 560, height: 620)

        WindowGroup("Client review", id: "review") {
            UnavailableModule(title: "Client review", symbol: "checkmark.bubble", detail: "Native review, comments and approval actions will connect to the shared backend when those versioned services are available. No local example represents client approval.")
        }.defaultSize(width: 720, height: 620)

        WindowGroup("Spatial controls", id: "spatial-controls") {
            SpatialInspectorView(workspace: coordinator.spatial)
                .frame(minWidth: 420, minHeight: 520)
                .environment(dependencies).environment(coordinator)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }.defaultSize(width: 520, height: 740)

        WindowGroup("Product volume", id: "product-volume") {
            ProductVolumeView(workspace: coordinator.spatial)
                .task { dependencies.startSessionObservation(coordinator: coordinator) }
        }
        .windowStyle(.volumetric)
        .defaultSize(width: 0.8, height: 0.8, depth: 0.8, in: .meters)

        ImmersiveSpace(id: "CreativeEnvironment") {
            CreativeEnvironmentView().environment(coordinator)
        }
        .immersionStyle(selection: .constant(.mixed), in: .mixed)
    }
}
