/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config) => {
    config.externals.push({
      ws: "ws",
    });
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ["@supabase/ssr"],
  },

  // ✅ Corrected syntax: "headers: async () =>"
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // ✅ Merged and cleaned up img-src directive
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' blob: data: *.supabase.co https://openweathermap.org *.tile.openstreetmap.org unpkg.com; " +
              "font-src 'self'; " +
               "connect-src 'self' *.supabase.co https://api.mapbox.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;