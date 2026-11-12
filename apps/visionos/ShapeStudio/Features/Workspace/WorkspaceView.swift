import SwiftUI
import ShapeStudioCore

private enum WorkspaceSection: String, CaseIterable, Identifiable {
    case workspace = "Workspace", create = "Create", brainstorm = "Brainstorm", projects = "Projects", review = "Review"
    var id: String { rawValue }
}

struct WorkspaceView: View {
    @Environment(AppDependencies.self) private var dependencies
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.openWindow) private var openWindow
    @State private var section = WorkspaceSection.workspace

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Picker("Workspace section", selection: $section) {
                    ForEach(WorkspaceSection.allCases) { Text($0.rawValue).tag($0) }
                }.pickerStyle(.segmented).padding(.horizontal, 28).padding(.top, 18)
                Group {
                    switch section {
                    case .workspace: overview
                    case .projects: ProjectsView()
                    case .create: CreativeStudioView()
                    case .brainstorm: UnavailableModule(title: "Bring your next idea into focus", symbol: "lightbulb", detail: "Native brainstorming and voice conversation are planned. Your existing web project assistant is unchanged.")
                    case .review: UnavailableModule(title: "Client review", symbol: "checkmark.bubble", detail: "Review and approval services are not connected to this native window yet.")
                    }
                }.frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .navigationTitle("Shape Studio")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { accountControl }
                ToolbarItemGroup(placement: .bottomOrnament) {
                    Button("Projects", systemImage: "folder") { openWindow(id: "projects") }
                    Button("Assets", systemImage: "square.stack") { openWindow(id: "assets") }
                    Button("Shape AI", systemImage: "sparkles") { openWindow(id: "assistant") }
                    Divider()
                    Button("Spatial controls", systemImage: "slider.horizontal.3") { openWindow(id: "spatial-controls") }
                }
            }
        }
        .tint(SpatialDesign.accent)
        .frame(minWidth: 740, minHeight: 580)
    }

    private var overview: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                HStack(alignment: .top, spacing: 30) {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("A little more space to create.").font(.largeTitle.bold())
                        Text("Give your ideas room. Explore a product in three dimensions, then connect your private projects.")
                            .font(.title3).foregroundStyle(.secondary).frame(maxWidth: 620, alignment: .leading)
                    }
                    Spacer()
                    Image(systemName: "cube.transparent.fill").font(.system(size: 74, weight: .ultraLight))
                        .foregroundStyle(SpatialDesign.accent).accessibilityHidden(true)
                }
                HStack {
                    SpatialStatusIndicator(title: "Native visionOS", symbol: "vision.pro")
                    SpatialStatusIndicator(title: dependencies.authentication.session.isAuthenticated ? "Signed in" : "Local exploration", symbol: "lock.shield")
                }
                ViewThatFits(in: .horizontal) {
                    HStack(alignment: .top, spacing: 24) { spatialCard; projectCard }
                    VStack(spacing: 24) { spatialCard; projectCard }
                }
                ImmersiveControl()
                if let message = dependencies.configurationMessage {
                    Label(message, systemImage: "info.circle").font(.callout).foregroundStyle(.secondary)
                }
                if let error = dependencies.authentication.errorMessage {
                    Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.orange)
                }
            }.padding(32)
        }
    }

    private var spatialCard: some View {
        SpatialGlassPanel(title: "Product studio", symbol: "cube") {
            Text("Inspect a local 3D study in a volume. Import your own USDZ from Spatial controls.")
                .foregroundStyle(.secondary)
            Button("Open product volume", systemImage: "cube.transparent") {
                openWindow(id: "spatial-controls")
                openWindow(id: "product-volume")
            }.buttonStyle(.borderedProminent).accessibilityIdentifier("open-product-volume")
            Text("The included study is procedural sample geometry, not a generated or saved client asset.")
                .font(.caption).foregroundStyle(.secondary)
        }.frame(minWidth: 300)
    }
    private var projectCard: some View {
        SpatialGlassPanel(title: "Your workspace", symbol: "folder") {
            if let project = dependencies.projects?.selectedProject {
                Text(project.name).font(.title2)
                Text(project.objective).foregroundStyle(.secondary).lineLimit(3)
                Button("Open creative studio", systemImage: "wand.and.stars") { section = .create }
            } else {
                Text("Authorized projects, shared assets and your private prompt drafts.").foregroundStyle(.secondary)
                Button("Browse projects", systemImage: "arrow.up.right") { section = .projects }
                Text("Campaigns, deadlines and client feedback appear only when supplied by a connected service.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }.frame(minWidth: 300)
    }
    @ViewBuilder private var accountControl: some View {
        if dependencies.authentication.needsCredentialCleanup {
            Button("Retry sign-out cleanup", systemImage: "lock.rotation") {
                Task { await dependencies.authentication.retryCredentialCleanup() }
            }.disabled(dependencies.authentication.isSigningOut)
        } else if dependencies.authentication.session.isAuthenticated {
            Button("Sign out", systemImage: "person.crop.circle.badge.minus") {
                Task {
                    await dependencies.authentication.signOut()
                }
            }
        } else {
            Button(dependencies.authentication.isSigningIn ? "Signing in…" : "Sign in", systemImage: "person.crop.circle") {
                Task { await dependencies.authentication.signIn() }
            }.disabled(!dependencies.authentication.isConfigured || dependencies.authentication.isSigningIn || dependencies.client == nil)
        }
    }
}
