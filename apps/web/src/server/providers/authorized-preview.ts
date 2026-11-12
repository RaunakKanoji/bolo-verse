import "server-only";
import { z } from "zod";
import { BoundaryError } from "@/server/auth/errors";
import { readXRAsset } from "@/server/db/xr-assets";
import { R2PreviewReader } from "./r2-preview";
import { MAX_PREVIEW_BYTES, previewSupported, validatePreviewAsset } from "@/lib/contracts/xr-assets";

/** Caller supplies a verified identity; SQL scopes every private asset read. */
export async function readAuthorizedPreview(subject: string, request: Request, context: { params: Promise<{ assetId: string }> }) {
    const assetId = z.uuid().safeParse((await context.params).assetId);
    if (!assetId.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid asset ID is required.");
    const asset = await readXRAsset(subject, assetId.data);
    if (!previewSupported(asset.mimeType, asset.byteSize)) throw new BoundaryError(415, "INVALID_INPUT", "This asset has no browser preview. Use the standard project workspace.");
    const data = await new R2PreviewReader().readObject({ objectKey: asset.objectKey, maxBytes: MAX_PREVIEW_BYTES, signal: request.signal });
    if (data.bytes.length !== asset.byteSize) throw new BoundaryError(503, "SERVICE_UNAVAILABLE", "The asset does not match its verified metadata.");
    try { validatePreviewAsset(data.bytes, asset.mimeType); }
    catch (error) { throw new BoundaryError(415, "INVALID_INPUT", error instanceof Error ? error.message : "The asset cannot be previewed safely."); }
    // Storage may be slow: access or asset readiness can change while reading.
    const current = await readXRAsset(subject, assetId.data);
    if (current.objectKey !== asset.objectKey || current.mimeType !== asset.mimeType || current.byteSize !== asset.byteSize || current.checksumSha256 !== asset.checksumSha256) throw new BoundaryError(503, "SERVICE_UNAVAILABLE", "The asset changed while its preview was loading. Try again.");
    // Stream the already-validated bytes in bounded chunks. Large preview
    // responses must not depend on a platform's buffered response size limit.
    let offset = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      if (offset >= data.bytes.length) { controller.close(); return; }
      controller.enqueue(data.bytes.subarray(offset, offset + 64 * 1024));
      offset += 64 * 1024;
    } });
    return new Response(body, { headers: {
      "Content-Type": asset.mimeType,
      "Content-Disposition": asset.mimeType === "application/pdf" ? 'attachment; filename="project-document.pdf"' : "inline",
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox", "Referrer-Policy": "no-referrer",
    } });
}
