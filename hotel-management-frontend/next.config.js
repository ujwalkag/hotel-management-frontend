// next.config.js - Enhanced configuration with proper API proxy
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
    WS_BACKEND_URL: process.env.WS_BACKEND_URL || 'ws://localhost:8000',
  },

  // API rewrites for backend communication
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    return [
      // Restaurant API endpoints
      {
        source: '/api/restaurant/:path*',
        destination: `${backendUrl}/api/restaurant/:path*`,
      },
      
      // Bills API endpoints
      {
        source: '/api/bills/:path*',
        destination: `${backendUrl}/api/bills/:path*`,
      },
      
      // Menu API endpoints  
      {
        source: '/api/menu/:path*',
        destination: `${backendUrl}/api/menu/:path*`,
      },
      
      // Auth API endpoints
      {
        source: '/api/auth/:path*',
        destination: `${backendUrl}/api/auth/:path*`,
      },
      
      // User API endpoints
      {
        source: '/api/users/:path*',
        destination: `${backendUrl}/api/users/:path*`,
      },
      
      // Rooms API endpoints
      {
        source: '/api/rooms/:path*',
        destination: `${backendUrl}/api/rooms/:path*`,
      },
      
      // WebSocket proxy
      {
        source: '/ws/:path*',
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },

  // Headers for CORS and WebSocket support
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
      {
        source: '/ws/:path*',
        headers: [
          { key: 'Connection', value: 'Upgrade' },
          { key: 'Upgrade', value: 'websocket' },
        ],
      },
    ];
  },

  // Image optimization settings
  images: {
    domains: ['localhost', '127.0.0.1'],
    unoptimized: true,
  },

  // Webpack configuration for better builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    
    return config;
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: [],
  },

  // Output configuration
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Trailing slash
  trailingSlash: false,
};

module.exports = nextConfig;
