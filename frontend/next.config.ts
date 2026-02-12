import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tidy-lounge-tflbthgdnxa3h.t3.storageapi.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
