import type { NextConfig } from "next";

const isGHPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGHPages ? "/prototypes" : "",
  transpilePackages: ["@jireh-health/ui"],
  images: { unoptimized: true },
};

export default nextConfig;
