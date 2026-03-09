/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración de Turbopack (Next.js 16+)
  turbopack: {
    resolveAlias: {
      // Librerías que se inyectan manualmente
    },
  },
  // Mantener webpack config para compatibilidad
  webpack: (config, { isServer }) => {
    // Le decimos a Webpack que ignore 'WebSdk' porque lo inyectaremos manualmente
    config.externals = [...(config.externals || []), { WebSdk: 'WebSdk' }];
    
    // Resolver módulos de Node que no están disponibles en el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        encoding: false,
      };
    }
    
    return config;
  },
}

export default nextConfig
