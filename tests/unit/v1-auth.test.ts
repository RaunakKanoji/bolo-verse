import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nativeTestIssuer, nativeTestPublicKey, nativeTestPublishableKey, sessionJWT } from "../helpers/native-session";
vi.mock("server-only", () => ({}));
const cookie = vi.hoisted(() => ({ subject: "cookie_owner" as string | null }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: cookie.subject }) }));
import { getV1Subject } from "@/server/auth/api-identity";

const origin = "http://localhost:3000";
function request(authorization?: string, originHeader?: string) {
  const headers = new Headers({ Cookie: "__session=ambient-cookie" });
  if (authorization !== undefined) headers.set("Authorization", authorization);
  if (originHeader !== undefined) headers.set("Origin", originHeader);
  return new Request(`${origin}/api/v1/projects`, { headers });
}
beforeEach(() => {
  cookie.subject = "cookie_owner";
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_configured");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", nativeTestPublishableKey);
  vi.stubEnv("CLERK_JWT_KEY", nativeTestPublicKey);
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", origin);
  vi.stubEnv("ALLOWED_ORIGINS", origin);
});
afterEach(() => vi.unstubAllEnvs());
describe("v1 verified session transport", () => {
  it("verifies a native session signature before allowing an originless mutation", async () => {
    expect(await getV1Subject(request(`Bearer ${sessionJWT("native_owner")}`), { mutation: true })).toBe("native_owner");
  });
  it("keeps trusted-Origin cookie writes and rejects missing or foreign origins", async () => {
    expect(await getV1Subject(request(undefined, origin), { mutation: true })).toBe("cookie_owner");
    for (const untrusted of [undefined, "null", "https://evil.test", `${origin}.evil.test`]) {
      await expect(getV1Subject(request(undefined, untrusted), { mutation: true })).rejects.toMatchObject({ status: 403 });
    }
  });
  it("rejects a foreign Origin even with a correctly signed native token", async () => {
    await expect(getV1Subject(request(`Bearer ${sessionJWT("native_owner")}`, "https://evil.test"), { mutation: true })).rejects.toMatchObject({ status: 403 });
  });
  it.each(["", "Basic secret", "Bearer", "Bearer not.a.jwt", "Bearer one two", "Bearer one, Bearer two"])("never falls back to cookies for malformed authorization: %s", async (header) => {
    await expect(getV1Subject(request(header, origin), { mutation: true })).rejects.toMatchObject({ status: 401 });
  });
  it("rejects tampering, wrong signing key, expiry, future activation, wrong issuer and machine categories", async () => {
    const now = Math.floor(Date.now() / 1000);
    const wrongKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    const valid = sessionJWT("native_owner");
    const tokens = [
      valid.replace(/\.[^.]+$/, ".AAAA"), sessionJWT("native_owner", {}, wrongKey),
      sessionJWT("native_owner", { exp: now - 60 }), sessionJWT("native_owner", { nbf: now + 60 }),
      sessionJWT("native_owner", { iss: "https://other.clerk.accounts.dev" }),
      sessionJWT("native_owner", { sid: null }), sessionJWT("native_owner", { azp: "https://evil.test" }),
      sessionJWT("native_owner", {}, undefined, { cat: "m2m_token" }),
    ];
    for (const token of tokens) await expect(getV1Subject(request(`Bearer ${token}`, origin), { mutation: true })).rejects.toMatchObject({ status: 401 });
  });
  it("accepts an allowed browser authorized party while preserving the same identity", async () => {
    expect(await getV1Subject(request(`Bearer ${sessionJWT("native_owner", { azp: origin, iss: nativeTestIssuer })}`, origin))).toBe("native_owner");
  });
  it("fails closed when account/database configuration is absent", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(getV1Subject(request(`Bearer ${sessionJWT("native_owner")}`))).rejects.toMatchObject({ status: 503 });
  });
});
