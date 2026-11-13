import "server-only";
import { privateStorageRequirements, isPrivateStorageConfigured } from "./private-storage";
import type { ProviderId, ProviderReadiness } from "@/lib/contracts";
import { getServerEnv, type ServerEnv } from "@/server/config/env";
import { ProviderNotImplementedError, ProviderUnconfiguredError } from "./errors";
import type { ProviderRegistry } from "./interfaces";
import { createShotstackEditor } from "./shotstack";
export * from "./interfaces";
export * from "./errors";

type Requirement = { id: ProviderId; label: string; keys: (keyof ServerEnv)[] };
const requirements: Requirement[] = [
  {
    id: "clerk",
    label: "Clerk identity",
    keys: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"],
  },
  { id: "database", label: "Neon PostgreSQL", keys: ["DATABASE_URL"] },
  {
    id: "sarvam-stt",
    label: "Sarvam speech recognition",
    keys: ["SARVAM_API_KEY", "SARVAM_STT_MODEL"],
  },
  {
    id: "sarvam-tts",
    label: "Sarvam speech synthesis",
    keys: [
      "SARVAM_API_KEY",
      "SARVAM_TTS_MODEL",
      "SARVAM_TTS_SPEAKER_EN",
      "SARVAM_TTS_SPEAKER_HI",
      "SARVAM_TTS_SPEAKER_KN",
    ],
  },
  { id: "gemini", label: "Gemini reasoning", keys: ["GEMINI_API_KEY", "GEMINI_MODEL"] },
  {
    id: "r2",
    label: "Private Cloudflare R2",
    keys: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  },
  { id: "shotstack", label: "Shotstack editor", keys: ["SHOTSTACK_API_KEY", "SHOTSTACK_ENV"] },
];

// Configuration inspection is not a network probe or evidence of live readiness.
// This safe projection contains variable names only, never their values.
export function getProviderReadiness(env: ServerEnv = getServerEnv()): ProviderReadiness[] {
  return requirements.map(({ id, label, keys }) => {
    if (id === "r2") ({ label, keys } = privateStorageRequirements(env));
    const missing = keys.filter((key) => !env[key]);
    return {
      id,
      label,
      missing,
      enabled: id !== "shotstack" || env.ENABLE_EXTERNAL_EDITOR,
      status:
        missing.length || (id === "r2" && !isPrivateStorageConfigured(env))
          ? "unconfigured"
          : "configured-unverified",
    };
  });
}

// Legacy providers retain explicit unavailable boundaries. The Shotstack editor
// implements its supported operations; render submission requires a service-authorized source resolver.
export function createProviderRegistry(env: ServerEnv = getServerEnv()): ProviderRegistry {
  const statuses = getProviderReadiness(env);
  const unavailable = async (id: ProviderId): Promise<never> => {
    const status = statuses.find((provider) => provider.id === id)!;
    if (status.missing.length) throw new ProviderUnconfiguredError(id, status.missing);
    throw new ProviderNotImplementedError(id);
  };
  return {
    stt: { transcribe: () => unavailable("sarvam-stt") },
    tts: { synthesize: () => unavailable("sarvam-tts") },
    reasoning: {
      interpret: () => unavailable("gemini"),
      generateDirections: () => unavailable("gemini"),
    },
    storage: {
      createUploadUrl: () => unavailable("r2"),
      createReadUrl: () => unavailable("r2"),
      copyObject: () => unavailable("r2"),
      readObject: () => unavailable("r2"),
      deleteObject: () => unavailable("r2"),
    },
    editor: createShotstackEditor({ env }),
  };
}
