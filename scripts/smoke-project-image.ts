/** Explicit opt-in: creates one private ready image in the selected disposable project.
 * No generated image/provider call, scene mutation, cleanup or secret-bearing output.
 * PROJECT_IMAGE_SMOKE_TOKEN is a genuine Clerk session JWT, never a CLI argument.
 */
import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { z } from "zod";
import { apiResultSchema } from "../apps/web/src/lib/contracts/api";
import { AssetListSchema } from "../apps/web/src/lib/contracts/shape";
import { CreateImageUploadSchema, ImageUploadResultSchema, FinalizedImageUploadResultSchema, imageCreationMaxBytes } from "../apps/web/src/lib/contracts/creation";

try {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--live") {
    throw new Error("Usage: node --import tsx scripts/smoke-project-image.ts --live <image-file> (creates one private asset in an explicitly disposable project)");
  }
  nextEnv.loadEnvConfig(process.cwd());
  const token = process.env.PROJECT_IMAGE_SMOKE_TOKEN;
  const projectId = z.uuid().parse(process.env.PROJECT_IMAGE_SMOKE_PROJECT_ID);
  const origin = new URL(process.env.PROJECT_IMAGE_SMOKE_ORIGIN ?? "http://127.0.0.1:3000");
  if (!token || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash ||
    !(origin.protocol === "https:" || origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname))) throw new Error();
  const file = args[1];
  const fileStat = await stat(file);
  if (!fileStat.isFile() || fileStat.size < 1 || fileStat.size > imageCreationMaxBytes) throw new Error();
  const mimeType = ({ ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" } as Record<string, string>)[extname(file).toLowerCase()];
  const bytes = await readFile(file);
  const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
  async function api<T>(path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
    const response = await fetch(new URL(path, origin), { method: body === undefined ? "GET" : "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = apiResultSchema(schema).parse(await response.json());
    if (!response.ok || !result.ok) throw new Error();
    return result.data;
  }
  const input = CreateImageUploadSchema.parse({ projectId, idempotencyKey: randomUUID(), fileName: basename(file), mimeType, byteSize: bytes.length, checksumSha256 });
  const { upload } = await api("/api/v1/assets/upload-session", ImageUploadResultSchema, input);
  if (upload.projectId !== projectId || upload.uploadContentType !== mimeType) throw new Error();
  const destination = new URL(upload.uploadUrl);
  if (!/^[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/i.test(destination.hostname)) throw new Error();
  const put = await fetch(destination, { method: "PUT", body: bytes, credentials: "omit", redirect: "error", signal: AbortSignal.timeout(60_000), headers: { "Content-Type": mimeType, "If-None-Match": "*" } });
  if (!put.ok && ![409, 412].includes(put.status)) throw new Error();
  const finalized = await api(`/api/v1/assets/upload-session/${upload.id}/finalize`, FinalizedImageUploadResultSchema, {});
  const duplicate = await api(`/api/v1/assets/upload-session/${upload.id}/finalize`, FinalizedImageUploadResultSchema, {});
  if (finalized.asset.id !== upload.assetId || duplicate.asset.id !== upload.assetId || finalized.asset.projectId !== projectId || finalized.asset.contentUrl !== `/api/v1/assets/${upload.assetId}/content`) throw new Error();
  const catalog = await api(`/api/v1/projects/${projectId}/assets`, AssetListSchema);
  if (!catalog.assets.some((asset) => asset.id === upload.assetId && asset.projectId === projectId)) throw new Error();
  const content = await fetch(new URL(finalized.asset.contentUrl, origin), { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!content.ok || !content.headers.get("cache-control")?.includes("no-store")) throw new Error();
  const reader = content.body?.getReader();
  if (!reader) throw new Error();
  const hash = createHash("sha256");
  let count = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > bytes.length) throw new Error();
      hash.update(value);
    }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { reader.releaseLock(); }
  if (count !== bytes.length || hash.digest("hex") !== checksumSha256) throw new Error();
  console.log("PASS: private upload, duplicate finalize, catalog reload and authenticated byte-for-byte preview. One private asset remains in the disposable project.");
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith("Usage:") ? error.message : "Image smoke did not complete. Check configuration, project permission, private bucket/CORS and the project catalog before retrying. No URLs or credentials are logged.");
  process.exitCode = 1;
}
