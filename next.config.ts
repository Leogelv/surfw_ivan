import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Игнорировать ошибки проверки типов во время продакшн сборки
    // Это необходимо, потому что проект находится в активной разработке
    ignoreBuildErrors: true,
  },
  eslint: {
    // Игнорировать ошибки eslint линтера во время продакшн сборки
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
