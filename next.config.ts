import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "http", // Tambahkan jika gambar diakses via HTTP
        hostname: "servicereport.fanscosa.co.id",
        pathname: "/storage/**",
      },
      {
        protocol: "https", // Tambahkan juga HTTPS jika sewaktu-waktu berpindah ke SSL
        hostname: "servicereport.fanscosa.co.id",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
