import Foundation

public struct ProjectService: Sendable {
    private let client: APIClient
    public init(client: APIClient) { self.client = client }
    public func list() async throws -> [ProjectSummary] {
        let result = try await client.get(ShapeAPIRoutes.listProjects(), as: ProjectsPayload.self)
        return result.projects
    }
    public func get(id: String) async throws -> ProjectSummary {
        try validateResourceID(id)
        let result = try await client.get(ShapeAPIRoutes.getProject(projectId: id), as: ProjectPayload.self)
        guard result.project.id == id else { throw APIClientError.invalidResponse }
        return result.project
    }
}

public struct AssetService: Sendable {
    private let client: APIClient
    public init(client: APIClient) { self.client = client }
    public func list(projectID: String) async throws -> AssetPage {
        try validateResourceID(projectID)
        let page = try await client.get(ShapeAPIRoutes.listProjectAssets(projectId: projectID), as: AssetPage.self)
        guard page.assets.allSatisfy({ $0.projectId == projectID }) else { throw APIClientError.invalidResponse }
        return page
    }
    public func preview(asset: AssetSummary) async throws -> Data {
        try validateResourceID(asset.id)
        let path = "/api/v1/assets/\(asset.id)/content"
        guard asset.contentUrl == path else { throw APIClientError.invalidPath }
        guard Self.previewMIMETypes.contains(asset.mimeType.lowercased()), asset.byteSize > 0, asset.byteSize <= 8_388_608 else { throw APIClientError.invalidResponse }
        if let width = asset.width, let height = asset.height {
            guard width > 0, height > 0, width <= 8192, height <= 8192, width * height <= 16_777_216 else { throw APIClientError.invalidResponse }
        }
        return try await client.data(path, acceptedMIMETypes: [asset.mimeType.lowercased()], maximumBytes: 8_388_608)
    }
    public func modelData(asset: AssetSummary) async throws -> Data {
        try validateResourceID(asset.id)
        let path = "/api/v1/assets/\(asset.id)/native-content"
        guard asset.nativeContentUrl == path else { throw APIClientError.invalidPath }
        guard asset.mimeType == "model/vnd.usdz+zip", asset.byteSize > 0 else { throw APIClientError.invalidResponse }
        guard asset.byteSize <= 33_554_432 else { throw APIClientError.responseTooLarge }
        let data = try await client.data(path, acceptedMIMETypes: ["model/vnd.usdz+zip"], maximumBytes: 33_554_432)
        guard data.count == asset.byteSize else { throw APIClientError.invalidResponse }
        return data
    }
    public static let previewMIMETypes: Set<String> = ["image/jpeg", "image/png", "image/webp"]
}

public struct CapabilityService: Sendable {
    private let client: APIClient
    public init(client: APIClient) { self.client = client }
    public func get() async throws -> CreativeCapabilities {
        try await client.get(ShapeAPIRoutes.getCreativeCapabilities(), as: CreativeCapabilities.self, authenticated: false)
    }
}

public struct DraftService: Sendable {
    private let client: APIClient
    public init(client: APIClient) { self.client = client }
    public func get(projectID: String) async throws -> CreativeDraftSnapshot {
        try validateResourceID(projectID)
        let result = try await client.get(ShapeAPIRoutes.getCreativeDraft(projectId: projectID), as: DraftPayload.self)
        guard result.draft.projectId == projectID else { throw APIClientError.invalidResponse }
        return result.draft
    }
    public func save(projectID: String, input: SaveCreativeDraft) async throws -> CreativeDraftSnapshot {
        try validateResourceID(projectID)
        let result = try await client.send(ShapeAPIRoutes.saveCreativeDraft(projectId: projectID), method: "PUT", body: input, as: DraftPayload.self)
        guard result.draft.projectId == projectID else { throw APIClientError.invalidResponse }
        return result.draft
    }
}

func validateResourceID(_ id: String) throws {
    guard UUID(uuidString: id) != nil else { throw APIClientError.invalidPath }
}
private struct ProjectsPayload: Decodable, Sendable { let projects: [ProjectSummary] }
private struct ProjectPayload: Decodable, Sendable { let project: ProjectSummary }
private struct DraftPayload: Decodable, Sendable { let draft: CreativeDraftSnapshot }
