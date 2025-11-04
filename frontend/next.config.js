/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações para reduzir conflitos durante desenvolvimento
  // especialmente em ambientes como Windows onde locks de arquivo são problemáticos
  
  // Otimizações de compilação
  typescript: {
    // Ignorar erros de tipo durante build (mais rápido)
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Ignorar erros de lint durante build (mais rápido)
    ignoreDuringBuilds: false,
  },
  
  // Configurações de produção
  swcMinify: true,
  
  // Configurações experimentais para melhorar performance
  experimental: {
    // Usar SWC para minificação (mais rápido)
    forceSwcTransforms: true,
  },
  
  // Configurações de webpack para melhorar performance em desenvolvimento
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Em desenvolvimento, reduzir cache para evitar conflitos
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
