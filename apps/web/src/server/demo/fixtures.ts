import "server-only";
import manifest from "@/lib/demo/asset-manifest.json";
import { BoundaryError } from "@/server/auth/errors";
export type DemoFixture = (typeof manifest)[keyof typeof manifest];
export function findDemoFixture(objectKey: string): DemoFixture | null {
  objectKey = objectKey.replace(/#[0-9a-f-]{36}$/, "");
  if (!Object.hasOwn(manifest, objectKey)) return null;
  return manifest[objectKey as keyof typeof manifest];
}
/** Reserved immutable public synthetic bytes only. No filesystem paths or storage fallback. */
export function readDemoFixture(objectKey: string, maxBytes: number) {
  if (!objectKey.startsWith("demo-fixtures/")) return null;
  const fixture = findDemoFixture(objectKey);
  if (!fixture) throw new BoundaryError(404, "INVALID_INPUT", "The demo fixture is unavailable.");
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || fixture.byteSize > maxBytes)
    throw new BoundaryError(
      413,
      "INVALID_INPUT",
      "The demo fixture exceeds the preview size limit.",
    );
  return {
    bytes: new Uint8Array(Buffer.from(fixture.base64, "base64")),
    mimeType: fixture.mimeType,
  };
}
