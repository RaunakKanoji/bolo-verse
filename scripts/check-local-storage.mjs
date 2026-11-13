import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const root = fileURLToPath(new URL("../", import.meta.url));
const endpoint = "http://127.0.0.1:8333";
const bucket = "shape-studio-dev-assets";
const origins = ["http://127.0.0.1:3000", "http://127.0.0.1:3180"];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

export async function checkLocalStorage() {
  const { identities } = JSON.parse(await readFile(`${root}.local-storage/s3.json`, "utf8"));
  const credential = identities[0].credentials[0];
  const client = new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: credential.accessKey, secretAccessKey: credential.secretKey },
    maxAttempts: 1,
  });
  const key = `.setup-verification/${randomUUID()}.bin`;
  const bytes = randomBytes(128);
  const objectUrl = `${endpoint}/${bucket}/${key}`;
  let created = false;
  try {
    const cors = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    assert.equal(cors.CORSRules?.length, 1, "one explicit CORS rule required");
    const rule = cors.CORSRules[0];
    assert.deepEqual([...rule.AllowedOrigins].sort(), [...origins].sort());
    assert.deepEqual(rule.AllowedMethods, ["PUT"]);
    assert.deepEqual(rule.AllowedHeaders.map((header) => header.toLowerCase()).sort(), [
      "content-type",
      "if-none-match",
    ]);
    assert.deepEqual(rule.ExposeHeaders, ["ETag"]);

    const put = await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: "application/octet-stream",
        IfNoneMatch: "*",
      }),
    );
    created = true;
    assert.ok(put.ETag, "authenticated upload must return an ETag");
    const readback = async () => {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      assert.ok(result.Body);
      assert.equal(
        sha256(await result.Body.transformToByteArray()),
        sha256(bytes),
        "authenticated readback SHA-256 must match",
      );
    };
    await readback();
    await assert.rejects(
      client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: randomBytes(128),
          IfNoneMatch: "*",
        }),
      ),
      (error) => error?.$metadata?.httpStatusCode === 412,
      "duplicate conditional upload must fail with HTTP 412",
    );
    await readback();
    for (const [url, method] of [
      [objectUrl, "GET"],
      [objectUrl, "PUT"],
      [`${endpoint}/${bucket}`, "GET"],
    ]) {
      const response = await fetch(url, { method, signal: AbortSignal.timeout(5000) });
      assert.equal(response.status, 403, `anonymous ${method} must be denied`);
      await response.arrayBuffer();
    }
    for (const origin of origins) {
      const response = await fetch(objectUrl, {
        method: "OPTIONS",
        headers: {
          Origin: origin,
          "Access-Control-Request-Method": "PUT",
          "Access-Control-Request-Headers": "content-type,if-none-match",
        },
        signal: AbortSignal.timeout(5000),
      });
      assert.equal(response.status, 200, "allowed origin preflight must succeed");
      assert.equal(response.headers.get("access-control-allow-origin"), origin);
      assert.equal(response.headers.get("access-control-allow-methods"), "PUT");
      await response.arrayBuffer();
    }
    for (const headers of [
      { Origin: "https://untrusted.invalid", "Access-Control-Request-Method": "PUT" },
      { Origin: origins[0], "Access-Control-Request-Method": "DELETE" },
      {
        Origin: origins[0],
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "x-untrusted-header",
      },
    ]) {
      const response = await fetch(objectUrl, {
        method: "OPTIONS",
        headers,
        signal: AbortSignal.timeout(5000),
      });
      const grantedOrigin = response.headers.get("access-control-allow-origin");
      const grantedMethods = (response.headers.get("access-control-allow-methods") ?? "")
        .split(",")
        .map((value) => value.trim());
      const grantedHeaders = (response.headers.get("access-control-allow-headers") ?? "")
        .toLowerCase()
        .split(",")
        .map((value) => value.trim());
      const requestedHeaders = (headers["Access-Control-Request-Headers"] ?? "")
        .split(",")
        .filter(Boolean);
      const browserGranted =
        grantedOrigin === headers.Origin &&
        grantedMethods.includes(headers["Access-Control-Request-Method"]) &&
        requestedHeaders.every((header) => grantedHeaders.includes(header.toLowerCase()));
      assert.equal(
        browserGranted,
        false,
        "unapproved preflight must not grant the requested browser method and headers",
      );
      await response.arrayBuffer();
    }
    return "PASS: authenticated PUT/GET SHA-256; duplicate conditional PUT 412 and original bytes retained; anonymous GET/PUT/list 403; exact-origin CORS and rejected preflights.";
  } finally {
    try {
      if (created) await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } finally {
      client.destroy();
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkLocalStorage()
    .then((message) => console.log(message))
    .catch((error) => {
      console.error(
        `Local storage verification failed (${error?.name ?? "Error"}, HTTP ${error?.$metadata?.httpStatusCode ?? "unavailable"}). Run node scripts/setup-local-storage.mjs; credentials and request details are suppressed.`,
      );
      process.exitCode = 1;
    });
}
