import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker/Coolify (`.next/standalone`).
  output: "standalone",
  // No production browser source maps: browsers never fetch .map files outside
  // DevTools so users gained nothing, the Lighthouse audit it targeted still
  // scored 0 (the vendor chunk carries no sourceMappingURL), and it published
  // the entire first-party source. Cost with no benefit — removed.
  // Pin the file-tracing + workspace root — a stray pnpm-lock.yaml in the home
  // dir otherwise makes Next/Turbopack infer the wrong root, which would also
  // nest the standalone output under an unexpected subdirectory.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  // No framework fingerprint in responses.
  poweredByHeader: false,
  // Baseline security headers, absent until 2026-08-27 (the origin shipped
  // none at all). Deliberately NOT a full Content-Security-Policy: the inline
  // parse-time overture script, inline JSON-LD and the GA tag would each need
  // nonces/hashes, and a broken CSP fails silently for exactly the visitors
  // who never report it. frame-ancestors alone carries CSP's clickjacking
  // protection without touching script execution.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // www and every future subdomain 308 to the apex over TLS already;
          // includeSubDomains is safe and preload-eligible.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
