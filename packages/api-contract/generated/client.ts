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
