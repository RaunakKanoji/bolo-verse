import "server-only";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv } from "@/server/config/env";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const cleanupKey = new RegExp(`^(?:staging/images|private/generated|private/images)/${uuid}/${uuid}$`, "i");
export function isImageCleanupObjectKey(objectKey: string): boolean { return cleanupKey.test(objectKey); }

/** Server maintenance only: the caller must immediately revalidate DB eligibility. */
export async function deleteAbandonedImageObject(objectKey: string, signal?: AbortSignal): Promise<void> {
  if (!isImageCleanupObjectKey(objectKey)) throw new BoundaryError(400, "INVALID_INPUT", "This object is outside the image cleanup boundary.");
  signal?.throwIfAborted();
  const env = getServerEnv();
  if (!env.R2_ACCOUNT_ID || !/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID) || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Private image storage is not configured.");
  }
  const client = new S3Client({ region: "auto", forcePathStyle: true, endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }, maxAttempts: 1,
    requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
  try {
    const timeout = AbortSignal.timeout(20_000);
    await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: objectKey }), { abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } finally { client.destroy(); }
}
