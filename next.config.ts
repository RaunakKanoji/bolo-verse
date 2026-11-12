import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@shape/scene-schema"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), xr-spatial-tracking=(self)" },
      { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'" },
    ] }];
  },
};
export default config;
