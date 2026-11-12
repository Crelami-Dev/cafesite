import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolated verification servers must not lock the user's running development server.
  distDir: process.env.CAFE_NEXT_DIST_DIR || ".next",
  // Izinkan akses development dari perangkat lain di jaringan lokal.
  // Next.js hanya mencocokkan hostname; port dan protokol tidak ditulis.
  allowedDevOrigins: ["192.168.0.117", "192.168.1.135"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
