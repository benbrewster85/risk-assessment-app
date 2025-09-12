/** @type {import('next').NextConfig} */
const nextConfig = {
  // This block tells Next.js to not fail the build on ESLint errors.
  // It will still show you the warnings, but it will not stop the deployment.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  webpack: (config) => {
    config.externals.push({
        'ws': 'ws'
    });
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },
  
async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Your existing policy with the new domains added for map images
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: *.supabase.co *.tile.openstreetmap.org unpkg.com; font-src 'self'; connect-src 'self' *.supabase.co;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;