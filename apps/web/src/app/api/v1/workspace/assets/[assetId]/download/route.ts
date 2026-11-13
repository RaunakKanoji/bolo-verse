import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import {
  validateWorkspaceDownload,
  workspaceDownloadSupported,
  workspaceUploadExtensions,
} from "@/lib/contracts/workspace-uploads";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse } from "@/server/auth/errors";
import { readXRAsset } from "@/server/db/xr-assets";
import { R2PreviewReader } from "@/server/providers/r2-preview";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request),
      id = z.uuid().safeParse((await context.params).assetId);
    if (!id.success) throw new BoundaryError(400, "INVALID_INPUT", "A valid asset ID is required.");
    const asset = await readXRAsset(subject, id.data);
    if (!workspaceDownloadSupported(asset.mimeType, asset.byteSize))
      throw new BoundaryError(
        415,
        "INVALID_INPUT",
        "This asset has no supported private download.",
      );
    const stored = await new R2PreviewReader().readObject({
      objectKey: asset.objectKey,
      maxBytes: MAX_PREVIEW_BYTES,
      signal: request.signal,
    });
    if (
      stored.bytes.length !== asset.byteSize ||
      (asset.checksumSha256 &&
        createHash("sha256").update(stored.bytes).digest("hex") !== asset.checksumSha256)
    )
      throw new BoundaryError(
        503,
        "SERVICE_UNAVAILABLE",
        "The asset does not match its verified metadata.",
      );
    try {
      validateWorkspaceDownload(stored.bytes, asset.mimeType);
    } catch {
      throw new BoundaryError(
        415,
        "INVALID_INPUT",
        "This asset could not be validated for download.",
      );
    }
    const current = await readXRAsset(subject, id.data);
    if (
      current.objectKey !== asset.objectKey ||
      current.mimeType !== asset.mimeType ||
      current.byteSize !== asset.byteSize ||
      current.checksumSha256 !== asset.checksumSha256
    )
      throw new BoundaryError(
        503,
        "SERVICE_UNAVAILABLE",
        "The asset changed while loading. Try again.",
      );
    let offset = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset >= stored.bytes.length) {
          controller.close();
          return;
        }
        controller.enqueue(stored.bytes.subarray(offset, offset + 65536));
        offset += 65536;
      },
    });
    const extension =
      workspaceUploadExtensions[asset.mimeType] ??
      (
        {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
          "image/gif": "gif",
        } as Record<string, string>
      )[asset.mimeType] ??
      "bin";
    return new Response(body, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": `attachment; filename="project-asset-${asset.id.slice(0, 8)}.${extension}"`,
        "Content-Length": String(stored.bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
