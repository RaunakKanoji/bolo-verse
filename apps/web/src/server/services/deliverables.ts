import "server-only";
import { PublishDeliverableSchema, type PublishDeliverable } from "@/lib/contracts/deliverables";
import { prepareDeliverable, commitDeliverable } from "@/server/db/deliverables";
import { readStagedImage } from "@/server/providers/r2-ingestion";
import { validateIngestedImage } from "./image-ingestion";
import { BoundaryError } from "@/server/auth/errors";

export async function publishDeliverable(subject: string, projectId: string, value: PublishDeliverable, signal?: AbortSignal) {
  const input = PublishDeliverableSchema.parse(value);
  signal?.throwIfAborted();
  const prepared = await prepareDeliverable(subject, projectId, input);
  if (prepared.existing) return prepared.existing;
  const asset = prepared.asset!;
  const data = await readStagedImage({ objectKey: asset.objectKey, maxBytes: asset.byteSize, signal });
  if (data.mimeType !== asset.mimeType) throw new BoundaryError(400, "INVALID_INPUT", "The source image no longer matches its verified metadata.");
  const image = await validateIngestedImage({ ...data, byteSize: asset.byteSize, checksumSha256: asset.checksumSha256! });
  if (image.width !== asset.width || image.height !== asset.height) throw new BoundaryError(400, "INVALID_INPUT", "The source image dimensions no longer match.");
  signal?.throwIfAborted();
  return commitDeliverable(subject, projectId, input, asset);
}
