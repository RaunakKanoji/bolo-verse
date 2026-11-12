import "server-only";
import { CreationImageMimeSchema, ImageModelIdSchema, ImageAspectRatioSchema, imageGenerationReferenceMaxBytes } from "@/lib/contracts/creation";
import { BoundaryError } from "@/server/auth/errors";
import { claimImageGeneration, readClaimedImageGeneration, markImageProviderStarted, completeImageGeneration, failImageGeneration, recoverExpiredImageGenerations } from "@/server/db/image-generations";
import { createGeminiImageProvider } from "@/server/providers/gemini-image";
import { readStagedImage, writePrivateImage } from "@/server/providers/r2-ingestion";
import { validateIngestedImage } from "./image-ingestion";

/** A database lease owns each dispatch. Lost or cancelled leases cannot publish. */
export async function processImageGeneration(jobId?: string): Promise<boolean> {
  const claim = await claimImageGeneration(jobId);
  if (!claim?.job.leaseExpiresAt) return false;
  const id = claim.job.id, lease = claim.job.leaseExpiresAt;
  const stillOwned = () => readClaimedImageGeneration(id, lease);
  const stopped = () => failImageGeneration(id, lease, "ACCESS_CHANGED", "This generation stopped because project access changed. No output was published.");
  try {
    let reference: { bytes: Uint8Array; mimeType: string } | null = null;
    if (claim.request.referenceAssetId) {
      const asset = claim.reference;
      if (!asset || asset.id !== claim.request.referenceAssetId || asset.projectId !== claim.job.projectId || asset.status !== "ready" || asset.byteSize < 1 || asset.byteSize > imageGenerationReferenceMaxBytes) {
        throw new BoundaryError(400, "INVALID_INPUT", "The private reference image is unavailable.");
      }
      CreationImageMimeSchema.parse(asset.mimeType);
      reference = await readStagedImage({ objectKey: asset.objectKey, maxBytes: asset.byteSize });
      if (!await stillOwned()) { await stopped(); return true; }
      if (reference.mimeType !== asset.mimeType) throw new Error("Image MIME mismatch");
      await validateIngestedImage({ ...reference, byteSize: asset.byteSize, checksumSha256: asset.checksumSha256 ?? undefined });
    }
    if (!await stillOwned()) { await stopped(); return true; }
    // Persist dispatch intent first. A crash/timeout after this point is never retried automatically.
    if (!await markImageProviderStarted(id, lease)) { await stopped(); return true; }
    const generated = await createGeminiImageProvider().generate({ prompt: claim.request.prompt,
      modelId: ImageModelIdSchema.parse(claim.request.modelId), aspectRatio: ImageAspectRatioSchema.parse(claim.request.aspectRatio), reference });
    if (!await stillOwned()) { await stopped(); return true; }
    const metadata = await validateIngestedImage(generated);
    const objectKey = `private/generated/${claim.job.projectId}/${id}`;
    await writePrivateImage({ objectKey, ...generated, checksumSha256: metadata.checksumSha256 });
    if (!await stillOwned()) { await stopped(); return true; }
    if (!await completeImageGeneration(id, lease, { objectKey, ...metadata })) await stopped();
  } catch (error) {
    // Neither provider payloads nor internal/storage exceptions belong in private history.
    const code = error instanceof BoundaryError && error.code === "RATE_LIMITED" ? "RATE_LIMITED" : "GENERATION_FAILED";
    await failImageGeneration(id, lease, code, "Image generation could not finish. It will not retry automatically. A new request may incur another provider charge.");
  }
  return true;
}

/** Explicit worker entry point; schedule regularly to recover queued work after process loss. */
export async function runImageGenerationBatch(limit = 5) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Worker batch size must be between 1 and 20.");
  const interrupted = await recoverExpiredImageGenerations();
  let processed = 0;
  while (processed < limit && await processImageGeneration()) processed++;
  return { processed, interrupted };
}
