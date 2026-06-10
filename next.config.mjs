/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel: no static export needed — API routes work natively
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...externals, '@vladmandic/face-api'];
    }
    return config;
  },
};

export default nextConfig;
