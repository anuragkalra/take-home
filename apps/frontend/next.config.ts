import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@anvara/config'],
};

export default nextConfig;
