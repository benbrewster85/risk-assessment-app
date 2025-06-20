/** @type {import('next').NextConfig} */
const nextConfig = {
    // This webpack configuration helps Next.js correctly handle a
    // dependency used by Supabase's real-time features.
    webpack: (config) => {
        config.externals.push({
            'ws': 'ws'
        });
        return config;
    },
};

export default nextConfig;