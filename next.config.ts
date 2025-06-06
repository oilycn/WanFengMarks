
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
  experimental: {
    serverActions: {
      // This MUST match the 'Origin' header from the browser, including scheme and port.
      // For your setup: https://bm.oily.cn:7443
      allowedOrigins: ['https://bm.oily.cn:7443'],

      // This MUST match the 'X-Forwarded-Host' header value sent by your proxy.
      // For your setup: bm.oily.cn
      allowedForwardedHosts: ['bm.oily.cn'],
    },
  },
  // This is for the development server HMR and other dev-time communications.
  // It should also match the 'Origin' header.
  allowedDevOrigins: ['https://bm.oily.cn:7443'],
  // For WebSocket (wss://) Hot Module Replacement (HMR) to work through a proxy,
  // the proxy server itself (e.g., Nginx, Caddy, Nginx Proxy Manager) must be configured
  // to properly upgrade WebSocket connections for the `/_next/webpack-hmr` path.
  // This typically involves setting headers like `Upgrade` and `Connection "upgrade"`.
  // Example Nginx config for HMR path (for Nginx Proxy Manager, use the Advanced tab for a custom location /_next/webpack-hmr):
  // location /_next/webpack-hmr {
  //     proxy_pass http://YOUR_NEXTJS_DEV_IP:YOUR_NEXTJS_DEV_PORT;
  //     proxy_http_version 1.1;
  //     proxy_set_header Upgrade $http_upgrade;
  //     proxy_set_header Connection "upgrade";
  //     proxy_set_header Host $host;
  //     proxy_set_header X-Forwarded-Proto https;
  //     proxy_set_header X-Forwarded-Host $host; // Or your specific host bm.oily.cn
  //     proxy_set_header X-Forwarded-Port 7443; // Crucial for correct port detection
  // }
  //
  // CRITICAL FOR SERVER ACTIONS if allowedOrigins alone isn't sufficient:
  // Ensure your proxy (Nginx Proxy Manager) is sending:
  // 1. X-Forwarded-Proto: https
  // 2. X-Forwarded-Host: bm.oily.cn (or whatever $host resolves to in your proxy)
  // 3. X-Forwarded-Port: 7443
  //
  // In Nginx Proxy Manager, this is done in a Custom Location for / with Advanced Configuration:
  //   proxy_set_header Host $host;
  //   proxy_set_header X-Forwarded-Proto https;
  //   proxy_set_header X-Forwarded-Host $host; // Or "bm.oily.cn"
  //   proxy_set_header X-Forwarded-Port 7443;
  //   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
};

export default withBundleAnalyzer(nextConfig);
