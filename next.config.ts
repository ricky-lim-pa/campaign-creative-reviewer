import type { NextConfig } from "next";

const isExport = process.env.STATIC_EXPORT === "1";
const pagesBase = "/campaign-creative-reviewer";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export" as const,
        basePath: pagesBase,
        assetPrefix: pagesBase,
        trailingSlash: true,
        env: { NEXT_PUBLIC_BASE_PATH: pagesBase },
      }
    : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-cms.planetart.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
