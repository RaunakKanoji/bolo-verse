import { z } from "zod";
import { DEMO_REFERENCE_DATE, DEMO_SLUG } from "@/lib/demo/catalog";

/** Deliberately offline-only until the presenter provisions a real development identity. */
export function parseDemoConfig(env: Record<string, string | undefined>) {
  if (env.DEMO_SEED_ENABLED !== "true")
    throw new Error("Demo seed refused: set DEMO_SEED_ENABLED=true.");
  if (
    env.NODE_ENV === "production" ||
    [env.VERCEL_ENV, env.VERCEL_TARGET_ENV].some((v) => v === "production")
  )
    throw new Error("Demo seed refused: production execution is prohibited.");
  if (env.DEMO_SEED_TARGET !== "local" && (env.DATABASE_URL || env.DATABASE_MIGRATION_URL))
    throw new Error(
      "Demo seed refused: remote targets are disabled; pass --local for the isolated development database.",
    );
  const slug = z
    .string()
    .regex(/^[a-z][a-z0-9-]{2,48}$/)
    .parse(env.DEMO_WORKSPACE_SLUG ?? DEMO_SLUG);
  const referenceDate = z.iso.date().parse(env.DEMO_REFERENCE_DATE ?? DEMO_REFERENCE_DATE);
  if (new Date(`${referenceDate}T00:00:00Z`).toISOString().slice(0, 10) !== referenceDate)
    throw new Error("Invalid reference date.");
  return { slug, referenceDate, owner: `demo:${slug}:presenter`, marker: `shape-demo:v1:${slug}` };
}
export type DemoConfig = ReturnType<typeof parseDemoConfig>;
