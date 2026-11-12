import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

const config: NextConfig = {
  assetPrefix: "/spatial-static",
  transpilePackages: ["@shape/scene-schema"],
  turbopack: { root },
  outputFileTracingRoot: root,
  async headers() {
    return [{ source: "/workspace/:path*", headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] }];
  },
};
export default config;
