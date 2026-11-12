import SwiftUI
import RealityKit
import ShapeStudioCore

struct ImmersiveControl: View {
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.openImmersiveSpace) private var openImmersiveSpace
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    var body: some View {
        SpatialGlassPanel(title: "A quiet space for ideas", symbol: "view.3d") {
            Text("Explore the local product study in mixed immersion. Your surroundings remain visible. This study does not modify a project scene.")
                .foregroundStyle(.secondary)
            if coordinator.immersive.phase == .open {
                Button("Leave immersive studio", systemImage: "arrow.uturn.backward") {
                    Task {
                        guard coordinator.immersive.beginClosing() else { return }
                        await dismissImmersiveSpace()
                        coordinator.immersive.didDisappear()
                    }
                }.accessibilityIdentifier("leave-immersive")
            } else {
                Button(coordinator.immersive.phase == .opening ? "Opening…" : "Enter immersive study", systemImage: "vision.pro") {
                    Task {
                        guard let ticket = coordinator.immersive.beginOpening() else { return }
                        let outcome: ImmersivePresentationState.OpenOutcome
                        switch await openImmersiveSpace(id: "CreativeEnvironment") {
                        case .opened: outcome = .opened
                        case .userCancelled: outcome = .cancelled
                        case .error: outcome = .failed
                        @unknown default: outcome = .failed
                        }
                        coordinator.immersive.finishOpening(ticket: ticket, outcome: outcome)
                    }
                }.disabled(coordinator.immersive.phase != .closed).accessibilityIdentifier("enter-immersive")
            }
            if let message = coordinator.immersive.errorMessage { Text(message).foregroundStyle(.orange) }
        }
    }
}

struct CreativeEnvironmentView: View {
    @Environment(AppCoordinator.self) private var coordinator
    @Environment(\.dismissImmersiveSpace) private var dismissImmersiveSpace
    var body: some View {
        RealityView { content, attachments in
            let study = SpatialWorkspace.makeStudy()
            study.position = [0, 1.35, -1.8]
            content.add(study)
            if let controls = attachments.entity(for: "exit") {
                controls.position = [0, 1.0, -1.35]
                content.add(controls)
            }
        } attachments: {
            Attachment(id: "exit") {
                VStack(spacing: 12) {
                    Text("Local product study").font(.headline)
                    Text("A procedural study · no project changes").font(.caption)
                    Button("Leave immersive studio", systemImage: "arrow.uturn.backward") {
                        Task {
                            guard coordinator.immersive.beginClosing() else { return }
                            await dismissImmersiveSpace()
                            coordinator.immersive.didDisappear()
                        }
                    }.accessibilityIdentifier("immersive-exit")
                }.padding(24).glassBackgroundEffect()
            }
        }
        .onDisappear { coordinator.immersive.didDisappear() }
    }
}
