import { z } from "zod";
import { ResourceIdSchema } from "./api";

export const AssetSummarySchema = z.strictObject({
  id: ResourceIdSchema,
  projectId: ResourceIdSchema,
  mimeType: z.string().min(1).max(160),
  byteSize: z.int().min(0).max(Number.MAX_SAFE_INTEGER),
  width: z.int().positive().nullable(),
  height: z.int().positive().nullable(),
  durationSeconds: z.number().nonnegative().nullable(),
  createdAt: z.iso.datetime(),
  nativeContentUrl: z.string().regex(/^\/api\/v1\/assets\/[0-9a-f-]{36}\/native-content$/).nullable()
    .describe("Authenticated native USDZ download for model/vnd.usdz+zip assets up to 32 MiB; otherwise null. The server validates archive and texture bounds before delivery; no conversion or upload is provided."),
  contentUrl: z.string().regex(/^\/api\/v1\/assets\/[0-9a-f-]{36}\/content$/).nullable()
    .describe("Authenticated browser preview URL for supported MIME types up to 20 MiB; otherwise null. Not a general asset download."),
});
export type AssetSummary = z.infer<typeof AssetSummarySchema>;
