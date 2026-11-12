import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { availableParallelism } from "node:os";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)), "@spatial": fileURLToPath(new URL("./apps/spatial-web/src", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts", "apps/spatial-web/tests/**/*.test.ts"], environment: "node", testTimeout: 15000,
    // Each SQL suite owns a PostgreSQL WASM instance; bound peak parallel startup.
    maxWorkers: Math.min(4, availableParallelism()),
  },
});
