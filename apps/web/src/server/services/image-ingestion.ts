import "server-only";
import { createHash } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { imageDimensions } from "@/lib/contracts/xr-image-metadata";
import { BoundaryError } from "@/server/auth/errors";
import { imageCreationMaxBytes, CreationImageMimeSchema, ImageUploadResultSchema, FinalizedImageUploadResultSchema, type CreateImageUpload } from "@/lib/contracts/creation";
import { createAssetUploadSession, readOwnedImageUpload, completeImageUpload, imageAssetSummary } from "@/server/db/asset-ingestions";
import { readStagedImage, signImageUpload, writePrivateImage } from "@/server/providers/r2-ingestion";

/** Shared validation for both uploaded and provider-generated static images. */
export async function validateIngestedImage(input: { bytes: Uint8Array; mimeType: string; byteSize?: number; checksumSha256?: string }) {
  const byteSize = input.bytes.byteLength;
  const mime = CreationImageMimeSchema.safeParse(input.mimeType);
  if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > imageCreationMaxBytes ||
      !mime.success ||
      input.byteSize !== undefined && input.byteSize !== byteSize) {
    throw new BoundaryError(400, "INVALID_INPUT", "The uploaded image type or byte size does not match the reservation.");
  }
  const checksumSha256 = createHash("sha256").update(input.bytes).digest("hex");
  if (input.checksumSha256 !== undefined && input.checksumSha256 !== checksumSha256) {
    throw new BoundaryError(400, "INVALID_INPUT", "The uploaded image checksum does not match the reservation.");
  }
  let decoder: Sharp | undefined;
  try {
    const { width, height } = imageDimensions(input.bytes, input.mimeType);
    // Header inspection bounds allocations before the codec verifies all image pixels.
    decoder = sharp(input.bytes, { limitInputPixels: 4096 * 4096, limitInputChannels: 4,
      failOn: "warning", sequentialRead: true, animated: false })
      .toColourspace("srgb").ensureAlpha().raw({ depth: "uchar" });
    const expectedDecodedBytes = width * height * 4;
    let decodedBytes = 0;
    // Consume/discard decoded RGBA. Never persist pixels or retain an unbounded output list.
    for await (const chunk of decoder) {
      decodedBytes += (chunk as Buffer).byteLength;
      if (decodedBytes > 64 * 1024 * 1024 || decodedBytes > expectedDecodedBytes) {
        throw new Error("The decoded image exceeds its pixel bounds.");
      }
    }
    if (decodedBytes !== expectedDecodedBytes) throw new Error("The image pixel data is incomplete.");
    return { width, height, byteSize, checksumSha256, mimeType: mime.data };
  } catch {
    throw new BoundaryError(400, "INVALID_INPUT", "Provide a valid static PNG, JPEG or WebP image within the image dimension limits.");
  } finally { decoder?.destroy(); }
}


export async function beginImageUpload(subject: string, input: CreateImageUpload, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const upload = await createAssetUploadSession(subject, input);
  const seconds = Math.min(600, Math.floor((upload.expiresAt.getTime() - Date.now()) / 1000));
  if (seconds < 1) throw new BoundaryError(409, "CONFLICT", "This image upload session expired. Create a new session.");
  const signed = await signImageUpload({ objectKey: upload.stagingObjectKey, mimeType: upload.mimeType,
    byteSize: upload.byteSize, checksumSha256: upload.checksumSha256, expiresInSeconds: seconds, signal });
  await readOwnedImageUpload(subject, upload.id);
  return ImageUploadResultSchema.parse({ upload: { id: upload.id, projectId: upload.projectId, assetId: upload.assetId,
    expiresAt: upload.expiresAt.toISOString(), uploadUrl: signed.uploadUrl, uploadContentType: upload.mimeType } });
}
export async function finalizeImageUpload(subject: string, uploadId: string, signal?: AbortSignal) {
  const initial = await readOwnedImageUpload(subject, uploadId);
  if (initial.upload.status === "ready") return FinalizedImageUploadResultSchema.parse({ asset: imageAssetSummary(initial.asset) });
  const { upload } = initial;
  const staged = await readStagedImage({ objectKey: upload.stagingObjectKey, maxBytes: upload.byteSize, signal });
  await readOwnedImageUpload(subject, uploadId);
  if (staged.mimeType !== upload.mimeType) throw new BoundaryError(400, "INVALID_INPUT", "The staged image MIME type does not match its upload session.");
  const validated = await validateIngestedImage({ ...staged, byteSize: upload.byteSize, checksumSha256: upload.checksumSha256 });
  await readOwnedImageUpload(subject, uploadId);
  try {
    await writePrivateImage({ objectKey: upload.finalObjectKey, ...staged, checksumSha256: upload.checksumSha256, signal });
  } catch (error) {
    if (!(error instanceof BoundaryError) || error.status !== 409) throw error;
    // Recover safely after an earlier conditional PUT succeeded but its request or DB write failed.
    await readOwnedImageUpload(subject, uploadId);
    const existing = await readStagedImage({ objectKey: upload.finalObjectKey, maxBytes: upload.byteSize, signal });
    await readOwnedImageUpload(subject, uploadId);
    if (existing.mimeType !== upload.mimeType) throw new BoundaryError(409, "CONFLICT", "The reserved image object does not match this upload.");
    await validateIngestedImage({ ...existing, byteSize: upload.byteSize, checksumSha256: upload.checksumSha256 });
  }
  signal?.throwIfAborted();
  await readOwnedImageUpload(subject, uploadId);
  const asset = await completeImageUpload(subject, uploadId, { width: validated.width, height: validated.height });
  // Recheck before returning private metadata after the database and storage awaits.
  await readOwnedImageUpload(subject, uploadId);
  return FinalizedImageUploadResultSchema.parse({ asset });
}
