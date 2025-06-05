
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
    // This tells Next.js to trust requests originating from this specific host and port.
    // It checks the `Origin` header from the browser.
    allowedOrigins: ['https://bookmark.oily.cn:7443'],
    // This tells Next.js to trust the X-Forwarded-Host header if it's one of these values.
    // It checks the `X-Forwarded-Host` header sent by the proxy.
    allowedForwardedHosts: ['bookmark.oily.cn'],
  },
  // For development environment when using HTTPS proxy for HMR and other dev server communications.
  // This also checks the `Origin` header.
  allowedDevOrigins: ['https://bookmark.oily.cn:7443'],
  // NOTE: If WebSocket connections (wss://) for Hot Module Replacement (HMR)
  // are failing when using an HTTPS proxy (e.g., Nginx, Caddy, Nginx Proxy Manager),
  // it's crucial that the proxy server itself is configured to correctly
  // handle WebSocket upgrade requests for the `/_next/webpack-hmr` path.
  // This typically involves:
  // 1. Passing through the `Upgrade` and `Connection` headers.
  //    Example for Nginx (to be added in NPM's Advanced tab for the host):
  //    location /_next/webpack-hmr {
  //        proxy_pass http://YOUR_NEXTJS_INTERNAL_IP:YOUR_NEXTJS_PORT; # e.g., http://10.10.10.253:9003
  //        proxy_http_version 1.1;
  //        proxy_set_header Upgrade $http_upgrade;
  //        proxy_set_header Connection "upgrade";
  //        proxy_set_header Host $host;
  //        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  //        proxy_set_header X-Forwarded-Proto https;
  //        # If X-Forwarded-Port is not automatically set to the original request port (7443)
  //        # by $server_port, you might need to set it explicitly:
  //        # proxy_set_header X-Forwarded-Port 7443; 
  //    }
  // 2. Ensuring the proxy can handle WSS, either by terminating SSL for WSS
  //    and forwarding as WS, or by proxying WSS directly. NPM's "allow_websocket_upgrade: true" should handle this.
  // 3. The `allowedDevOrigins` setting above helps Next.js trust the HMR origin for HTTP parts of HMR,
  //    but the WebSocket protocol upgrade itself is managed at the proxy server level.
  //
  // For Server Actions (HTTP 500 "Invalid Server Actions request"):
  // If issues persist despite `allowedOrigins` and `allowedForwardedHosts` being set,
  // ensure your proxy (NPM) is sending the `X-Forwarded-Port` header with the correct
  // external port (e.g., 7443). In NPM's "Advanced" tab for the host, add:
  // proxy_set_header X-Forwarded-Port 7443; 
  // (or proxy_set_header X-Forwarded-Port $server_port; if $server_port correctly reflects 7443)
};

export default nextConfig;
