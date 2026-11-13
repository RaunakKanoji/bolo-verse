import { CreationAccessError } from "@/features/creation/creation-http";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";
export const videoSourceTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
];
type PreviewAsset = { id: string; mimeType: string; byteSize: number; contentUrl: string | null };
/** Caller owns and revokes the returned URL. No private bytes enter SDK network requests. */
export async function loadVideoPreview(asset: PreviewAsset, signal: AbortSignal): Promise<string> {
  if (
    asset.contentUrl !== `/api/v1/assets/${asset.id}/content` ||
    !videoSourceTypes.includes(asset.mimeType) ||
    asset.byteSize <= 0 ||
    asset.byteSize > MAX_PREVIEW_BYTES
  )
    throw new Error("This private asset is outside the supported video preview limits.");
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
    throw new Error("The private media preview could not be read.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Private media bytes are unavailable.");
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > asset.byteSize || total > MAX_PREVIEW_BYTES)
        throw new Error("Private media exceeds its byte limit.");
      chunks.push(value);
    }
    if (total !== asset.byteSize) throw new Error("Private media preview is incomplete.");
  } catch (cause) {
    await reader.cancel().catch(() => undefined);
    throw cause;
  } finally {
    reader.releaseLock();
  }
  const blob = new Blob(chunks, { type: asset.mimeType });
  validatePreviewAsset(new Uint8Array(await blob.arrayBuffer()), asset.mimeType);
  signal.throwIfAborted();
  return URL.createObjectURL(blob);
}
