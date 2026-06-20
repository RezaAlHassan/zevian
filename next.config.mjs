const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      '@supabase/supabase-js',
    ],
    // Tree-shake heavy barrel imports so only the used functions ship to the client.
    optimizePackageImports: ['date-fns'],
  },
}

export default nextConfig