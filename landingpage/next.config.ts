import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export voor maximale snelheid en SEO
  images: {
    unoptimized: true, // Vereist voor static export
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qtrypzzcjebvfcihiynt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Performance optimalisaties
  compress: true,
  poweredByHeader: false,
  // SEO optimalisaties
  generateEtags: true,
  // Modern JavaScript - geen polyfills voor oude browsers
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Modern browser support - minimal transpilation
  transpilePackages: [],
};

export default nextConfig;
