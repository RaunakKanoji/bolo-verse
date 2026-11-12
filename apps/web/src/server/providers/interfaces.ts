import "server-only";
import type {
  CancelResult, DirectionPayload, EditorCapabilities, Language, MediaEditDocument,
  ProviderOutput, RenderInput, RenderJobReference, RenderJobStatus, StudioCommand, ValidationResult,
} from "@/lib/contracts";

export interface SpeechToTextAdapter {
  transcribe(input: { audio: Uint8Array; mimeType: string; language: Language; signal?: AbortSignal }): Promise<{ text: string; language: Language; durationMs: number }>;
}
export interface TextToSpeechAdapter {
  synthesize(input: { text: string; language: Language; signal?: AbortSignal }): Promise<{ audio: Uint8Array; mimeType: string }>;
}
export interface ReasoningAdapter {
  interpret(input: { transcript: string; language: Language; mode: "command" | "brainstorm"; signal?: AbortSignal }): Promise<StudioCommand>;
  generateDirections(input: { briefVersionId: string; objective: string; facts: string[]; prohibitedClaims: string[]; count: 1 | 2 | 3; request?: string; signal?: AbortSignal }): Promise<DirectionPayload[]>;
}

// Callers must authorize object keys before invoking storage. No method accepts
// arbitrary remote URLs. Later upload finalization verifies copied candidate bytes.
export interface StorageAdapter {
  createUploadUrl(input: { stagingKey: string; mimeType: string; bytes: number; expiresInSeconds: number }): Promise<{ url: string; expiresAt: string }>;
  createReadUrl(input: { objectKey: string; expiresInSeconds: number }): Promise<{ url: string; expiresAt: string }>;
  copyObject(input: { sourceKey: string; destinationKey: string }): Promise<void>;
  readObject(input: { objectKey: string; maxBytes: number }): Promise<{ bytes: Uint8Array; mimeType: string }>;
  deleteObject(input: { objectKey: string }): Promise<void>;
}

export interface MediaEditorAdapter {
  getCapabilities(): Promise<EditorCapabilities>;
  validateEdit(edit: MediaEditDocument): Promise<ValidationResult>;
  submitRender(input: RenderInput): Promise<RenderJobReference>;
  getRenderStatus(job: RenderJobReference): Promise<RenderJobStatus>;
  getOutput(job: RenderJobReference): Promise<ProviderOutput>;
  cancelRender?: (job: RenderJobReference) => Promise<CancelResult>;
}

export interface ProviderRegistry {
  stt: SpeechToTextAdapter;
  tts: TextToSpeechAdapter;
  reasoning: ReasoningAdapter;
  storage: StorageAdapter;
  editor: MediaEditorAdapter;
}
