import SwiftUI
import ShapeStudioCore

struct ProjectsView: View {
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.openWindow) private var openWindow
    @State private var pendingProject: String?
    @State private var discardPresented = false

    var body: some View {
        Group {
            if let state = dependencies.projects, dependencies.authentication.session.isAuthenticated {
                NavigationSplitView {
                    List(state.projects, id: \.id) { project in
                        Button {
                            guard project.id != state.selectedProject?.id else { return }
                            if coordinator.prompt.isDirty || coordinator.spatial.projectID != nil {
                                pendingProject = project.id; discardPresented = true
                            } else { selectProject(project.id) }
                        } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(project.name).font(.headline)
                                Text(project.objective).font(.caption).foregroundStyle(.secondary).lineLimit(2)
                            }.padding(.vertical, 7)
                        }.buttonStyle(.plain)
                    }
                    .navigationTitle("Projects")
                    .overlay { if state.projects.isEmpty && !state.isLoading { Text("No authorized projects yet.").foregroundStyle(.secondary) } }
                    .toolbar { Button("Refresh", systemImage: "arrow.clockwise") { Task { await state.loadProjects() } }.disabled(state.isLoading) }
                } detail: {
                    if let project = state.selectedProject {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 22) {
                                Text(project.name).font(.largeTitle.bold())
                                Text(project.objective).font(.title3).textSelection(.enabled)
                                if project.sample { SpatialStatusIndicator(title: "Sample project", symbol: "leaf") }
                                Button("Open asset library", systemImage: "square.stack") { openWindow(id: "assets") }
                                CreativeStudioView().frame(minHeight: 400)
                            }.padding(30)
                        }
                    } else { ContentUnavailableView("Choose a project", systemImage: "folder", description: Text("Select a project to view its brief and creative assets.")) }
                }
                .overlay(alignment: .bottom) {
                    if state.isLoading { ProgressView("Loading workspace…").padding().glassBackgroundEffect() }
                    else if let error = state.errorMessage { Text(error).font(.callout).padding().glassBackgroundEffect() }
                }
            } else {
                UnavailableModule(title: "Your projects, connected", symbol: "folder.badge.person.crop", detail: dependencies.configurationMessage ?? "Sign in from the main workspace to load projects you are authorized to access. No sample project is substituted for private data.")
            }
        }
        .onChange(of: dependencies.projects?.selectedProject?.id) { _, _ in coordinator.selectedAsset = nil }
        .confirmationDialog("Discard unsaved prompts and model changes, then switch projects?", isPresented: $discardPresented, titleVisibility: .visible) {
            Button("Discard and switch", role: .destructive) {
                if let id = pendingProject { selectProject(id) }
                pendingProject = nil
            }
            Button("Keep editing", role: .cancel) { pendingProject = nil }
        }
    }
    private func selectProject(_ id: String) {
        coordinator.clearPrivateSelection()
        Task { await dependencies.projects?.selectProject(id) }
    }
}
