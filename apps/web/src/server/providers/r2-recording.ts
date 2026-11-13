import "server-only";
import { createHash } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { MAX_PREVIEW_BYTES, validatePreviewAsset } from "@/lib/contracts/xr-assets";
import {
  validateWorkspaceUpload,
  workspaceUploadExtensions,
} from "@/lib/contracts/workspace-uploads";
import { BoundaryError } from "@/server/auth/errors";
import { createPrivateStorageClient } from "./private-storage";
export type PrivateRecordingWriteInput = {
  objectKey: string;
  bytes: Uint8Array;
  mimeType: string;
  checksumSha256: string;
  signal?: AbortSignal;
};
/** Independent private writer; image upload acceptance remains unchanged. */
async function writeBoundedAsset(
  input: PrivateRecordingWriteInput,
  scope: "recordings" | "library",
): Promise<void> {
  const extension = workspaceUploadExtensions[input.mimeType];
  const keyPattern = new RegExp(
    `^private/${scope}/[a-f0-9-]+/[a-f0-9-]+/[a-f0-9]{64}\\.${extension ?? "invalid"}$`,
  );
  if (
    !extension ||
    !keyPattern.test(input.objectKey) ||
    (scope === "recordings" && !["video/webm", "video/mp4"].includes(input.mimeType)) ||
    input.bytes.length < 1 ||
    input.bytes.length > MAX_PREVIEW_BYTES ||
    createHash("sha256").update(input.bytes).digest("hex") !== input.checksumSha256
  )
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "Provide a bounded private asset with matching bytes.",
    );
  try {
    if (scope === "recordings") validatePreviewAsset(input.bytes, input.mimeType);
    else validateWorkspaceUpload(input.bytes, input.mimeType);
  } catch {
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "The asset does not match its supported media structure.",
    );
  }
  const { client, bucket } = createPrivateStorageClient();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.objectKey,
        Body: input.bytes,
        ContentType: input.mimeType,
        ContentLength: input.bytes.length,
        ContentMD5: createHash("md5").update(input.bytes).digest("base64"),
        IfNoneMatch: "*",
      }),
      {
        abortSignal: input.signal
          ? AbortSignal.any([input.signal, AbortSignal.timeout(20000)])
          : AbortSignal.timeout(20000),
      },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (("name" in error && error.name === "PreconditionFailed") ||
        ("$metadata" in error &&
          (error.$metadata as { httpStatusCode?: number })?.httpStatusCode === 412))
    )
      throw new BoundaryError(409, "CONFLICT", "This immutable private asset already exists.");
    throw error;
  } finally {
    client.destroy();
  }
}

export function writePrivateRecording(input: PrivateRecordingWriteInput): Promise<void> {
  return writeBoundedAsset(input, "recordings");
}
export function writePrivateLibraryAsset(input: PrivateRecordingWriteInput): Promise<void> {
  return writeBoundedAsset(input, "library");
}
