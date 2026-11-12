import {
  CreateImageUploadSchema,
  imageGenerationReferenceMaxBytes,
  FinalizedImageUploadResultSchema,
  ImageUploadResultSchema,
} from "@/lib/contracts/creation";
import { validatePreviewAsset } from "@/lib/contracts/xr-assets";
import { creationRequest } from "./creation-http";

/** The explicit reference action is the only path that sends a local image to R2. */
export async function uploadReferenceImage(
  projectId: string,
  file: File,
  signal: AbortSignal,
): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > imageGenerationReferenceMaxBytes
  )
    throw new Error("Choose a static PNG, JPEG, or WebP image up to 10 MiB.");
  signal.throwIfAborted();
  const bytes = new Uint8Array(await file.arrayBuffer());
  validatePreviewAsset(bytes, file.type);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const checksumSha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  signal.throwIfAborted();
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
          idempotencyKey: crypto.randomUUID(),
        }),
      ),
    },
    signal,
  );
  if (upload.projectId !== projectId)
    throw new Error("The upload does not belong to this project.");
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    body: file,
    signal,
    credentials: "omit",
    cache: "no-store",
    headers: {
      "Content-Type": upload.uploadContentType,
      "If-None-Match": "*",
    },
  });
  if (!response.ok)
    throw new Error("The private upload could not finish. Choose the image again to retry.");
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
  if (asset.projectId !== projectId)
    throw new Error("The finalized image does not belong to this project.");
  return asset.id;
}
