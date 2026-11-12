/** Bound bytes while streaming, before any decoder receives private media. */
export async function readPreviewBytes(
  response: Response,
  mimeType: string,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  if (!response.ok || response.redirected) throw new Error("Preview unavailable.");
  if (response.headers.get("content-type")?.split(";")[0].trim() !== mimeType)
    throw new Error("Unexpected preview type.");
  const declared = response.headers.get("content-length");
  if (declared && (!Number.isFinite(Number(declared)) || Number(declared) > limit))
    throw new Error("Preview limit exceeded.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Preview unavailable.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) {
        await reader.cancel();
        throw new Error("Preview limit exceeded.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) throw new Error("Preview is empty.");
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
