/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', 'meridian.ai'],
    },
    env: {
        CUSTOM_KEY: 'meridian-hackathon-2025',
    },
    async rewrites() {
        return [
            // Exclude NextAuth routes - let them be handled by NextAuth
            {
                source: '/api/profile/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/profile/:path*`,
            },
            {
                source: '/api/repositories/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/repositories/:path*`,
            },
            {
                source: '/api/analysis/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/analysis/:path*`,
            },
            {
                source: '/api/health',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/health`,
            },
        ];
    },
}

module.exports = nextConfig
