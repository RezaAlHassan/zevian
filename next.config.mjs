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
      'html-to-text',
      'htmlparser2',
      'domhandler',
      'dom-serializer',
      'deepmerge',
      '@selderee/plugin-htmlparser2',
    ],
  },
}

export default nextConfig