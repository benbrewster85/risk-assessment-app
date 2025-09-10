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
            value: "img-src 'self' blob: data: *.supabase.co https://openweathermap.org;",
          },
        ],
      },
    ];
}}


export default nextConfig;