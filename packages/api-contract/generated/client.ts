// Generated from openapi.json. Do not edit.
import type * as Models from "./models";

export class ShapeApiError extends Error {
  constructor(public readonly status: number, public readonly payload: unknown) {
    super(`Shape API request failed (${status})`);
    this.name = "ShapeApiError";
  }
}

/** Browser same-origin client; never embeds credentials or bypasses server authorization. */
export function createShapeClient(fetcher: typeof fetch = fetch) {
  async function request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetcher(path, { ...init, credentials: "same-origin" });
    const payload: unknown = await response.json();
    if (!response.ok) throw new ShapeApiError(response.status, payload);
    return payload as T;
  }
  return {
    getVideoEditor(projectId: string, signal?: AbortSignal): Promise<Models.VideoEditorResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor`, { method: "GET", signal });
    },
    saveVideoEditorDraft(projectId: string, body: Models.SaveVideoEditorDraft, signal?: AbortSignal): Promise<Models.VideoEditorResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor`, { method: "PUT", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listVideoRenders(projectId: string, signal?: AbortSignal): Promise<Models.VideoRenderListResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor/renders`, { method: "GET", signal });
    },
    createVideoRender(projectId: string, body: Models.CreateVideoRender, signal?: AbortSignal): Promise<Models.VideoRenderResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor/renders`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getVideoRender(projectId: string, jobId: string, signal?: AbortSignal): Promise<Models.VideoRenderResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor/renders/${encodeURIComponent(jobId)}`, { method: "GET", signal });
    },
    refreshVideoRender(projectId: string, jobId: string, body: Models.RefreshVideoRender, signal?: AbortSignal): Promise<Models.VideoRenderResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/video-editor/renders/${encodeURIComponent(jobId)}/refresh`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getStudioOverview(signal?: AbortSignal): Promise<Models.StudioOverviewResponse> {
      return request(`/api/v1/workspace/overview`, { method: "GET", signal });
    },
    listStudioProjects(signal?: AbortSignal): Promise<Models.StudioProjectListResponse> {
      return request(`/api/v1/workspace/projects`, { method: "GET", signal });
    },
    createStudioProject(body: Models.CreateStudioProject, signal?: AbortSignal): Promise<Models.StudioProjectMutationResponse> {
      return request(`/api/v1/workspace/projects`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getStudioProject(projectId: string, signal?: AbortSignal): Promise<Models.StudioProjectDetailResponse> {
      return request(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}`, { method: "GET", signal });
    },
    updateStudioProject(projectId: string, body: Models.UpdateStudioProject, signal?: AbortSignal): Promise<Models.StudioProjectMutationResponse> {
      return request(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    duplicateStudioProject(projectId: string, body: Models.DuplicateStudioProject, signal?: AbortSignal): Promise<Models.StudioProjectMutationResponse> {
      return request(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/duplicate`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    createStudioTask(projectId: string, body: Models.CreateStudioTask, signal?: AbortSignal): Promise<Models.StudioTaskMutationResponse> {
      return request(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/tasks`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    updateStudioTask(projectId: string, taskId: string, body: Models.UpdateStudioTask, signal?: AbortSignal): Promise<Models.StudioTaskMutationResponse> {
      return request(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listStudioClients(signal?: AbortSignal): Promise<Models.StudioClientListResponse> {
      return request(`/api/v1/workspace/clients`, { method: "GET", signal });
    },
    createStudioClient(body: Models.CreateStudioClient, signal?: AbortSignal): Promise<Models.StudioClientMutationResponse> {
      return request(`/api/v1/workspace/clients`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getStudioClient(clientId: string, signal?: AbortSignal): Promise<Models.StudioClientDetailResponse> {
      return request(`/api/v1/workspace/clients/${encodeURIComponent(clientId)}`, { method: "GET", signal });
    },
    updateStudioClient(clientId: string, body: Models.UpdateStudioClient, signal?: AbortSignal): Promise<Models.StudioClientMutationResponse> {
      return request(`/api/v1/workspace/clients/${encodeURIComponent(clientId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listStudioAssets(signal?: AbortSignal): Promise<Models.StudioAssetListResponse> {
      return request(`/api/v1/workspace/assets`, { method: "GET", signal });
    },
    updateStudioAsset(assetId: string, body: Models.UpdateStudioAsset, signal?: AbortSignal): Promise<Models.StudioAssetMutationResponse> {
      return request(`/api/v1/workspace/assets/${encodeURIComponent(assetId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listBrainstormSessions(signal?: AbortSignal): Promise<Models.BrainstormSessionListResponse> {
      return request(`/api/v1/brainstorm/sessions`, { method: "GET", signal });
    },
    createBrainstormSession(body: Models.CreateBrainstormSession, signal?: AbortSignal): Promise<Models.BrainstormSessionMutationResponse> {
      return request(`/api/v1/brainstorm/sessions`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getBrainstormSession(sessionId: string, signal?: AbortSignal): Promise<Models.BrainstormSessionDetailResponse> {
      return request(`/api/v1/brainstorm/sessions/${encodeURIComponent(sessionId)}`, { method: "GET", signal });
    },
    updateBrainstormSession(sessionId: string, body: Models.UpdateBrainstormSession, signal?: AbortSignal): Promise<Models.BrainstormSessionMutationResponse> {
      return request(`/api/v1/brainstorm/sessions/${encodeURIComponent(sessionId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    sendBrainstormMessage(sessionId: string, body: Models.SendBrainstormMessage, signal?: AbortSignal): Promise<Models.BrainstormMessageResponse> {
      return request(`/api/v1/brainstorm/sessions/${encodeURIComponent(sessionId)}/messages`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    saveBrainstormIdea(sessionId: string, body: Models.SaveBrainstormIdea, signal?: AbortSignal): Promise<Models.BrainstormIdeaResponse> {
      return request(`/api/v1/brainstorm/sessions/${encodeURIComponent(sessionId)}/ideas`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listClientReviews(signal?: AbortSignal): Promise<Models.ReviewInboxResponse> {
      return request(`/api/v1/reviews`, { method: "GET", signal });
    },
    getClientReview(versionId: string, signal?: AbortSignal): Promise<Models.ReviewResponse> {
      return request(`/api/v1/reviews/${encodeURIComponent(versionId)}`, { method: "GET", signal });
    },
    commentOnReview(versionId: string, body: Models.ReviewCommentInput, signal?: AbortSignal): Promise<Models.ReviewResponse> {
      return request(`/api/v1/reviews/${encodeURIComponent(versionId)}/comments`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    decideOnReview(versionId: string, body: Models.ReviewDecisionInput, signal?: AbortSignal): Promise<Models.ReviewResponse> {
      return request(`/api/v1/reviews/${encodeURIComponent(versionId)}/decision`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getReviewFeedback(projectId: string, deliverableId: string, signal?: AbortSignal): Promise<Models.ReviewFeedbackResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables/${encodeURIComponent(deliverableId)}/review-grants`, { method: "GET", signal });
    },
    shareForReview(projectId: string, deliverableId: string, body: Models.ShareReview, signal?: AbortSignal): Promise<Models.ReviewGrantResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables/${encodeURIComponent(deliverableId)}/review-grants`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    revokeReviewGrant(projectId: string, deliverableId: string, grantId: string, body: Models.RevokeReview, signal?: AbortSignal): Promise<Models.ReviewGrantResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables/${encodeURIComponent(deliverableId)}/review-grants/${encodeURIComponent(grantId)}/revoke`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    publishDeliverable(projectId: string, body: Models.PublishDeliverable, signal?: AbortSignal): Promise<Models.DeliverableResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listDeliverables(projectId: string, signal?: AbortSignal): Promise<Models.DeliverableListResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables`, { method: "GET", signal });
    },
    getDeliverable(projectId: string, deliverableId: string, signal?: AbortSignal): Promise<Models.DeliverableResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/deliverables/${encodeURIComponent(deliverableId)}`, { method: "GET", signal });
    },
    brainstormFromBrief(projectId: string, body: Models.BrainstormRequest, signal?: AbortSignal): Promise<Models.BrainstormResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/brainstorm`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getProjectBrief(projectId: string, signal?: AbortSignal): Promise<Models.ProjectBriefResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/brief`, { method: "GET", signal });
    },
    saveProjectBrief(projectId: string, body: Models.SaveProjectBrief, signal?: AbortSignal): Promise<Models.ProjectBriefResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/brief`, { method: "PUT", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getImageGenerationCapabilities(signal?: AbortSignal): Promise<Models.ImageGenerationCapabilitiesResponse> {
      return request(`/api/v1/creation/capabilities`, { method: "GET", signal });
    },
    createImageUpload(body: Models.CreateImageUpload, signal?: AbortSignal): Promise<Models.ImageUploadResponse> {
      return request(`/api/v1/assets/upload-session`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    finalizeImageUpload(uploadId: string, body: Models.FinalizeImageUpload, signal?: AbortSignal): Promise<Models.FinalizedImageUploadResponse> {
      return request(`/api/v1/assets/upload-session/${encodeURIComponent(uploadId)}/finalize`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    createImageGeneration(body: Models.CreateImageGeneration, signal?: AbortSignal): Promise<Models.ImageGenerationResponse> {
      return request(`/api/v1/generations`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listImageGenerations(projectId: string, signal?: AbortSignal): Promise<Models.ImageGenerationListResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/generations`, { method: "GET", signal });
    },
    getImageGeneration(jobId: string, signal?: AbortSignal): Promise<Models.ImageGenerationResponse> {
      return request(`/api/v1/generations/${encodeURIComponent(jobId)}`, { method: "GET", signal });
    },
    cancelImageGeneration(jobId: string, body: Models.CancelImageGeneration, signal?: AbortSignal): Promise<Models.ImageGenerationResponse> {
      return request(`/api/v1/generations/${encodeURIComponent(jobId)}/cancel`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getSpatialScene(projectId: string, signal?: AbortSignal): Promise<Models.SpatialSceneResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/spatial-scene`, { method: "GET", signal });
    },
    saveSpatialScene(projectId: string, body: Models.SaveSpatialScene, signal?: AbortSignal): Promise<Models.SpatialSceneResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/spatial-scene`, { method: "PUT", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getCreativeCapabilities(signal?: AbortSignal): Promise<Models.CreativeCapabilitiesResponse> {
      return request(`/api/v1/capabilities`, { method: "GET", signal });
    },
    listProjects(signal?: AbortSignal): Promise<Models.ProjectListResponse> {
      return request(`/api/v1/projects`, { method: "GET", signal });
    },
    createProject(body: Models.CreateProject, signal?: AbortSignal): Promise<Models.ProjectDetailResponse> {
      return request(`/api/v1/projects`, { method: "POST", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    getProject(projectId: string, signal?: AbortSignal): Promise<Models.ProjectDetailResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}`, { method: "GET", signal });
    },
    updateProject(projectId: string, body: Models.UpdateProject, signal?: AbortSignal): Promise<Models.ProjectDetailResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}`, { method: "PATCH", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
    listProjectAssets(projectId: string, signal?: AbortSignal): Promise<Models.AssetListResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/assets`, { method: "GET", signal });
    },
    getCreativeDraft(projectId: string, signal?: AbortSignal): Promise<Models.CreativeDraftResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/creative-draft`, { method: "GET", signal });
    },
    saveCreativeDraft(projectId: string, body: Models.SaveCreativeDraft, signal?: AbortSignal): Promise<Models.CreativeDraftResponse> {
      return request(`/api/v1/projects/${encodeURIComponent(projectId)}/creative-draft`, { method: "PUT", signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    },
  };
}
