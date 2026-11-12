import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

loadEnvConfig(process.cwd());
const migrationUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;

export default defineConfig({
  schema: ["./apps/web/src/server/db/schema.ts", "./apps/web/src/server/db/creation-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  ...(migrationUrl ? { dbCredentials: { url: migrationUrl } } : {}),
  strict: true,
  verbose: true,
});
