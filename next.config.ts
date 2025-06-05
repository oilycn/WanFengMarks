
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
        hostname: '**', // 允许任何 HTTPS 主机名
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**', // 允许任何 HTTP 主机名
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Explicitly configure server actions.
  serverActions: {
    allowedOrigins: ['https://bookmark.oily.cn:7443'], // Added https://
    allowedForwardedHosts: ['bookmark.oily.cn'], // Moved from experimental
  },
  // Configure allowed origins for the development server
  allowedDevOrigins: ['https://bookmark.oily.cn:7443'], // Added https://
};

export default nextConfig;
