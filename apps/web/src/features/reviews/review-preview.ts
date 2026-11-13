import type { ReviewDetail } from "@/lib/contracts/reviews";
import { CreationAccessError } from "@/features/creation/creation-http";
import { imageDimensions } from "@/lib/contracts/xr-image-metadata";
import { createValidatedCanvasImageUrl } from "@/features/workspace/useImageCanvas";
export async function loadReviewPreview(
  review: Pick<ReviewDetail, "reviewId" | "preview">,
  signal: AbortSignal,
) {
  if (review.preview.url !== `/api/v1/reviews/${review.reviewId}/content`)
    throw new Error("Invalid review preview.");
  const response = await fetch(review.preview.url, {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  if (response.status === 401 || response.status === 403)
    throw new CreationAccessError(response.status);
  if (
    !response.ok ||
    response.redirected ||
    response.headers.get("content-type")?.split(";")[0] !== review.preview.mimeType
  )
    throw new Error("Review preview unavailable.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Review preview unavailable.");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > review.preview.byteSize || total > 20971520)
        throw new Error("Review preview exceeds its limit.");
      chunks.push(value);
    }
    if (total !== review.preview.byteSize) throw new Error("Review preview is incomplete.");
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const blob = new Blob(chunks, { type: review.preview.mimeType });
  const dimensions = imageDimensions(
    new Uint8Array(await blob.arrayBuffer()),
    review.preview.mimeType,
  );
  if (dimensions.width !== review.preview.width || dimensions.height !== review.preview.height)
    throw new Error("Review preview dimensions do not match.");
  signal.throwIfAborted();
  return createValidatedCanvasImageUrl(blob, signal);
}
