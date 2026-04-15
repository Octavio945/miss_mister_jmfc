import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "trappy-catastrophically-sha.ngrok-free.dev",
    "localtunnel.me"
  ] as string[],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'ita0aucajmrf9ahw.public.blob.vercel-storage.com',
      },
    ],
  },
};

export default nextConfig;
