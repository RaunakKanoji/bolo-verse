import { createHash, randomUUID } from "node:crypto";
import { ResourceIdSchema } from "@/lib/contracts/api";
import { MAX_NATIVE_CONTENT_BYTES, USDZ_MIME_TYPE, nativeContentSupported, validateNativeUSDZ } from "@/lib/contracts/native-assets";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse } from "@/server/auth/errors";
import { readXRAsset } from "@/server/db/xr-assets";
import { R2BoundedReader } from "@/server/providers/r2-bounded";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request);
    const parsed = ResourceIdSchema.safeParse((await context.params).assetId);
    if (!parsed.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid asset ID is required.");
    const asset = await readXRAsset(subject, parsed.data);
    if (!nativeContentSupported(asset.mimeType, asset.byteSize)) throw new BoundaryError(415, "INVALID_INPUT", "This asset has no supported native USDZ download.");
    const { bytes } = await new R2BoundedReader(MAX_NATIVE_CONTENT_BYTES).readObject({ objectKey: asset.objectKey, maxBytes: MAX_NATIVE_CONTENT_BYTES, signal: request.signal });
    if (bytes.length !== asset.byteSize || (asset.checksumSha256 !== null && createHash("sha256").update(bytes).digest("hex") !== asset.checksumSha256.toLowerCase())) {
      throw new BoundaryError(503, "SERVICE_UNAVAILABLE", "The asset does not match its verified metadata.");
    }
    try { validateNativeUSDZ(bytes); }
    catch { throw new BoundaryError(415, "INVALID_INPUT", "This USDZ archive is unsupported or exceeds the native resource limits."); }
    // Authorization and readiness may change during storage IO. Never return stale access.
    const current = await readXRAsset(subject, parsed.data);
    if (current.objectKey !== asset.objectKey || current.mimeType !== asset.mimeType || current.byteSize !== asset.byteSize || current.checksumSha256 !== asset.checksumSha256) {
      throw new BoundaryError(503, "SERVICE_UNAVAILABLE", "The asset changed while it was loading. Try again.");
    }
    request.signal.throwIfAborted();
    let offset = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      controller.enqueue(bytes.subarray(offset, offset + 64 * 1024)); offset += 64 * 1024;
    } });
    return new Response(body, { headers: {
      "Content-Type": USDZ_MIME_TYPE, "Content-Disposition": 'attachment; filename="project-model.usdz"',
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox", "Referrer-Policy": "no-referrer",
    } });
  } catch (error) { return errorResponse(error, requestId); }
}
