/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  output: "standalone",
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: "https://hotelrshammad.co.in/api", // Use domain instead of IP
    NEXT_PUBLIC_STORAGE_PATH: "/local-storage",
    NEXT_PUBLIC_AUTH_SECRET: "your-secure-secret",
  },
   async redirects() {
    return [
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
        destination: "https://hotelrshammad.co.in/api/:path*", // Backend via domain
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
            value: "https://hotelrshammad.co.in", // Restrict CORS to your domain
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
    ];
  },
  basePath: "",
};

module.exports = nextConfig;

