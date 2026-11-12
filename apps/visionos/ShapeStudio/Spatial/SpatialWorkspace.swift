import Foundation
import Observation
import RealityKit
import ShapeStudioCore
import UIKit
import simd

@MainActor @Observable
final class SpatialWorkspace {
    private(set) var document = SpatialDocument()
    private(set) var status = "Procedural study · local only"
    var errorMessage: String?
    private(set) var isLoading = false
    private(set) var hasModel = false
    var isSelected = true
    private(set) var history = SpatialHistory()
    private(set) var modelBasis = SpatialModelBasis.identity

    @ObservationIgnored let root = Entity()
    @ObservationIgnored let objectPivot = Entity()
    @ObservationIgnored private var normalization = Entity()
    @ObservationIgnored private var halfExtents = SpatialVector3(0.4, 0.4, 0.4)
    @ObservationIgnored private var loadTask: Task<Void, Never>?
    @ObservationIgnored private var loadGeneration = UUID()
    @ObservationIgnored private var dragStart: SpatialGestureTransform?
    @ObservationIgnored private var scaleStart: SpatialGestureTransform?
    @ObservationIgnored private var rotationStart: SpatialGestureTransform?
    @ObservationIgnored private var mountedVolume: UUID?
    static let normalizedRadius: Double = 0.16

    var canUndo: Bool { history.canUndo }
    var canRedo: Bool { history.canRedo }
    var title: String { document.source.label }
    var projectAssetID: String? {
        if case .projectUSDZ(let id, _, _) = document.source { id } else { nil }
    }
    var projectID: String? {
        if case .projectUSDZ(_, let id, _) = document.source { id } else { nil }
    }

    init() {
        root.name = "Product volume"
        root.addChild(objectPivot)
        loadStudy()
    }

    func loadStudy() {
        cancelLoading()
        let entity = Self.makeStudy()
        do {
            try install(entity, document: SpatialDocument())
            status = "Procedural study · local only"
        } catch { errorMessage = error.localizedDescription }
    }

    /// A labelled procedural object; this is not an AI-generated or client asset.
    static func makeStudy() -> Entity {
        let study = Entity()
        let body = ModelEntity(mesh: .generateBox(size: SIMD3<Float>(0.12, 0.2, 0.08), cornerRadius: 0.018),
                               materials: [SimpleMaterial(color: UIColor(red: 0.76, green: 0.72, blue: 0.95, alpha: 1), roughness: 0.3, isMetallic: false)])
        body.position.y = 0.1
        let cap = ModelEntity(mesh: .generateCylinder(height: 0.035, radius: 0.028),
                              materials: [SimpleMaterial(color: .lightGray, roughness: 0.3, isMetallic: true)])
        cap.position.y = 0.218
        study.addChild(body); study.addChild(cap)
        return study
    }

    func importModel(from source: URL) async {
        cancelLoading()
        let generation = loadGeneration
        isLoading = true; errorMessage = nil; status = "Checking local USDZ…"
        let task = Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                let (entity, temporary) = try await Self.loadValidated(source)
                defer { try? FileManager.default.removeItem(at: temporary) }
                try Task.checkCancellation()
                guard generation == self.loadGeneration else { return }
                let id = UUID()
                let name = String(source.deletingPathExtension().lastPathComponent.prefix(160)) + ".usdz"
                let document = SpatialDocument(source: .localUSDZ(id: id, name: name))
                _ = try document.encoded()
                // Persist only a validated model; bounded app-private files enable local restore.
                try LocalModelStore.retain(temporary, id: id)
                try self.install(entity, document: document)
                self.status = "Imported USDZ · stored on this device"
            } catch is CancellationError {
                if generation == self.loadGeneration { self.status = "Import cancelled" }
            } catch {
                if generation == self.loadGeneration {
                    self.errorMessage = error.localizedDescription
                    self.status = "Import failed · previous object retained"
                }
            }
            if generation == self.loadGeneration { self.isLoading = false; self.loadTask = nil }
        }
        loadTask = task
        await withTaskCancellationHandler { await task.value } onCancel: { task.cancel() }
    }

    func cancelLoading() {
        if isLoading { status = "Loading cancelled" }
        loadGeneration = UUID(); loadTask?.cancel(); loadTask = nil
        isLoading = false; endGestures()
    }

    /// The caller obtains bytes through the authorized, bounded backend transport.
    /// This method never converts project content into a persistent local import.
    func importBackendModel(data: Data, assetID: String, projectID: String, name: String) async {
        cancelLoading()
        let generation = loadGeneration
        isLoading = true; errorMessage = nil; status = "Checking project USDZ…"
        let task = Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                let document = SpatialDocument(source: .projectUSDZ(assetID: assetID, projectID: projectID, name: name))
                _ = try document.encoded()
                let preparation = Task.detached(priority: .userInitiated) { try LocalModelStore.prepare(data: data) }
                let (entity, temporary) = try await Self.loadPrepared(preparation)
                defer { try? FileManager.default.removeItem(at: temporary) }
                try Task.checkCancellation()
                guard generation == self.loadGeneration else { return }
                try self.install(entity, document: document)
                self.status = "Project asset · authorized USDZ preview"
            } catch is CancellationError {
                if generation == self.loadGeneration { self.status = "Preview cancelled" }
            } catch {
                if generation == self.loadGeneration {
                    self.errorMessage = error.localizedDescription
                    self.status = "Preview failed · previous object retained"
                }
            }
            if generation == self.loadGeneration { self.isLoading = false; self.loadTask = nil }
        }
        loadTask = task
        await withTaskCancellationHandler { await task.value } onCancel: { task.cancel() }
    }

    func exportDocument() throws -> Data {
        guard projectAssetID == nil else { throw LocalSceneError.projectDocument }
        return try document.encoded()
    }

    func restoreDocument(from data: Data) async throws {
        let restored = try SpatialDocument.decode(data)
        cancelLoading()
        let generation = loadGeneration
        isLoading = true; errorMessage = nil
        defer { if generation == loadGeneration { isLoading = false } }
        let entity: Entity
        switch restored.source {
        case .study: entity = Self.makeStudy()
        case .projectUSDZ: throw LocalSceneError.projectDocument
        case .localUSDZ(let id, _):
            let url = try LocalModelStore.modelURL(id: id)
            guard FileManager.default.fileExists(atPath: url.path) else {
                throw LocalSceneError.missingModel
            }
            let result = try await Self.loadValidated(url)
            entity = result.0
            try? FileManager.default.removeItem(at: result.1)
        }
        try Task.checkCancellation()
        guard generation == loadGeneration else { throw CancellationError() }
        try install(entity, document: restored)
        status = "Local scene restored"
    }

    func removeLocalImports() {
        loadStudy()
        do { try LocalModelStore.removeAll(); status = "Local imports removed" }
        catch { errorMessage = error.localizedDescription }
    }

    func attachVolume(_ id: UUID) -> Bool {
        guard mountedVolume == nil || mountedVolume == id else { return false }
        mountedVolume = id; return true
    }

    func detachVolume(_ id: UUID) {
        guard mountedVolume == id else { return }
        root.removeFromParent(); mountedVolume = nil; endGestures()
    }

    func setVolumeBounds(_ bounds: BoundingBox) {
        let half = bounds.extents * 0.5
        guard [half.x, half.y, half.z, bounds.center.x, bounds.center.y, bounds.center.z].allSatisfy(\.isFinite),
              min(half.x, half.y, half.z) > 0.02 else { return }
        root.position = bounds.center
        halfExtents = .init(Double(half.x), Double(half.y), Double(half.z))
        // Geometry callbacks can run while SwiftUI updates; mutate entities here, not observable state.
        applyTransform()
        let previous = document.transform, measured = halfExtents
        if let constrained = try? previous.constrained(halfExtents: measured, radius: Self.normalizedRadius), constrained != previous {
            Task { @MainActor [weak self] in
                guard let self, self.document.transform == previous, self.halfExtents == measured else { return }
                self.document.transform = constrained
                self.history.record(constrained)
            }
        }
    }

    func setTransform(_ value: SpatialTransform, commit: Bool = true) {
        do {
            let constrained = try value.constrained(halfExtents: halfExtents, radius: Self.normalizedRadius)
            document.transform = constrained
            if commit { history.record(constrained) }
            applyTransform()
        } catch { errorMessage = error.localizedDescription }
    }

    func setVisible(_ visible: Bool) { document.isVisible = visible; applyTransform() }
    func applySavedObject(_ object: SpatialSceneSnapshotDocumentObjectsItem) throws {
        guard object.assetId == projectAssetID else { throw CanonicalSceneMappingError.invalidSnapshot }
        let transform = try CanonicalSceneMapper.viewerTransform(object: object, basis: modelBasis, halfExtents: halfExtents, radius: Self.normalizedRadius)
        endGestures(); setTransform(transform); setVisible(object.visible)
    }
    func resetTransform() { endGestures(); setTransform(.init()) }
    func undo() { endGestures(); if let value = history.undo() { setTransform(value, commit: false) } }
    func redo() { endGestures(); if let value = history.redo() { setTransform(value, commit: false) } }

    func drag(_ delta: SIMD3<Float>) {
        guard !isLoading else { return }
        isSelected = true
        if dragStart == nil { dragStart = .init(start: document.transform) }
        guard let dragStart else { return }
        var value = document.transform
        value.position = dragStart.translated(by: .init(Double(delta.x), Double(delta.y), Double(delta.z))).position
        setTransform(value, commit: false)
    }

    func magnify(_ factor: Double) {
        guard !isLoading else { return }
        isSelected = true
        if scaleStart == nil { scaleStart = .init(start: document.transform) }
        guard let scaleStart else { return }
        var value = document.transform; value.scale = scaleStart.scaled(by: factor).scale
        setTransform(value, commit: false)
    }

    func rotate(_ rotation: simd_quatf) {
        guard !isLoading else { return }
        isSelected = true
        if rotationStart == nil { rotationStart = .init(start: document.transform) }
        guard let rotationStart else { return }
        let q = simd_normalize(rotation)
        var value = document.transform
        value.rotation = rotationStart.rotated(by: .init(Double(q.imag.x), Double(q.imag.y), Double(q.imag.z), Double(q.real))).rotation
        setTransform(value, commit: false)
    }

    func endDrag() { dragStart = nil; commitIfGesturesEnded() }
    func endScale() { scaleStart = nil; commitIfGesturesEnded() }
    func endRotation() { rotationStart = nil; commitIfGesturesEnded() }
    func endGestures() { dragStart = nil; scaleStart = nil; rotationStart = nil; history.record(document.transform) }

    func applyTransform() {
        guard let value = try? document.transform.constrained(halfExtents: halfExtents, radius: Self.normalizedRadius) else { return }
        objectPivot.position = SIMD3(Float(value.position.x), Float(value.position.y), Float(value.position.z))
        objectPivot.orientation = simd_quatf(ix: Float(value.rotation.x), iy: Float(value.rotation.y), iz: Float(value.rotation.z), r: Float(value.rotation.w))
        objectPivot.scale = .init(repeating: Float(value.scale))
        objectPivot.isEnabled = document.isVisible
    }

    private func commitIfGesturesEnded() {
        if dragStart == nil, scaleStart == nil, rotationStart == nil { history.record(document.transform) }
    }

    private func install(_ entity: Entity, document incoming: SpatialDocument) throws {
        let newNormalization = Entity()
        newNormalization.addChild(entity)
        let bounds = newNormalization.visualBounds(relativeTo: newNormalization)
        let radius = simd_length(bounds.extents) * 0.5
        guard !bounds.isEmpty, radius.isFinite, radius > 0.000001,
              [bounds.center.x, bounds.center.y, bounds.center.z].allSatisfy(\.isFinite) else {
            throw SpatialValidationError.invalidTransform
        }
        entity.position -= bounds.center
        let fit = Float(Self.normalizedRadius) / radius
        modelBasis = .init(center: .init(Double(bounds.center.x), Double(bounds.center.y), Double(bounds.center.z)), normalizationScale: Double(fit))
        newNormalization.scale = .init(repeating: fit)
        normalization.removeFromParent(); normalization = newNormalization
        objectPivot.addChild(normalization)
        let collider = ShapeResource.generateBox(size: simd_max(bounds.extents * fit, SIMD3<Float>(repeating: 0.005)))
        objectPivot.components.set(CollisionComponent(shapes: [collider]))
        objectPivot.components.set(InputTargetComponent())
        objectPivot.components.set(HoverEffectComponent())
        var accessibility = AccessibilityComponent()
        accessibility.isAccessibilityElement = true
        accessibility.label = LocalizedStringResource(stringLiteral: incoming.source.label)
        objectPivot.components.set(accessibility)
        document = incoming
        document.transform = try incoming.transform.constrained(halfExtents: halfExtents, radius: Self.normalizedRadius)
        history = SpatialHistory(document.transform)
        isSelected = true; hasModel = true; errorMessage = nil
        applyTransform()
    }

    private static func loadValidated(_ source: URL) async throws -> (Entity, URL) {
        let preparation = Task.detached(priority: .userInitiated) { try LocalModelStore.prepare(source) }
        return try await loadPrepared(preparation)
    }

    private static func loadPrepared(_ preparation: Task<URL, any Error>) async throws -> (Entity, URL) {
        let temporary = try await withTaskCancellationHandler { try await preparation.value } onCancel: { preparation.cancel() }
        do {
            try Task.checkCancellation()
            let entity = try await Entity(contentsOf: temporary)
            try Task.checkCancellation()
            try checkModelResources(entity)
            return (entity, temporary)
        } catch {
            try? FileManager.default.removeItem(at: temporary)
            throw error
        }
    }

    private static func checkModelResources(_ entity: Entity) throws {
        var pending = [entity], count = 0, vertices = 0, triangles = 0, materials = 0
        entity.stopAllAnimations(recursive: true)
        while let current = pending.popLast() {
            try Task.checkCancellation()
            count += 1
            guard count <= 256, pending.count + current.children.count <= 256 else { throw SpatialValidationError.resourceLimit }
            pending.append(contentsOf: current.children)
            current.stopAllAudio()
            current.components.remove(PhysicsBodyComponent.self)
            current.components.remove(PhysicsMotionComponent.self)
            current.components.remove(AnchoringComponent.self)
            current.components.remove(InputTargetComponent.self)
            current.components.remove(CollisionComponent.self)
            current.components.remove(ManipulationComponent.self)
            if let model = current.components[ModelComponent.self] {
                materials += model.materials.count
                let mesh = model.mesh.contents
                guard mesh.instances.count <= 256 else { throw SpatialValidationError.resourceLimit }
                for meshModel in mesh.models {
                    for part in meshModel.parts {
                        vertices += part.positions.count * max(1, mesh.instances.count)
                        triangles += (part.triangleIndices?.count ?? 0) / 3 * max(1, mesh.instances.count)
                        guard vertices <= 250_000, triangles <= 250_000 else { throw SpatialValidationError.resourceLimit }
                        guard !part.positions.contains(where: { !$0.x.isFinite || !$0.y.isFinite || !$0.z.isFinite }) else {
                            throw SpatialValidationError.invalidTransform
                        }
                    }
                }
                guard materials <= 64 else { throw SpatialValidationError.resourceLimit }
            }
        }
        guard vertices > 0 else { throw SpatialValidationError.invalidArchive }
        let bounds = entity.visualBounds(relativeTo: nil)
        guard !bounds.isEmpty, [bounds.center.x, bounds.center.y, bounds.center.z, bounds.extents.x, bounds.extents.y, bounds.extents.z].allSatisfy(\.isFinite),
              simd_length(bounds.extents) > 0.000002 else { throw SpatialValidationError.invalidTransform }
    }
}

private enum LocalSceneError: LocalizedError {
    case missingModel, projectDocument
    var errorDescription: String? {
        switch self {
        case .missingModel: "The USDZ for this document is no longer stored on this device. Import the model again. Scene documents do not embed model files."
        case .projectDocument: "Use the project's scene save and restore controls for project assets. Private project models are not stored as local imports."
        }
    }
}
