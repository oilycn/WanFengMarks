
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
  // Note: For Cloudflare Pages deployment, 'serverActions' might need to be under 'experimental'
  // if the build environment shows "Unrecognized key(s) in object: 'serverActions'".
  // We are placing it under 'experimental' for broader compatibility with build systems.
  // If Server Actions are still failing with "Invalid Server Actions request"
  // (often due to host/origin/port mismatch), ensure your proxy (Nginx Proxy Manager) is sending:
  // 1. X-Forwarded-Proto: https
  // 2. X-Forwarded-Host: bm.oily.cn (or whatever $host resolves to in your proxy)
  // 3. X-Forwarded-Port: 7443
  //
  // In Nginx Proxy Manager, this is done in a Custom Location for / with Advanced Configuration:
  //   proxy_set_header Host $host;
  //   proxy_set_header X-Forwarded-Proto https;
  //   proxy_set_header X-Forwarded-Host $host;
  //   proxy_set_header X-Forwarded-Port 7443;
  //   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
};

export default withBundleAnalyzer(nextConfig);
