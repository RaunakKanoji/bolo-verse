import "server-only";
import { readDemoFixture } from "@/server/demo/fixtures";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createPrivateStorageClient } from "./private-storage";
import { BoundaryError } from "@/server/auth/errors";
import type { StorageAdapter } from "./interfaces";

/** Shared private object reader. Callers supply an explicit immutable byte ceiling. */
export class R2BoundedReader implements Pick<StorageAdapter, "readObject"> {
  constructor(private readonly byteLimit: number) {}
  async readObject(input: {
    objectKey: string;
    maxBytes: number;
    signal?: AbortSignal;
  }): Promise<{ bytes: Uint8Array; mimeType: string }> {
    if (
      !input.objectKey ||
      !Number.isInteger(input.maxBytes) ||
      input.maxBytes < 1 ||
      input.maxBytes > this.byteLimit ||
      !Number.isSafeInteger(this.byteLimit) ||
      this.byteLimit < 1 ||
      this.byteLimit > 32 * 1024 * 1024
    )
      throw new BoundaryError(
        400,
        "INVALID_INPUT",
        "The asset cannot be previewed with this configuration.",
      );
    const fixture = readDemoFixture(input.objectKey, input.maxBytes);
    if (fixture) return fixture;
    const { client, bucket } = createPrivateStorageClient();
    const timeout = AbortSignal.timeout(20000);
    const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;
    try {
      const object = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: input.objectKey }),
        { abortSignal: signal },
      );
      if (!object.Body || !object.ContentLength || object.ContentLength > input.maxBytes)
        throw new BoundaryError(413, "INVALID_INPUT", "This asset exceeds the preview size limit.");
      const reader = object.Body.transformToWebStream().getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > input.maxBytes)
            throw new BoundaryError(
              413,
              "INVALID_INPUT",
              "This asset exceeds the preview size limit.",
            );
          chunks.push(value);
        }
      } catch (error) {
        await reader.cancel().catch(() => undefined);
        throw error;
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { bytes, mimeType: object.ContentType ?? "application/octet-stream" };
    } finally {
      client.destroy();
    }
  }
}
