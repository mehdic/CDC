/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // serverComponentsExternalPackages handles native modules in Next.js 14+
  // No additional webpack config needed for better-sqlite3
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
