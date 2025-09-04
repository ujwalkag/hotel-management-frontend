/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: "https://hotelrshammad.co.in/api",
    NEXT_PUBLIC_STORAGE_PATH: "/local-storage", 
    NEXT_PUBLIC_AUTH_SECRET: "your-secure-secret",
  },
  
  async redirects() {
    return [
      {
        source: "/rooms",
        destination: "/admin/rooms",
        permanent: true,
      },
      {
        source: "/menu",
        destination: "/admin/menu", 
        permanent: true,
      },
      {
        source: "/billing/create",
        destination: "/staff/restaurant-billing",
        permanent: true,
      },
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true,
      },
      {
        source: "/staff", 
        destination: "/staff-dashboard",
        permanent: true,
      },
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://hotelrshammad.co.in/api/:path*",
      },
    ];
  },
  
  async headers() {
    return [
      {
        source: "/api/:path*", 
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "https://hotelrshammad.co.in",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Authorization, Content-Type",
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type', 
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  basePath: "",
  
  images: {
    domains: ['hotelrshammad.co.in'],
    formats: ['image/webp', 'image/avif'],
  },
};

module.exports = nextConfig;
