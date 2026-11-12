import "server-only";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getServerEnv } from "@/server/config/env";
import { BoundaryError } from "@/server/auth/errors";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import type { StorageAdapter } from "./interfaces";

/** Read-only implementation of the existing storage boundary, for bounded previews. */
export class R2PreviewReader implements Pick<StorageAdapter, "readObject"> {
  async readObject(input: { objectKey: string; maxBytes: number; signal?: AbortSignal }): Promise<{ bytes: Uint8Array; mimeType: string }> {
    const env = getServerEnv();
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) throw new BoundaryError(503, "PROVIDER_UNCONFIGURED", "Private asset storage is not configured. Project metadata remains available.");
    if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID) || !input.objectKey || !Number.isInteger(input.maxBytes) || input.maxBytes < 1 || input.maxBytes > MAX_PREVIEW_BYTES) throw new BoundaryError(400, "INVALID_INPUT", "The asset cannot be previewed with this configuration.");
    const client = new S3Client({ region: "auto", endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY }, maxAttempts: 1 });
    const timeout = AbortSignal.timeout(20000);
    const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
    try {
      const object = await client.send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: input.objectKey }), { abortSignal: signal });
      if (!object.Body || !object.ContentLength || object.ContentLength > input.maxBytes) throw new BoundaryError(413, "INVALID_INPUT", "This asset exceeds the preview size limit.");
      const reader = object.Body.transformToWebStream().getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > input.maxBytes) throw new BoundaryError(413, "INVALID_INPUT", "This asset exceeds the preview size limit.");
          chunks.push(value);
        }
      } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
      finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return { bytes, mimeType: object.ContentType ?? "application/octet-stream" };
    } finally { client.destroy(); }
  }
}
