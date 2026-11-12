import { defineConfig, globalIgnores } from "eslint/config";
import next from "@shape/eslint-config/next";

export default defineConfig([
  ...next,
  globalIgnores([".next/**", "out/**", "next-env.d.ts", "playwright-report/**", "test-results/**", "public/vendor/**", ".turbo/**", "**/node_modules/**"]),
]);
