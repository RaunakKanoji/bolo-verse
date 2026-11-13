import "server-only";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { BoundaryError } from "@/server/auth/errors";
import { createPrivateStorageClient } from "./private-storage";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const cleanupKey = new RegExp(
  `^(?:staging/images|private/generated|private/images)/${uuid}/${uuid}$`,
  "i",
);
export function isImageCleanupObjectKey(objectKey: string): boolean {
  return cleanupKey.test(objectKey);
}

/** Server maintenance only: the caller must immediately revalidate DB eligibility. */
export async function deleteAbandonedImageObject(
  objectKey: string,
  signal?: AbortSignal,
): Promise<void> {
  if (!isImageCleanupObjectKey(objectKey))
    throw new BoundaryError(
      400,
      "INVALID_INPUT",
      "This object is outside the image cleanup boundary.",
    );
  signal?.throwIfAborted();
  const { client, bucket } = createPrivateStorageClient();
  try {
    const timeout = AbortSignal.timeout(20_000);
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }), {
      abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } finally {
    client.destroy();
  }
}
