import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { checkLocalStorage } from "./check-local-storage.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const stateDirectory = `${root}.local-storage`;
const configPath = `${stateDirectory}/s3.json`;
const endpoint = "http://127.0.0.1:8333";
const bucket = "shape-studio-dev-assets";
let stage = "initialization";

function docker(args) {
  const result = spawnSync("docker", args, { cwd: root, encoding: "utf8", timeout: 240_000 });
  if (result.status !== 0) throw new Error("DockerCommandFailed");
}

async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

async function writePrivate(path, content) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, content, { mode: 0o600, flag: "wx" });
  await rename(temporary, path);
  await chmod(path, 0o600);
}

async function setup() {
  stage = "Docker availability (start Docker Desktop and check daemon access)";
  docker(["version", "--format", "{{.Server.Version}}"]);
  stage = "private local credentials";
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  await chmod(stateDirectory, 0o700);
  let source = await readOptional(configPath);
  if (source === undefined) {
    source =
      JSON.stringify(
        {
          identities: [
            {
              name: "shape-studio-local",
              credentials: [
                {
                  accessKey: randomBytes(20).toString("hex"),
                  secretKey: randomBytes(32).toString("hex"),
                },
              ],
              actions: ["Admin", "Read", "Write", "List", "Tagging"],
            },
          ],
        },
        null,
        2,
      ) + "\n";
    await writePrivate(configPath, source);
  }
  const config = JSON.parse(source);
  const identity = config.identities?.[0];
  const credential = identity?.credentials?.[0];
  if (
    config.identities?.length !== 1 ||
    identity?.name !== "shape-studio-local" ||
    !/^[a-f0-9]{40}$/.test(credential?.accessKey ?? "") ||
    !/^[a-f0-9]{64}$/.test(credential?.secretKey ?? "")
  )
    throw new Error("UnexpectedLocalCredentials");
  await chmod(configPath, 0o600);

  stage = "isolated Docker Compose startup (port 127.0.0.1:8333 must be available)";
  docker(["compose", "-f", "infra/local-storage/compose.yaml", "config", "--quiet"]);
  docker(["compose", "-f", "infra/local-storage/compose.yaml", "up", "-d", "storage"]);

  const client = new S3Client({
    endpoint,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId: credential.accessKey, secretAccessKey: credential.secretKey },
    maxAttempts: 1,
  });
  try {
    stage = "authenticated S3 readiness";
    let ready = false;
    for (let attempt = 0; attempt < 90; attempt++) {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }), {
          abortSignal: AbortSignal.timeout(2000),
        });
        ready = true;
        break;
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 404) {
          ready = true;
          break;
        }
        if (error?.$metadata?.httpStatusCode === 403) throw new Error("S3CredentialsRejected");
        await setTimeout(500);
      }
    }
    if (!ready) throw new Error("S3ReadinessTimeout");
    stage = "private bucket and exact-origin CORS";
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (error?.$metadata?.httpStatusCode !== 404) throw error;
      await client.send(new CreateBucketCommand({ Bucket: bucket, ACL: "private" }));
    }
    const cors = JSON.parse(await readFile(`${root}infra/local-storage/cors.json`, "utf8"));
    await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: cors }));
    stage = "live S3 privacy, integrity and CORS verification";
    console.log(await checkLocalStorage());
  } finally {
    client.destroy();
  }

  stage = "server-only root environment update";
  const envPath = `${root}.env.local`;
  const env = (await readOptional(envPath)) ?? "";
  const settings = {
    STORAGE_PROVIDER: "local-s3",
    S3_ENDPOINT: endpoint,
    S3_REGION: "us-east-1",
    S3_BUCKET: bucket,
    S3_ACCESS_KEY_ID: credential.accessKey,
    S3_SECRET_ACCESS_KEY: credential.secretKey,
  };
  const pending = new Set(Object.keys(settings));
  const lines = env.split(/\r?\n/).map((line) => {
    const key = line.match(/^(?:export\s+)?(STORAGE_PROVIDER|S3_[A-Z0-9_]+)\s*=/)?.[1];
    if (!key || !Object.hasOwn(settings, key)) return line;
    pending.delete(key);
    return `${key}=${settings[key]}`;
  });
  while (lines.at(-1) === "") lines.pop();
  for (const key of pending) lines.push(`${key}=${settings[key]}`);
  await writePrivate(envPath, lines.join("\n") + "\n");
  console.log(
    "Local S3 ready at http://127.0.0.1:8333; private persistent bucket shape-studio-dev-assets. Server-only local credentials reused/generated without disclosure. Restart the web server to load .env.local.",
  );
}

setup().catch(() => {
  console.error(
    `Local storage setup failed during ${stage}. No volume was reset or deleted. Credentials, provider errors and request details are suppressed.`,
  );
  process.exitCode = 1;
});
