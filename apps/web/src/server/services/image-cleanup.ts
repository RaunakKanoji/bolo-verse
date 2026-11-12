import "server-only";
import { imageCleanupCandidateEligible, listImageCleanupCandidates, markImageCleanupDeleted, prepareImageCleanupCandidate, validateImageCleanupLimit } from "@/server/db/image-cleanup";
import { deleteAbandonedImageObject, isImageCleanupObjectKey } from "@/server/providers/r2-image-cleanup";

/** One bounded batch, dry-run by default. Reports contain counts, never private keys. */
export async function runImageCleanupBatch(options: { apply?: boolean; limit?: number; signal?: AbortSignal } = {}) {
  const limit = options.limit ?? 20;
  validateImageCleanupLimit(limit);
  options.signal?.throwIfAborted();
  const candidates = await listImageCleanupCandidates(limit);
  const result = { candidates: candidates.length, uploads: candidates.filter((candidate) => candidate.kind !== "generated").length,
    generations: candidates.filter((candidate) => candidate.kind === "generated").length, deleted: 0, skipped: 0, failed: 0 };
  if (!options.apply) return result;
  for (const candidate of candidates) {
    options.signal?.throwIfAborted();
    try {
      if (!isImageCleanupObjectKey(candidate.objectKey) || !await prepareImageCleanupCandidate(candidate) || !await imageCleanupCandidateEligible(candidate)) { result.skipped++; continue; }
      await deleteAbandonedImageObject(candidate.objectKey, options.signal);
      await markImageCleanupDeleted(candidate);
      result.deleted++;
    } catch {
      // Storage/driver exceptions may include credentials or object identifiers.
      result.failed++;
    }
  }
  return result;
}
