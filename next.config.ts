import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker/Coolify (`.next/standalone`).
  output: "standalone",
  // Ship source maps for first-party JS (Lighthouse "valid source maps" best practice).
  productionBrowserSourceMaps: true,
  // Pin the file-tracing + workspace root — a stray pnpm-lock.yaml in the home
  // dir otherwise makes Next/Turbopack infer the wrong root, which would also
  // nest the standalone output under an unexpected subdirectory.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
