import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const serverPort = new URL(baseURL).port || "3000";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR ?? "test-results",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], permissions: ["microphone"], launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } } }],
  webServer: { command: `pnpm dev --hostname 127.0.0.1 --port ${serverPort}`, url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120000 },
});
