/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Local dev: http://localhost:8000
    // Docker:    http://backend:8000 (set via BACKEND_URL env var)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
