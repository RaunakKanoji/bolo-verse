import "server-only";
import { createHash } from "node:crypto";
import { ShareReviewSchema, type ShareReviewRequest } from "@/lib/contracts/reviews";
import { prepareReviewShare, commitReviewShare, readReviewSource } from "@/server/db/reviews";
import { verifyReviewRecipient } from "@/server/auth/review-recipient";
import { R2PreviewReader } from "@/server/providers/r2-preview";
import { validatePreviewAsset } from "@/lib/contracts/xr-assets";
import { BoundaryError } from "@/server/auth/errors";
export async function shareForReview(
  subject: string,
  projectId: string,
  versionId: string,
  value: ShareReviewRequest,
) {
  const parsed = ShareReviewSchema.parse(value);
  const input = { ...parsed, expiresInDays: parsed.expiresInDays ?? 7 };
  const retry = await prepareReviewShare(subject, projectId, versionId, input);
  if (retry) return retry;
  const verified = await verifyReviewRecipient(input.reviewerId);
  if (verified !== input.reviewerId)
    throw new BoundaryError(400, "INVALID_INPUT", "The reviewer identity could not be verified.");
  return commitReviewShare(subject, projectId, versionId, input);
}
export async function readReviewMedia(subject: string, versionId: string, request: Request) {
  const initial = await readReviewSource(subject, versionId);
  const { asset } = initial;
  const data = await new R2PreviewReader().readObject({
    objectKey: asset.objectKey,
    maxBytes: asset.byteSize,
    signal: request.signal,
  });
  if (
    data.bytes.length !== asset.byteSize ||
    data.mimeType !== asset.mimeType ||
    createHash("sha256").update(data.bytes).digest("hex") !== asset.checksumSha256
  )
    throw new BoundaryError(
      503,
      "SERVICE_UNAVAILABLE",
      "This published image could not be verified.",
    );
  try {
    validatePreviewAsset(data.bytes, asset.mimeType);
  } catch {
    throw new BoundaryError(
      503,
      "SERVICE_UNAVAILABLE",
      "This published image could not be verified.",
    );
  }
  await readReviewSource(subject, versionId, initial.grant.id);
  let offset = 0;
  const body = new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        try {
          request.signal.throwIfAborted();
          await readReviewSource(subject, versionId, initial.grant.id);
          request.signal.throwIfAborted();
          if (offset >= data.bytes.length) {
            controller.close();
            return;
          }
          const end = Math.min(offset + 1024 * 1024, data.bytes.length);
          controller.enqueue(data.bytes.subarray(offset, end));
          offset = end;
        } catch {
          controller.error(new Error("Review media access is no longer available."));
        }
      },
    },
    { highWaterMark: 0 },
  );
  return new Response(body, {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Referrer-Policy": "no-referrer",
    },
  });
}
