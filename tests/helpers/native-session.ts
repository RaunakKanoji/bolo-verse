import { generateKeyPairSync, randomUUID, sign, type KeyObject } from "node:crypto";

const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const keyId = randomUUID();
export const nativeTestIssuer = "https://shape-native.clerk.accounts.dev";
export const nativeTestPublishableKey = `pk_test_${Buffer.from("shape-native.clerk.accounts.dev$").toString("base64")}`;
export const nativeTestPublicKey = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
export function sessionJWT(subject: string, claims: Record<string, unknown> = {}, privateKey: KeyObject = pair.privateKey, header: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const input = [
    { alg: "RS256", typ: "JWT", kid: keyId, ...header },
    { iss: nativeTestIssuer, sub: subject, sid: "sess_native_test", iat: now, nbf: now - 1, exp: now + 120, v: 2, ...claims },
  ].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
}
