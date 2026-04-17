import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_DEV === "1"
    ? { watchOptions: { pollIntervalMs: 1000 } }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
