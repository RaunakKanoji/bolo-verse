import { z } from "zod";
import { AssetListSchema } from "@/lib/contracts/shape";
import type { AssetSummary } from "@/lib/contracts/assets";
import { imageCreationMaxBytes } from "@/lib/contracts/creation";
import { imageDimensions } from "@/lib/contracts/xr-image-metadata";
import { CreationAccessError, creationRequest } from "@/features/creation/creation-http";
import { createValidatedCanvasImageUrl } from "@/features/workspace/useImageCanvas";

export async function listProjectImages(projectId: string, signal: AbortSignal) {
  z.uuid().parse(projectId);
  const result = await creationRequest(
    `/api/v1/projects/${projectId}/assets`,
    AssetListSchema,
    {},
    signal,
  );
  if (
    result.assets.some(
      (asset) =>
        asset.projectId !== projectId ||
        (asset.contentUrl !== null && asset.contentUrl !== `/api/v1/assets/${asset.id}/content`),
    )
  )
    throw new Error("Project images did not match this project. Refresh before retrying.");
  return {
    ...result,
    assets: result.assets.filter(
      (asset) =>
        ["image/png", "image/jpeg", "image/webp"].includes(asset.mimeType) &&
        asset.contentUrl &&
        asset.byteSize > 0 &&
        asset.byteSize <= imageCreationMaxBytes &&
        asset.width &&
        asset.height &&
        asset.width <= 8192 &&
        asset.height <= 8192 &&
        asset.width * asset.height <= 4096 * 4096,
    ),
  };
}

/** Read bounded authenticated bytes, then own the returned local URL until teardown. */
export async function readProjectImage(asset: AssetSummary, signal: AbortSignal): Promise<string> {
  if (
    asset.contentUrl !== `/api/v1/assets/${asset.id}/content` ||
    asset.byteSize < 1 ||
    asset.byteSize > imageCreationMaxBytes
  )
    throw new Error("This project image has no supported preview.");
  const response = await fetch(asset.contentUrl, {
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
  });
  if (response.status === 401 || response.status === 403)
    throw new CreationAccessError(response.status);
  if (
    !response.ok ||
    response.redirected ||
    response.headers.get("content-type")?.split(";")[0] !== asset.mimeType
  )
    throw new Error("The project image could not load. Retry its preview.");
  const length = response.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > asset.byteSize))
    throw new Error("The project image exceeds its verified size.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("The project image has no content.");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > asset.byteSize) throw new Error("The project image exceeds its verified size.");
      chunks.push(value);
    }
    if (total !== asset.byteSize) throw new Error("The project image is incomplete.");
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
  const blob = new Blob(chunks, { type: asset.mimeType });
  const dimensions = imageDimensions(new Uint8Array(await blob.arrayBuffer()), asset.mimeType);
  if (dimensions.width !== asset.width || dimensions.height !== asset.height)
    throw new Error("The project image dimensions do not match.");
  signal.throwIfAborted();
  return createValidatedCanvasImageUrl(blob, signal);
}
