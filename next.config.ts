import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* ── Images ─────────────────────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.master.bleck.it',
      },
    ],
  },

  /* ── Performance ────────────────────────────────── */
  reactStrictMode: true,

  // Compress responses (gzip/brotli) for faster transfer
  compress: true,

  // Reduce powered-by header overhead
  poweredByHeader: false,

  // Enable package import tree-shaking for smaller bundles
  experimental: {
    optimizePackageImports: ['next-auth', 'mongoose'],
  },
};

export default nextConfig;
