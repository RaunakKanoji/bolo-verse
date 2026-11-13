/** Local-only acceptance: real application signer/writer/bounded reader; no auth bypass or DB rows. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { getPrivateStorageConfiguration } from "../apps/web/src/server/providers/private-storage";
import {
  signImageUpload,
  readStagedImage,
  writePrivateImage,
} from "../apps/web/src/server/providers/r2-ingestion";
import { deleteAbandonedImageObject } from "../apps/web/src/server/providers/r2-image-cleanup";
import { validateIngestedImage } from "../apps/web/src/server/services/image-ingestion";

let stage = "configuration";
try {
  nextEnv.loadEnvConfig(process.cwd());
  assert.equal(process.env.STORAGE_PROVIDER, "local-s3");
  const configuration = getPrivateStorageConfiguration();
  assert.equal(configuration.endpoint, "http://127.0.0.1:8333");
  const bytes = new Uint8Array(await readFile("apps/web/public/studio/campaign-studies.png"));
  const checksumSha256 = createHash("sha256").update(bytes).digest("hex");
  stage = "codec validation";
  await validateIngestedImage({ bytes, mimeType: "image/png", checksumSha256 });
  const project = randomUUID();
  const staging = `staging/images/${project}/${randomUUID()}`;
  const final = `private/images/${project}/${randomUUID()}`;
  const owned: string[] = [];
  try {
    stage = "upload signing";
    const signed = await signImageUpload({
      objectKey: staging,
      mimeType: "image/png",
      byteSize: bytes.length,
      checksumSha256,
      expiresInSeconds: 60,
    });
    assert.equal(new URL(signed.uploadUrl).origin, configuration.endpoint);
    stage = "signed PUT";
    const upload = await fetch(signed.uploadUrl, {
      method: "PUT",
      headers: signed.headers,
      body: bytes,
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    stage = `signed PUT status ${upload.status}`;
    assert(upload.ok);
    owned.push(staging);
    stage = "staging readback";
    const staged = await readStagedImage({ objectKey: staging, maxBytes: bytes.length });
    assert.equal(createHash("sha256").update(staged.bytes).digest("hex"), checksumSha256);
    stage = "final image write";
    await writePrivateImage({ objectKey: final, bytes, mimeType: "image/png", checksumSha256 });
    owned.push(final);
    stage = "immutable duplicate conflict";
    await assert.rejects(
      () => writePrivateImage({ objectKey: final, bytes, mimeType: "image/png", checksumSha256 }),
      (error: unknown) => error instanceof Error && "status" in error && error.status === 409,
    );
    stage = "final image readback";
    const published = await readStagedImage({ objectKey: final, maxBytes: bytes.length });
    assert.equal(createHash("sha256").update(published.bytes).digest("hex"), checksumSha256);
    stage = "anonymous denial";
    const anonymous = await fetch(`${configuration.endpoint}/${configuration.bucket}/${final}`, {
      signal: AbortSignal.timeout(20000),
    });
    assert([401, 403].includes(anonymous.status));
    await anonymous.body?.cancel();
    console.log(
      "PASS: real application signed image PUT, codec validation, SHA256 readback, immutable final write, duplicate conflict and private anonymous denial.",
    );
  } finally {
    for (const key of owned) await deleteAbandonedImageObject(key);
    console.log(
      "Removed only this local smoke's temporary objects. No project/database records created.",
    );
  }
} catch {
  console.error(`Local application storage check failed at ${stage}.`);
  console.error(
    "Local application storage check failed. Inspect local storage setup/configuration; no credentials or signed URLs are logged.",
  );
  process.exitCode = 1;
}
