import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { AssetSummarySchema } from "@/lib/contracts/assets";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";
import {
  workspaceUploadExtensions,
  validateWorkspaceUpload,
} from "@/lib/contracts/workspace-uploads";
import { getV1Subject } from "@/server/auth/api-identity";
import { BoundaryError, errorResponse, successResponse } from "@/server/auth/errors";
import {
  authorizeWorkspaceUpload,
  reserveWorkspaceUpload,
  finalizeWorkspaceUpload,
} from "@/server/db/workspace";
import { writePrivateRecording, writePrivateLibraryAsset } from "@/server/providers/r2-recording";
import { R2PreviewReader } from "@/server/providers/r2-preview";
const QuerySchema = z.strictObject({ projectId: z.uuid(), idempotencyKey: z.uuid() });
async function boundedUpload(request: Request) {
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_PREVIEW_BYTES))
    throw new BoundaryError(413, "INVALID_INPUT", "Assets must be at most 20 MiB.");
  if (!request.body) throw new BoundaryError(400, "INVALID_INPUT", "A asset body is required.");
  const reader = request.body.getReader(),
    parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.length;
      if (total > MAX_PREVIEW_BYTES)
        throw new BoundaryError(413, "INVALID_INPUT", "Assets must be at most 20 MiB.");
      parts.push(part.value);
    }
    if (!total) throw new BoundaryError(400, "INVALID_INPUT", "An empty asset cannot be attached.");
    if (length !== null && Number(length) !== total)
      throw new BoundaryError(400, "INVALID_INPUT", "The asset body length does not match.");
    const bytes = new Uint8Array(total);
    let at = 0;
    for (const part of parts) {
      bytes.set(part, at);
      at += part.length;
    }
    return bytes;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
/** Binary-only transport: device metadata is deliberately not accepted as authority. */
export async function uploadWorkspaceAsset(request: Request, scope: "recordings" | "library") {
  const requestId = randomUUID();
  try {
    const subject = await getV1Subject(request, { mutation: true });
    const params = new URL(request.url).searchParams;
    const fields: Record<string, string> = {};
    for (const [key, value] of params) {
      if (key in fields)
        throw new BoundaryError(400, "INVALID_INPUT", "Duplicate query fields are not allowed.");
      fields[key] = value;
    }
    const parsed = QuerySchema.safeParse(fields);
    if (!parsed.success)
      throw new BoundaryError(400, "INVALID_INPUT", "Provide a project and asset operation ID.");
    const { projectId, idempotencyKey } = parsed.data;
    await authorizeWorkspaceUpload(subject, projectId);
    const mimeType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (
      !mimeType ||
      !Object.hasOwn(workspaceUploadExtensions, mimeType) ||
      (scope === "recordings" && mimeType !== "video/webm" && mimeType !== "video/mp4")
    )
      throw new BoundaryError(
        415,
        "INVALID_INPUT",
        scope === "recordings"
          ? "Attach a WebM or MP4 recording."
          : "Use PDF, self-contained GLB/glTF, WebM/MP4 video, or PCM WAV audio. Images use the image upload workflow.",
      );
    const bytes = await boundedUpload(request);
    try {
      if (scope === "recordings") validatePreviewAsset(bytes, mimeType);
      else validateWorkspaceUpload(bytes, mimeType);
    } catch {
      throw new BoundaryError(
        400,
        "INVALID_INPUT",
        "The asset does not match its supported media structure.",
      );
    }
    const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
    const objectKey = `private/${scope}/${projectId}/${idempotencyKey}/${checksumSha256}.${workspaceUploadExtensions[mimeType]}`;
    const reservation = await reserveWorkspaceUpload(subject, {
      id: idempotencyKey,
      projectId,
      mimeType,
      byteSize: bytes.length,
      checksumSha256,
      objectKey,
    });
    if (reservation.status !== "ready") {
      try {
        await (scope === "recordings" ? writePrivateRecording : writePrivateLibraryAsset)({
          objectKey,
          bytes,
          mimeType,
          checksumSha256,
          signal: request.signal,
        });
      } catch (error) {
        if (!(error instanceof BoundaryError) || error.status !== 409) throw error;
        const stored = await new R2PreviewReader().readObject({
          objectKey,
          maxBytes: MAX_PREVIEW_BYTES,
          signal: request.signal,
        });
        if (
          stored.mimeType !== mimeType ||
          stored.bytes.length !== bytes.length ||
          createHash("sha256").update(stored.bytes).digest("hex") !== checksumSha256
        )
          throw new BoundaryError(409, "CONFLICT", "The stored asset could not be verified.");
        try {
          if (scope === "recordings") validatePreviewAsset(stored.bytes, mimeType);
          else validateWorkspaceUpload(stored.bytes, mimeType);
        } catch {
          throw new BoundaryError(409, "CONFLICT", "The stored asset could not be verified.");
        }
      }
    }
    const asset = await finalizeWorkspaceUpload(subject, projectId, reservation.id, checksumSha256);
    return successResponse(
      {
        asset: AssetSummarySchema.parse({
          id: asset.id,
          projectId: asset.projectId,
          mimeType: asset.mimeType,
          byteSize: asset.byteSize,
          width: asset.width,
          height: asset.height,
          durationSeconds: asset.durationSeconds,
          createdAt: asset.createdAt.toISOString(),
          contentUrl: mimeType === "audio/wav" ? null : `/api/v1/assets/${asset.id}/content`,
          nativeContentUrl: null,
        }),
      },
      requestId,
      201,
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
