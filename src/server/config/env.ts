import "server-only";
import { z } from "zod";

const blankToUndefined = (value: unknown) => typeof value === "string" && value.trim() === "" ? undefined : value;
const optionalText = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());
const flag = z.preprocess(blankToUndefined, z.enum(["true", "false"]).default("false")).transform((value) => value === "true");
const origin = z.url({ protocol: /^https?$/ }).refine((value) => {
  const parsed = new URL(value);
  return parsed.pathname === "/" && !parsed.search && !parsed.hash && !parsed.username && !parsed.password;
}, { message: "Use an exact HTTP(S) origin without a path, credentials, query or fragment" }).transform((value) => new URL(value).origin);
const databaseUrl = z.preprocess(blankToUndefined, z.url({ protocol: /^postgres(ql)?$/ }).optional());

// Environment variables are not an API payload: unrelated process keys are
// intentionally stripped. Secrets are never exported through a public projection.
const ServerEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(blankToUndefined, origin.default("http://localhost:3000")),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalText,
  CLERK_SECRET_KEY: optionalText, CLERK_WEBHOOK_SIGNING_SECRET: optionalText,
  DATABASE_URL: databaseUrl, DATABASE_MIGRATION_URL: databaseUrl,
  R2_ACCOUNT_ID: optionalText, R2_ACCESS_KEY_ID: optionalText,
  R2_SECRET_ACCESS_KEY: optionalText, R2_BUCKET: optionalText,
  SARVAM_API_KEY: optionalText, SARVAM_STT_MODEL: optionalText, SARVAM_TTS_MODEL: optionalText,
  SARVAM_TTS_SPEAKER_EN: optionalText, SARVAM_TTS_SPEAKER_HI: optionalText, SARVAM_TTS_SPEAKER_KN: optionalText,
  GEMINI_API_KEY: optionalText, GEMINI_MODEL: optionalText,
  SHOTSTACK_API_KEY: optionalText,
  SHOTSTACK_ENV: z.preprocess(blankToUndefined, z.enum(["sandbox", "production"]).optional()),
  APP_MODE: z.preprocess(blankToUndefined, z.enum(["live", "demo"]).default("live")),
  ENABLE_EXTERNAL_EDITOR: flag, ENABLE_BACKGROUND_REMOVAL: flag, ENABLE_WEBXR: flag,
  ALLOWED_ORIGINS: z.preprocess(blankToUndefined, z.string().transform((value) => value.split(",").map((entry) => entry.trim())).pipe(z.array(origin).min(1)).optional()),
  COMMAND_LOG_RETENTION_DAYS: z.preprocess(blankToUndefined, z.coerce.number().int().min(0).max(365).default(7)),
  VERCEL: optionalText, VERCEL_ENV: optionalText, VERCEL_TARGET_ENV: optionalText,
}).superRefine((env, context) => {
  if (env.APP_MODE === "demo" && (env.VERCEL === "1" || env.VERCEL_ENV || env.VERCEL_TARGET_ENV)) {
    context.addIssue({ code: "custom", path: ["APP_MODE"], message: "Demo mode is local-only and cannot run on Vercel" });
  }
}).transform((env) => ({
  ...env,
  DATABASE_MIGRATION_URL: env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL,
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS ?? [env.NEXT_PUBLIC_APP_URL],
}));

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return ServerEnvSchema.parse(source);
}

// Lazy by design: importing a server module must not require unused credentials.
export function getServerEnv(): ServerEnv {
  return parseServerEnv(process.env);
}
