
import type {NextConfig} from 'next';

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
  serverActions: {
    // This MUST match the 'Origin' header from the browser, including scheme and port.
    // For your setup: https://bm.oily.cn:7443
    allowedOrigins: ['https://bm.oily.cn:7443'],

    // This MUST match the 'X-Forwarded-Host' header value sent by your proxy.
    // For your setup: bm.oily.cn
    allowedForwardedHosts: ['bm.oily.cn'],
  },
  // This is for the development server HMR and other dev-time communications.
  // It should also match the 'Origin' header.
  allowedDevOrigins: ['https://bm.oily.cn:7443'],
  // For WebSocket (wss://) Hot Module Replacement (HMR) to work through a proxy,
  // the proxy server itself (e.g., Nginx, Caddy, Nginx Proxy Manager) must be configured
  // to properly upgrade WebSocket connections for the `/_next/webpack-hmr` path.
  // This typically involves setting headers like `Upgrade` and `Connection "upgrade"`.
  // Example Nginx config for HMR path (for Nginx Proxy Manager, use the Advanced tab):
  // location /_next/webpack-hmr {
  //     proxy_pass http://10.10.10.253:9003; # Your Next.js dev server IP:PORT
  //     proxy_http_version 1.1;
  //     proxy_set_header Upgrade $http_upgrade;
  //     proxy_set_header Connection "upgrade";
  //     proxy_set_header Host $host;
  //     proxy_set_header X-Forwarded-Proto https;
  //     proxy_set_header X-Forwarded-Port 7443; // Crucial for correct port detection
  // }
  //
  // CRITICAL FOR SERVER ACTIONS:
  // If Server Actions are still failing with "Invalid Server Actions request"
  // (often due to host/origin/port mismatch), ensure your proxy is sending:
  // 1. X-Forwarded-Proto: https
  // 2. X-Forwarded-Host: bm.oily.cn
  // 3. X-Forwarded-Port: 7443
  //
  // For Nginx Proxy Manager, in the "Advanced" tab for the proxy host (bm.oily.cn),
  // you would add:
  //   proxy_set_header X-Forwarded-Proto https;
  //   proxy_set_header X-Forwarded-Host $host; // Or "bm.oily.cn" if $host is problematic
  //   proxy_set_header X-Forwarded-Port 7443;
  //
  // The $host variable in Nginx usually contains the original host requested by the client.
  // If your NPM setup has `forward_scheme: "http"`, it might not be sending `X-Forwarded-Proto https` by default unless you add it.
};

export default nextConfig;
