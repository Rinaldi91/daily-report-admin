import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Tambahkan ini untuk build di Docker

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "http",
        hostname: "servicereport.fanscosa.co.id",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "servicereport.fanscosa.co.id",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

