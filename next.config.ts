import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Portable build: deploy only traced runtime dependencies to low-memory Node hosts.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;