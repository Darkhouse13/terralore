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
};

export default nextConfig;
