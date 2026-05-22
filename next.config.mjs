/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/app/compose',     destination: '/app/send', permanent: true },
      { source: '/app/manual-send', destination: '/app/send', permanent: true },
    ];
  },
}

export default nextConfig
