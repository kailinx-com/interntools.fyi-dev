import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DOCKER_DEV=1: poll for HMR when the app is bind-mounted (compose sets this).
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
