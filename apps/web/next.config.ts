import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker / VM bind mounts: native FS events are unreliable; poll for dev HMR (see DOCKER_DEV in compose).
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
