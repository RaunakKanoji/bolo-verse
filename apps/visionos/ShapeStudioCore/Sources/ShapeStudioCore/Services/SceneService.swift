import Foundation

/// Remote documents contain authorized backend asset IDs. Local imports have a separate document boundary.
public struct SceneService: Sendable {
    private let client: APIClient
    public init(client: APIClient) { self.client = client }

    public func get(projectID: String) async throws -> SpatialSceneSnapshot {
        try validateResourceID(projectID)
        let result = try await client.get(ShapeAPIRoutes.getSpatialScene(projectId: projectID), as: ScenePayload.self)
        guard result.scene.projectId == projectID, result.scene.sceneId == projectID, result.scene.document.sceneId == projectID else { throw APIClientError.invalidResponse }
        return result.scene
    }

    public func save(projectID: String, input: SaveSpatialScene) async throws -> SpatialSceneSnapshot {
        try validateResourceID(projectID)
        guard input.document.sceneId == projectID else { throw APIClientError.invalidPath }
        let result = try await client.send(ShapeAPIRoutes.saveSpatialScene(projectId: projectID), method: "PUT", body: input, as: ScenePayload.self)
        guard result.scene.projectId == projectID, result.scene.sceneId == projectID, result.scene.document.sceneId == projectID else { throw APIClientError.invalidResponse }
        return result.scene
    }
}

private struct ScenePayload: Decodable, Sendable { let scene: SpatialSceneSnapshot }
