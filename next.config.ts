
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
  // This can sometimes help with how Next.js handles action requests,
  // especially in proxied environments.
  serverActions: true,
};

export default nextConfig;
