import { defineConfig, globalIgnores } from "eslint/config";
import next from "@shape/eslint-config/next";

export default defineConfig([...next, globalIgnores([".next/**", "next-env.d.ts", "**/node_modules/**"])]);
