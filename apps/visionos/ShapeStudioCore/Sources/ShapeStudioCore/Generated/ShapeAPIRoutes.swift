// Generated from openapi.json. Do not edit.
import Foundation

/// Relative paths only; authentication and URLSession transport belong to the native app.
public enum ShapeAPIRoutes {
  private static func segment(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"))!
  }
  /// GET; response: SpatialSceneResponse.
  public static func getSpatialScene(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/spatial-scene" }
  /// PUT; response: SpatialSceneResponse; body: SaveSpatialScene.
  public static func saveSpatialScene(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/spatial-scene" }
  /// GET; response: CreativeCapabilitiesResponse.
  public static func getCreativeCapabilities() -> String { "/api/v1/capabilities" }
  /// GET; response: ProjectListResponse.
  public static func listProjects() -> String { "/api/v1/projects" }
  /// POST; response: ProjectDetailResponse; body: CreateProject.
  public static func createProject() -> String { "/api/v1/projects" }
  /// GET; response: ProjectDetailResponse.
  public static func getProject(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))" }
  /// PATCH; response: ProjectDetailResponse; body: UpdateProject.
  public static func updateProject(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))" }
  /// GET; response: AssetListResponse.
  public static func listProjectAssets(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/assets" }
  /// GET; response: CreativeDraftResponse.
  public static func getCreativeDraft(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/creative-draft" }
  /// PUT; response: CreativeDraftResponse; body: SaveCreativeDraft.
  public static func saveCreativeDraft(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/creative-draft" }
}
