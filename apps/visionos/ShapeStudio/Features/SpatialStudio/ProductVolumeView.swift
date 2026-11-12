import RealityKit
import SwiftUI

struct ProductVolumeView: View {
    let workspace: SpatialWorkspace
    @Environment(\.scenePhase) private var scenePhase
    @State private var volumeID = UUID()
    @State private var ownsRenderer = false

    var body: some View {
        GeometryReader3D { geometry in
            RealityView { content in
                if workspace.attachVolume(volumeID) {
                    ownsRenderer = true
                    content.add(workspace.root)
                    workspace.setVolumeBounds(content.convert(geometry.frame(in: .local), from: .local, to: .scene))
                }
            } update: { content in
                if ownsRenderer {
                    workspace.setVolumeBounds(content.convert(geometry.frame(in: .local), from: .local, to: .scene))
                    workspace.applyTransform()
                }
            }
            .gesture(TapGesture().targetedToEntity(workspace.objectPivot).onEnded { _ in workspace.isSelected = true })
            .simultaneousGesture(dragGesture)
            .simultaneousGesture(scaleGesture)
            .simultaneousGesture(rotationGesture)
            .overlay {
                if !ownsRenderer {
                    Text("This workspace already has an open product volume.")
                        .padding().glassBackgroundEffect()
                }
            }
        }
        .ornament(attachmentAnchor: .scene(.bottom)) {
            HStack(spacing: 16) {
                Label(workspace.title, systemImage: "cube.transparent")
                    .font(.headline).lineLimit(1)
                if workspace.isLoading { ProgressView().controlSize(.small) }
                Button("Reset", systemImage: "arrow.counterclockwise") { workspace.resetTransform() }
                    .disabled(workspace.isLoading)
            }
            .padding().glassBackgroundEffect()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase != .active { workspace.endGestures() }
        }
        .onDisappear { workspace.detachVolume(volumeID); ownsRenderer = false }
    }

    private var dragGesture: some Gesture {
        DragGesture(coordinateSpace: .local)
            .targetedToEntity(workspace.objectPivot)
            .onChanged { value in
                workspace.drag(value.convert(value.translation3D, from: .local, to: workspace.root))
            }
            .onEnded { _ in workspace.endDrag() }
    }

    private var scaleGesture: some Gesture {
        MagnifyGesture().targetedToEntity(workspace.objectPivot)
            .onChanged { workspace.magnify($0.magnification) }
            .onEnded { _ in workspace.endScale() }
    }

    private var rotationGesture: some Gesture {
        RotateGesture3D().targetedToEntity(workspace.objectPivot)
            .onChanged { value in
                workspace.rotate(value.convert(value.rotation, from: .local, to: workspace.root))
            }
            .onEnded { _ in workspace.endRotation() }
    }
}
