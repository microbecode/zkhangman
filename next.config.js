/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add esbuild configuration
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Exclude specific packages from optimization
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        ...config.optimization?.splitChunks,
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          defaultVendors: {
            ...config.optimization?.splitChunks?.cacheGroups?.defaultVendors,
            exclude: [
              '@noir-lang/noirc_abi',
              '@noir-lang/acvm_js'
            ],
          },
        },
      },
    };

    // Add resolve fallbacks
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...config.resolve?.fallback,
        fs: false,
        path: false,
        os: false,
      },
    };

    return config;
  },
  // Add experimental features
  experimental: {
    esmExternals: 'loose',
  },
  // Ensure proper path resolution
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 