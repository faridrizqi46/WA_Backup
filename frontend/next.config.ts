import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'better-sqlite3', '@prisma/adapter-pg', '@prisma/adapter-better-sqlite3'],
};

export default nextConfig;