/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions sono stabili in Next 14, nessun flag necessario
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
