import "server-only";
import { z } from "zod";
import type { MediaEditDocument, RenderJobReference, RenderJobStatus } from "@/lib/contracts";
import {
  VideoEditorCapabilitiesSchema,
  VideoEditorDocumentSchema,
} from "@/lib/contracts/video-editor";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv, type ServerEnv } from "@/server/config/env";
import type { MediaEditorAdapter } from "./interfaces";
import {
  readShotstackBoundedBody,
  validateShotstackOutputUrl,
  type ShotstackSource,
} from "./shotstack-media";

export class ShotstackProviderError extends Error {
  readonly retryable = false;
  constructor(
    readonly code:
      "SHOTSTACK_DISPATCH_UNCERTAIN" | "SHOTSTACK_INVALID_RESPONSE" | "SHOTSTACK_UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "ShotstackProviderError";
  }
}
export function getVideoEditorCapabilities(env: ServerEnv = getServerEnv()) {
  const configured = !!(
    env.SHOTSTACK_API_KEY &&
    env.SHOTSTACK_ENV &&
    env.DATABASE_URL &&
    env.CLERK_SECRET_KEY &&
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    env.R2_ACCOUNT_ID &&
    /^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID) &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET
  );
  return VideoEditorCapabilitiesSchema.parse({
    availability: !env.ENABLE_EXTERNAL_EDITOR
      ? "disabled"
      : configured
        ? "configured"
        : "unconfigured",
    reason: !env.ENABLE_EXTERNAL_EDITOR
      ? "External video rendering is disabled."
      : configured
        ? "Configuration is present; live rendering has not been verified."
        : "Configure identity, database, private storage and Shotstack before rendering.",
    environment: env.SHOTSTACK_ENV ?? null,
    maxDurationSeconds: 60,
    maxClips: 50,
    outputMimeType: "video/mp4",
  });
}
/** Only service-generated, transient private R2 sources may cross this boundary. */
export function buildShotstackEdit(
  document: MediaEditDocument,
  sources: readonly ShotstackSource[],
) {
  const parsed = VideoEditorDocumentSchema.safeParse(document);
  if (!parsed.success)
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Use a supported nonoverlapping timeline of at most 60 seconds.",
    );
  const edit = parsed.data;
  if (new Set(sources.map((source) => source.assetId)).size !== sources.length)
    throw new BoundaryError(400, "INVALID_INPUT", "Video source IDs must be unique.");
  const clips = edit.clips.map((clip) => {
    const source = sources.find((item) => item.assetId === clip.assetId);
    if (
      !source ||
      !["image/png", "image/jpeg", "image/webp", "video/mp4", "video/webm"].includes(
        source.mimeType,
      )
    )
      throw new BoundaryError(
        400,
        "INVALID_INPUT",
        "Every clip requires a supported ready project image or video.",
      );
    let url: URL;
    try {
      url = new URL(source.url);
    } catch {
      throw new BoundaryError(400, "INVALID_INPUT", "The private video source is invalid.");
    }
    if (
      url.protocol !== "https:" ||
      !/^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i.test(url.hostname) ||
      url.port ||
      url.username ||
      url.password ||
      url.hash
    )
      throw new BoundaryError(400, "INVALID_INPUT", "The private video source is invalid.");
    if (
      clip.audioLevel > 1 ||
      (source.mimeType.startsWith("image/") && clip.trimStartSeconds !== 0)
    )
      throw new BoundaryError(
        400,
        "INVALID_INPUT",
        "Shotstack supports video volume from zero to one and no image trim.",
      );
    if (
      source.durationSeconds !== null &&
      (!Number.isFinite(source.durationSeconds) ||
        source.durationSeconds <= 0 ||
        clip.trimStartSeconds + clip.durationSeconds > source.durationSeconds)
    )
      throw new BoundaryError(400, "INVALID_INPUT", "The clip extends beyond its source duration.");
    return {
      asset: source.mimeType.startsWith("image/")
        ? { type: "image" as const, src: source.url }
        : {
            type: "video" as const,
            src: source.url,
            trim: clip.trimStartSeconds,
            volume: clip.audioLevel,
          },
      start: clip.startSeconds,
      length: clip.durationSeconds,
      fit: "contain" as const,
    };
  });
  // Independent overlay tracks allow concurrent overlays without same-track overlap.
  const overlays = edit.overlays.map((overlay) => ({
    clips: [
      {
        asset: {
          type: "rich-text" as const,
          text: overlay.text,
          font: { family: "Open Sans", size: overlay.style.fontSize, color: overlay.style.color },
          align: {
            horizontal: overlay.style.align,
            vertical: overlay.kind === "caption" ? ("bottom" as const) : ("middle" as const),
          },
        },
        start: overlay.startSeconds,
        length: overlay.durationSeconds,
        position: overlay.kind === "caption" ? ("bottom" as const) : ("center" as const),
      },
    ],
  }));
  return {
    timeline: { tracks: [...overlays, { clips }] },
    output: { format: "mp4" as const, resolution: "hd" as const, aspectRatio: edit.aspectRatio },
  };
}
const submissionSchema = z.object({
  success: z.literal(true),
  response: z.object({ id: z.uuid() }),
});
const statusSchema = z.object({
  success: z.literal(true),
  response: z.object({
    id: z.uuid(),
    status: z.enum(["queued", "fetching", "rendering", "saving", "done", "failed"]),
    url: z.string().max(2048).optional(),
  }),
});
export type ShotstackPollResult = {
  status: "queued" | "processing" | "ready" | "failed";
  outputUrl?: string;
  errorMessage?: string;
};
export function createShotstackProvider({
  env = getServerEnv(),
  fetcher = fetch,
}: { env?: ServerEnv; fetcher?: typeof fetch } = {}) {
  const ensureConfigured = () => {
    if (getVideoEditorCapabilities(env).availability !== "configured")
      throw new BoundaryError(
        503,
        "PROVIDER_UNCONFIGURED",
        "Private video rendering is not configured or enabled.",
      );
  };
  const endpoint = `https://api.shotstack.io/edit/${env.SHOTSTACK_ENV === "production" ? "v1" : "stage"}/render`;
  async function request(url: string, options: RequestInit) {
    const response = await fetcher(url, {
      ...options,
      redirect: "error",
      cache: "no-store",
      headers: { "x-api-key": env.SHOTSTACK_API_KEY!, "content-type": "application/json" },
    });
    if (
      !response.ok ||
      response.redirected ||
      response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
        "application/json"
    ) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error("Unusable provider response.");
    }
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(
        await readShotstackBoundedBody(response, 256 * 1024),
      ),
    );
  }
  return {
    async submit(input: {
      edit: MediaEditDocument;
      sources: readonly ShotstackSource[];
      signal?: AbortSignal;
    }): Promise<{ providerJobId: string }> {
      ensureConfigured();
      const payload = buildShotstackEdit(input.edit, input.sources);
      input.signal?.throwIfAborted();
      try {
        const result = submissionSchema.parse(
          await request(endpoint, {
            method: "POST",
            body: JSON.stringify(payload),
            signal: input.signal
              ? AbortSignal.any([input.signal, AbortSignal.timeout(20_000)])
              : AbortSignal.timeout(20_000),
          }),
        );
        return { providerJobId: result.response.id };
      } catch {
        throw new ShotstackProviderError(
          "SHOTSTACK_DISPATCH_UNCERTAIN",
          "The render submission could not be confirmed. It will not be submitted again automatically.",
        );
      }
    },
    async poll(providerJobId: string, signal?: AbortSignal): Promise<ShotstackPollResult> {
      ensureConfigured();
      if (!z.uuid().safeParse(providerJobId).success)
        throw new BoundaryError(400, "INVALID_INPUT", "The render reference is invalid.");
      try {
        const { response } = statusSchema.parse(
          await request(`${endpoint}/${providerJobId}?data=false`, {
            method: "GET",
            signal: signal
              ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
              : AbortSignal.timeout(20_000),
          }),
        );
        if (response.id !== providerJobId) throw new Error("Mismatched render reference.");
        if (response.status === "done") {
          if (!response.url) throw new Error("Missing output.");
          validateShotstackOutputUrl(response.url, providerJobId, env.SHOTSTACK_ENV);
          return { status: "ready", outputUrl: response.url };
        }
        if (response.status === "failed")
          return { status: "failed", errorMessage: "Shotstack could not render this edit." };
        return { status: response.status === "queued" ? "queued" : "processing" };
      } catch {
        throw new ShotstackProviderError(
          "SHOTSTACK_INVALID_RESPONSE",
          "The render status could not be safely verified.",
        );
      }
    },
  };
}
/** The resolver MUST authorize current edit permission and same-project ready assets;
 * callers MUST reauthorize after provider/storage latency before publishing. */
export function createShotstackEditor({
  env,
  fetcher,
  resolveSource,
}: {
  env?: ServerEnv;
  fetcher?: typeof fetch;
  resolveSource?: (input: { projectId: string; assetIds: string[] }) => Promise<ShotstackSource[]>;
} = {}): MediaEditorAdapter {
  const provider = createShotstackProvider({ env, fetcher });
  async function status(job: RenderJobReference): Promise<RenderJobStatus> {
    const result = await provider.poll(job.jobId);
    if (result.status === "ready")
      return {
        status: "ready",
        output: { providerAssetId: job.jobId, url: result.outputUrl!, mimeType: "video/mp4" },
      };
    if (result.status === "failed")
      return {
        status: "failed",
        error: { code: "SERVICE_UNAVAILABLE", message: result.errorMessage!, retryable: false },
      };
    return { status: result.status };
  }
  return {
    async getCapabilities() {
      return {
        operations: ["trim_clip", "set_title", "set_caption", "set_audio_level"],
        aspectRatios: ["9:16", "1:1", "16:9"],
        outputMimeTypes: ["video/mp4"],
        canCancel: false,
      };
    },
    async validateEdit(edit) {
      const parsed = VideoEditorDocumentSchema.safeParse(edit);
      return parsed.success && edit.clips.every((clip) => clip.audioLevel <= 1)
        ? { valid: true }
        : {
            valid: false,
            issues: [
              {
                path: "clips",
                message:
                  "Use a supported timeline of at most 60 seconds and volume from zero to one.",
              },
            ],
          };
    },
    async submitRender(input) {
      if (!resolveSource)
        throw new BoundaryError(
          503,
          "PROVIDER_UNCONFIGURED",
          "An authorized private source resolver is required.",
        );
      const sources = await resolveSource({
        projectId: input.projectId,
        assetIds: [...new Set(input.edit.clips.map((clip) => clip.assetId))],
      });
      const result = await provider.submit({ edit: input.edit, sources });
      return { provider: "shotstack", jobId: result.providerJobId };
    },
    getRenderStatus: status,
    async getOutput(job) {
      const result = await status(job);
      if (result.status !== "ready")
        throw new ShotstackProviderError(
          "SHOTSTACK_UNAVAILABLE",
          "The rendered output is not ready.",
        );
      return result.output;
    },
  };
}
