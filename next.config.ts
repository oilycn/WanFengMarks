
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
    allowedOrigins: ['bookmark.oily.cn:7443'],
  },
  // Configure allowed origins for the development server
  allowedDevOrigins: ['bookmark.oily.cn:7443'],
};

export default nextConfig;
