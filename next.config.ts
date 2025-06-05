
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
    allowedOrigins: ['https://bookmark.oily.cn:7443'],
    allowedForwardedHosts: ['bookmark.oily.cn'],
  },
  // For development environment when using HTTPS proxy for HMR
  allowedDevOrigins: ['https://bookmark.oily.cn:7443'],
  // NOTE: If WebSocket connections (wss://) for Hot Module Replacement (HMR)
  // are failing when using an HTTPS proxy (e.g., Nginx, Caddy),
  // it's crucial that the proxy server itself is configured to correctly
  // handle WebSocket upgrade requests for the `/_next/webpack-hmr` path.
  // This typically involves:
  // 1. Passing through the `Upgrade` and `Connection` headers.
  //    Example for Nginx:
  //    proxy_set_header Upgrade $http_upgrade;
  //    proxy_set_header Connection "upgrade";
  // 2. Ensuring the proxy can handle WSS, either by terminating SSL for WSS
  //    and forwarding as WS, or by proxying WSS directly.
  // 3. Forwarding appropriate host/protocol headers (e.g., X-Forwarded-Host, X-Forwarded-Proto).
  // The `allowedDevOrigins` setting above helps Next.js trust the HMR origin,
  // but the WebSocket protocol upgrade is managed at the proxy level.
};

export default nextConfig;
