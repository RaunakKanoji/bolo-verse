import { defineConfig, globalIgnores } from "eslint/config";
import next from "@shape/eslint-config/next";

export default defineConfig([
  ...next,
  { settings: { next: { rootDir: "apps/web/" } } },
  { files: ["apps/spatial-web/**/*.{ts,tsx}"], settings: { next: { rootDir: "apps/spatial-web/" } } },
  globalIgnores(["**/.next/**", "**/out/**", "**/next-env.d.ts", "playwright-report/**", "test-results/**", "**/public/vendor/**", ".turbo/**", ".pnpm-store/**", "**/node_modules/**"]),
]);
