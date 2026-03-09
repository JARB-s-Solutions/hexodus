/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
      // Le decimos a Webpack que ignore 'WebSdk' porque lo inyectaremos manualmente
      config.externals = [...(config.externals || []), { WebSdk: 'WebSdk' }];
      return config;
    },
}

export default nextConfig
