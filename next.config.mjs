/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Map NEXTAUTH_URL to AUTH_URL at build/start time for NextAuth v5
  env: {
    AUTH_URL: process.env.NEXTAUTH_URL || process.env.AUTH_URL,
    AUTH_SECRET: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  },
};

export default nextConfig;
