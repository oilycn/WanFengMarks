
import type {NextConfig} from 'next';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
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
      // This tells Next.js to trust Server Action requests coming from your proxied domain and port.
      // The browser sends an Origin header like "https://bm.oily.cn:7443".
      // Nginx Proxy Manager should be configured to send:
      //   X-Forwarded-Proto: https
      //   X-Forwarded-Host: bm.oily.cn (or the $host variable if it correctly reflects this)
      //   X-Forwarded-Port: 7443
      // Next.js uses these X-Forwarded-* headers to reconstruct what it believes its public origin is.
      // If that reconstructed origin matches an entry in allowedOrigins, the request is permitted.
      allowedOrigins: ["bm.oily.cn:7443", "ip.oily.cn:7443"],
    },
  },
};

export default withBundleAnalyzer(nextConfig);
