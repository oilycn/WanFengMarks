
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
    // Ensure this matches the 'Origin' header from the browser, including scheme and port.
    // Example: https://your-proxied-domain.com:port
    allowedOrigins: ['https://bm.oily.cn:7443'],

    // Ensure this matches the 'X-Forwarded-Host' header value sent by your proxy.
    // Example: your-proxied-domain.com (usually without port)
    allowedForwardedHosts: ['bm.oily.cn'],
  },
  // This is for the development server HMR and other dev-time communications.
  // It should also match the 'Origin' header.
  allowedDevOrigins: ['https://bm.oily.cn:7443'],
  // For WebSocket (wss://) Hot Module Replacement (HMR) to work through a proxy,
  // the proxy server itself (e.g., Nginx, Caddy, Nginx Proxy Manager) must be configured
  // to properly upgrade WebSocket connections for the `/_next/webpack-hmr` path.
  // This typically involves setting headers like `Upgrade` and `Connection "upgrade"`.
  // Example Nginx config for HMR path:
  // location /_next/webpack-hmr {
  //     proxy_pass http://localhost:9003; # Your Next.js dev server
  //     proxy_http_version 1.1;
  //     proxy_set_header Upgrade $http_upgrade;
  //     proxy_set_header Connection "upgrade";
  //     proxy_set_header Host $host;
  //     proxy_set_header X-Forwarded-Proto https;
  // }
  // Additionally, if Server Actions are still failing with a 500 error and
  // "Invalid Server Actions request" (often due to host/origin mismatch),
  // ensure your proxy is also sending the correct X-Forwarded-Port header.
  // For Nginx Proxy Manager, in the "Advanced" tab for the proxy host, you might add:
  // proxy_set_header X-Forwarded-Port 7443;
  // (replace 7443 with the actual external port if different)
};

export default nextConfig;
