import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getServerEnv, type ServerEnv } from "@/server/config/env";
import { BoundaryError } from "@/server/auth/errors";

export function privateStorageRequirements(env: ServerEnv) {
  return env.STORAGE_PROVIDER === "local-s3"
    ? {
        label: "Private local S3 (SeaweedFS)",
        keys: [
          "S3_ENDPOINT",
          "S3_ACCESS_KEY_ID",
          "S3_SECRET_ACCESS_KEY",
          "S3_BUCKET",
        ] as (keyof ServerEnv)[],
      }
    : {
        label: "Private Cloudflare R2",
        keys: [
          "R2_ACCOUNT_ID",
          "R2_ACCESS_KEY_ID",
          "R2_SECRET_ACCESS_KEY",
          "R2_BUCKET",
        ] as (keyof ServerEnv)[],
      };
}

/** Trusted server configuration only. No caller-supplied URL or fallback provider. */
export function getPrivateStorageConfiguration(env: ServerEnv = getServerEnv()) {
  const unavailable = () =>
    new BoundaryError(
      503,
      "PROVIDER_UNCONFIGURED",
      "Private object storage is not configured correctly.",
    );
  if (env.STORAGE_PROVIDER === "local-s3") {
    if (!["localhost", "127.0.0.1"].includes(new URL(env.NEXT_PUBLIC_APP_URL).hostname))
      throw unavailable();
    if (
      env.VERCEL ||
      env.VERCEL_ENV ||
      env.VERCEL_TARGET_ENV ||
      !env.S3_ACCESS_KEY_ID ||
      !env.S3_SECRET_ACCESS_KEY ||
      !env.S3_BUCKET ||
      !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(env.S3_BUCKET)
    )
      throw unavailable();
    // This option is deliberately the dedicated local Docker gateway, not an arbitrary S3 URL.
    if (env.S3_ENDPOINT !== "http://127.0.0.1:8333") throw unavailable();
    return {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION ?? "us-east-1",
      bucket: env.S3_BUCKET,
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    };
  }
  if (
    !env.R2_ACCOUNT_ID ||
    !/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID) ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET
  )
    throw unavailable();
  return {
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: "auto",
    bucket: env.R2_BUCKET,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  };
}
export function isPrivateStorageConfigured(env: ServerEnv): boolean {
  try {
    getPrivateStorageConfiguration(env);
    return true;
  } catch {
    return false;
  }
}
export function createPrivateStorageClient() {
  const { bucket, ...configuration } = getPrivateStorageConfiguration();
  const client = new S3Client({
    ...configuration,
    forcePathStyle: true,
    maxAttempts: 1,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return { client, bucket };
}
