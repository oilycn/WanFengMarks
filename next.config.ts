
import type {NextConfig} from 'next';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      // This tells Next.js to trust Server Action requests
      // if the Origin header is exactly 'https://bm.oily.cn:7443'.
      allowedOrigins: ['https://bm.oily.cn:7443'],
      // This tells Next.js to trust the X-Forwarded-Host header
      // if its value is 'bm.oily.cn'.
      allowedForwardedHosts: ['bm.oily.cn'],
    },
  },
  // This is for the development server HMR and other dev-time communications.
  // It should match the Origin from which the browser accesses the dev server.
  allowedDevOrigins: ['https://bm.oily.cn:7443'],
};

export default withBundleAnalyzer(nextConfig);
