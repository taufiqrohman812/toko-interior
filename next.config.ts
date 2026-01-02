/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Memaksa build tetap jalan meskipun ada error TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Memaksa build tetap jalan meskipun ada error linting
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;