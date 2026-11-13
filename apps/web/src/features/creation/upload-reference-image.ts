import {
  CreateImageUploadSchema,
  imageGenerationReferenceMaxBytes,
  imageCreationMaxBytes,
  FinalizedImageUploadResultSchema,
  ImageUploadResultSchema,
} from "@/lib/contracts/creation";
import { validatePreviewAsset } from "@/lib/contracts/xr-assets";
import { creationRequest } from "./creation-http";
import type { AssetSummary } from "@/lib/contracts/assets";

export type ImageUploadPhase = "preparing" | "reserving" | "uploading" | "verifying";
type UploadOptions = { idempotencyKey: string; onPhase?: (phase: ImageUploadPhase) => void };

/** The explicit reference action is the only path that sends a local image to R2. */
export async function uploadReferenceImage(
  projectId: string,
  file: File,
  signal: AbortSignal,
): Promise<string> {
  return (
    await uploadImage(
      projectId,
      file,
      signal,
      { idempotencyKey: crypto.randomUUID() },
      imageGenerationReferenceMaxBytes,
    )
  ).id;
}

/** Reuse the same key for an explicit retry of the same File; no automatic retry. */
export function uploadProjectImage(
  projectId: string,
  file: File,
  signal: AbortSignal,
  options: UploadOptions,
): Promise<AssetSummary> {
  return uploadImage(projectId, file, signal, options, imageCreationMaxBytes);
}

async function uploadImage(
  projectId: string,
  file: File,
  signal: AbortSignal,
  options: UploadOptions,
  maxBytes: number,
): Promise<AssetSummary> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > maxBytes
  )
    throw new Error(
      `Choose a static PNG, JPEG, or WebP image up to ${maxBytes / 1024 / 1024} MiB.`,
    );
  signal.throwIfAborted();
  options.onPhase?.("preparing");
  const bytes = new Uint8Array(await file.arrayBuffer());
  validatePreviewAsset(bytes, file.type);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const checksumSha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  signal.throwIfAborted();
  options.onPhase?.("reserving");
  const { upload } = await creationRequest(
    "/api/v1/assets/upload-session",
    ImageUploadResultSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        CreateImageUploadSchema.parse({
          projectId,
          fileName: file.name,
          mimeType: file.type,
          byteSize: file.size,
          checksumSha256,
          idempotencyKey: options.idempotencyKey,
        }),
      ),
    },
    signal,
  );
  if (upload.projectId !== projectId || upload.uploadContentType !== file.type)
    throw new Error("The upload does not belong to this project.");
  signal.throwIfAborted();
  options.onPhase?.("uploading");
  const transfer = new AbortController();
  const abort = () => transfer.abort();
  signal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 60_000);
  try {
    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      body: file,
      signal: AbortSignal.any([signal, transfer.signal]),
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": upload.uploadContentType, "If-None-Match": "*" },
    });
    // A prior ambiguous transfer may already have created this immutable stage.
    // Only server verification can determine whether it matches the reservation.
    if (!response.ok && ![409, 412].includes(response.status)) throw new Error();
  } catch {
    throw new Error(
      "The private transfer could not finish. Retry the same image or refresh project images to check its status.",
    );
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
  signal.throwIfAborted();
  options.onPhase?.("verifying");
  const { asset } = await creationRequest(
    `/api/v1/assets/upload-session/${upload.id}/finalize`,
    FinalizedImageUploadResultSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
    signal,
  );
  if (
    asset.projectId !== projectId ||
    asset.id !== upload.assetId ||
    asset.mimeType !== file.type ||
    asset.byteSize !== file.size ||
    asset.contentUrl !== `/api/v1/assets/${asset.id}/content`
  )
    throw new Error("The finalized image does not belong to this project.");
  signal.throwIfAborted();
  return asset;
}
