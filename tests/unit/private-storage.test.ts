import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseServerEnv } from "../../apps/web/src/server/config/env";
import {
  getPrivateStorageConfiguration,
  isPrivateStorageConfigured,
} from "../../apps/web/src/server/providers/private-storage";
import { getProviderReadiness } from "../../apps/web/src/server/providers";
const local = {
  STORAGE_PROVIDER: "local-s3",
  S3_ENDPOINT: "http://127.0.0.1:8333",
  S3_REGION: "us-east-1",
  S3_BUCKET: "shape-studio-dev-assets",
  S3_ACCESS_KEY_ID: "fixture-access",
  S3_SECRET_ACCESS_KEY: "fixture-secret",
};
afterEach(() => vi.unstubAllEnvs());
describe("private storage selection", () => {
  it("uses explicitly selected local S3 without any R2 credentials", () => {
    const env = parseServerEnv(local);
    expect(getPrivateStorageConfiguration(env)).toMatchObject({
      endpoint: local.S3_ENDPOINT,
      bucket: local.S3_BUCKET,
      region: "us-east-1",
      credentials: { accessKeyId: "fixture-access", secretAccessKey: "fixture-secret" },
    });
    expect(isPrivateStorageConfigured(env)).toBe(true);
    const status = getProviderReadiness(env).find((p) => p.id === "r2")!;
    expect(status.label).toContain("local");
    expect(status.status).toBe("configured-unverified");
    expect(JSON.stringify(status)).not.toContain("fixture-secret");
  });
  it("keeps R2 as the default and does not silently fall back to another provider", () => {
    expect(
      isPrivateStorageConfigured(parseServerEnv({ ...local, STORAGE_PROVIDER: undefined })),
    ).toBe(false);
    const env = parseServerEnv({
      R2_ACCOUNT_ID: "a".repeat(32),
      R2_BUCKET: "private-assets",
      R2_ACCESS_KEY_ID: "id",
      R2_SECRET_ACCESS_KEY: "secret",
    });
    expect(getPrivateStorageConfiguration(env).endpoint).toBe(
      `https://${"a".repeat(32)}.r2.cloudflarestorage.com`,
    );
  });
  it("rejects remote, credential-bearing and noncanonical local endpoints", () => {
    for (const endpoint of [
      "https://remote.example",
      "http://169.254.169.254",
      "http://user:secret@127.0.0.1:8333",
      "http://127.0.0.1:8333/private",
      "http://127.0.0.1:8333?x=y",
    ]) {
      expect(() =>
        getPrivateStorageConfiguration(parseServerEnv({ ...local, S3_ENDPOINT: endpoint })),
      ).toThrow();
    }
  });
  it("rejects missing credentials and hosted deployment use", () => {
    expect(isPrivateStorageConfigured(parseServerEnv({ ...local, S3_SECRET_ACCESS_KEY: "" }))).toBe(
      false,
    );
    for (const key of ["VERCEL", "VERCEL_ENV", "VERCEL_TARGET_ENV"]) {
      expect(() =>
        getPrivateStorageConfiguration(parseServerEnv({ ...local, [key]: "1" })),
      ).toThrow();
    }
  });
});
it("rejects the local provider for a public deployment origin without Vercel markers", () => {
  expect(() =>
    getPrivateStorageConfiguration(
      parseServerEnv({ ...local, NEXT_PUBLIC_APP_URL: "https://studio.example" }),
    ),
  ).toThrow();
});
