// Generated from openapi.json. Do not edit.
import Foundation

/// Relative paths only; authentication and URLSession transport belong to the native app.
public enum ShapeAPIRoutes {
  private static func segment(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: CharacterSet(charactersIn: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"))!
  }
  /// GET; response: VideoEditorResponse.
  public static func getVideoEditor(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor" }
  /// PUT; response: VideoEditorResponse; body: SaveVideoEditorDraft.
  public static func saveVideoEditorDraft(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor" }
  /// GET; response: VideoRenderListResponse.
  public static func listVideoRenders(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor/renders" }
  /// POST; response: VideoRenderResponse; body: CreateVideoRender.
  public static func createVideoRender(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor/renders" }
  /// GET; response: VideoRenderResponse.
  public static func getVideoRender(projectId: String, jobId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor/renders/\(segment(jobId))" }
  /// POST; response: VideoRenderResponse; body: RefreshVideoRender.
  public static func refreshVideoRender(projectId: String, jobId: String) -> String { "/api/v1/projects/\(segment(projectId))/video-editor/renders/\(segment(jobId))/refresh" }
  /// GET; response: StudioOverviewResponse.
  public static func getStudioOverview() -> String { "/api/v1/workspace/overview" }
  /// GET; response: StudioProjectListResponse.
  public static func listStudioProjects() -> String { "/api/v1/workspace/projects" }
  /// POST; response: StudioProjectMutationResponse; body: CreateStudioProject.
  public static func createStudioProject() -> String { "/api/v1/workspace/projects" }
  /// GET; response: StudioProjectDetailResponse.
  public static func getStudioProject(projectId: String) -> String { "/api/v1/workspace/projects/\(segment(projectId))" }
  /// PATCH; response: StudioProjectMutationResponse; body: UpdateStudioProject.
  public static func updateStudioProject(projectId: String) -> String { "/api/v1/workspace/projects/\(segment(projectId))" }
  /// POST; response: StudioProjectMutationResponse; body: DuplicateStudioProject.
  public static func duplicateStudioProject(projectId: String) -> String { "/api/v1/workspace/projects/\(segment(projectId))/duplicate" }
  /// POST; response: StudioTaskMutationResponse; body: CreateStudioTask.
  public static func createStudioTask(projectId: String) -> String { "/api/v1/workspace/projects/\(segment(projectId))/tasks" }
  /// PATCH; response: StudioTaskMutationResponse; body: UpdateStudioTask.
  public static func updateStudioTask(projectId: String, taskId: String) -> String { "/api/v1/workspace/projects/\(segment(projectId))/tasks/\(segment(taskId))" }
  /// GET; response: StudioClientListResponse.
  public static func listStudioClients() -> String { "/api/v1/workspace/clients" }
  /// POST; response: StudioClientMutationResponse; body: CreateStudioClient.
  public static func createStudioClient() -> String { "/api/v1/workspace/clients" }
  /// GET; response: StudioClientDetailResponse.
  public static func getStudioClient(clientId: String) -> String { "/api/v1/workspace/clients/\(segment(clientId))" }
  /// PATCH; response: StudioClientMutationResponse; body: UpdateStudioClient.
  public static func updateStudioClient(clientId: String) -> String { "/api/v1/workspace/clients/\(segment(clientId))" }
  /// GET; response: StudioAssetListResponse.
  public static func listStudioAssets() -> String { "/api/v1/workspace/assets" }
  /// PATCH; response: StudioAssetMutationResponse; body: UpdateStudioAsset.
  public static func updateStudioAsset(assetId: String) -> String { "/api/v1/workspace/assets/\(segment(assetId))" }
  /// GET; response: BrainstormSessionListResponse.
  public static func listBrainstormSessions() -> String { "/api/v1/brainstorm/sessions" }
  /// POST; response: BrainstormSessionMutationResponse; body: CreateBrainstormSession.
  public static func createBrainstormSession() -> String { "/api/v1/brainstorm/sessions" }
  /// GET; response: BrainstormSessionDetailResponse.
  public static func getBrainstormSession(sessionId: String) -> String { "/api/v1/brainstorm/sessions/\(segment(sessionId))" }
  /// PATCH; response: BrainstormSessionMutationResponse; body: UpdateBrainstormSession.
  public static func updateBrainstormSession(sessionId: String) -> String { "/api/v1/brainstorm/sessions/\(segment(sessionId))" }
  /// POST; response: BrainstormMessageResponse; body: SendBrainstormMessage.
  public static func sendBrainstormMessage(sessionId: String) -> String { "/api/v1/brainstorm/sessions/\(segment(sessionId))/messages" }
  /// POST; response: BrainstormIdeaResponse; body: SaveBrainstormIdea.
  public static func saveBrainstormIdea(sessionId: String) -> String { "/api/v1/brainstorm/sessions/\(segment(sessionId))/ideas" }
  /// GET; response: ReviewInboxResponse.
  public static func listClientReviews() -> String { "/api/v1/reviews" }
  /// GET; response: ReviewResponse.
  public static func getClientReview(versionId: String) -> String { "/api/v1/reviews/\(segment(versionId))" }
  /// POST; response: ReviewResponse; body: ReviewCommentInput.
  public static func commentOnReview(versionId: String) -> String { "/api/v1/reviews/\(segment(versionId))/comments" }
  /// POST; response: ReviewResponse; body: ReviewDecisionInput.
  public static func decideOnReview(versionId: String) -> String { "/api/v1/reviews/\(segment(versionId))/decision" }
  /// GET; response: ReviewFeedbackResponse.
  public static func getReviewFeedback(projectId: String, deliverableId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables/\(segment(deliverableId))/review-grants" }
  /// POST; response: ReviewGrantResponse; body: ShareReview.
  public static func shareForReview(projectId: String, deliverableId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables/\(segment(deliverableId))/review-grants" }
  /// POST; response: ReviewGrantResponse; body: RevokeReview.
  public static func revokeReviewGrant(projectId: String, deliverableId: String, grantId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables/\(segment(deliverableId))/review-grants/\(segment(grantId))/revoke" }
  /// POST; response: DeliverableResponse; body: PublishDeliverable.
  public static func publishDeliverable(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables" }
  /// GET; response: DeliverableListResponse.
  public static func listDeliverables(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables" }
  /// GET; response: DeliverableResponse.
  public static func getDeliverable(projectId: String, deliverableId: String) -> String { "/api/v1/projects/\(segment(projectId))/deliverables/\(segment(deliverableId))" }
  /// POST; response: BrainstormResponse; body: BrainstormRequest.
  public static func brainstormFromBrief(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/brainstorm" }
  /// GET; response: ProjectBriefResponse.
  public static func getProjectBrief(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/brief" }
  /// PUT; response: ProjectBriefResponse; body: SaveProjectBrief.
  public static func saveProjectBrief(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/brief" }
  /// GET; response: ImageGenerationCapabilitiesResponse.
  public static func getImageGenerationCapabilities() -> String { "/api/v1/creation/capabilities" }
  /// POST; response: ImageUploadResponse; body: CreateImageUpload.
  public static func createImageUpload() -> String { "/api/v1/assets/upload-session" }
  /// POST; response: FinalizedImageUploadResponse; body: FinalizeImageUpload.
  public static func finalizeImageUpload(uploadId: String) -> String { "/api/v1/assets/upload-session/\(segment(uploadId))/finalize" }
  /// POST; response: ImageGenerationResponse; body: CreateImageGeneration.
  public static func createImageGeneration() -> String { "/api/v1/generations" }
  /// GET; response: ImageGenerationListResponse.
  public static func listImageGenerations(projectId: String) -> String { "/api/v1/projects/\(segment(projectId))/generations" }
  /// GET; response: ImageGenerationResponse.
  public static func getImageGeneration(jobId: String) -> String { "/api/v1/generations/\(segment(jobId))" }
  /// POST; response: ImageGenerationResponse; body: CancelImageGeneration.
  public static func cancelImageGeneration(jobId: String) -> String { "/api/v1/generations/\(segment(jobId))/cancel" }
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
