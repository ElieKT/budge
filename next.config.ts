import type { NextConfig } from "next";

// Security headers applied to every response. CSP is intentionally not
// "report-only" — tighten `connect-src`/`img-src` further if you add
// external services (e.g. a bank-data provider, analytics).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Default is 1MB, which silently rejects most real photo uploads
      // before our own avatar-size validation ever runs. The client
      // resizes images before upload (src/lib/image.ts), so this is
      // headroom for that resized output, not an invitation to skip it.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
