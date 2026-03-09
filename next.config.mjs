/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Le decimos a Webpack que ignore 'WebSdk' porque lo inyectaremos manualmente
    config.externals = [...(config.externals || []), { WebSdk: 'WebSdk' }];
    
    // Configurar fallbacks para módulos Node.js que no existen en el navegador
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
        'node:fs': false,
        'node:path': false,
        'node:process': false,
      };
    }
    
    return config;
  },
}

export default nextConfig
