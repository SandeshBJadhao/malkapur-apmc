import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'kcmvkfrzdshjxvixmzfl.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

