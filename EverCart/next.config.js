/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      },
      {
        protocol: 'https',
        hostname: 'rukminim1.flixcart.com'
      },
      {
        protocol: 'https',
        hostname: 'www.apple.com'
      },
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'i.dell.com'
      },
      {
        protocol: 'https',
        hostname: 'assets2.razerzone.com'
      },
      {
        protocol: 'https',
        hostname: 'store.dji.com'
      },
      {
        protocol: 'https',
        hostname: 'www.sony.co.in'
      },
      {
        protocol: 'https',
        hostname: 'www.nikon.co.in'
      },
      {
        protocol: 'https',
        hostname: 'www.lg.com'
      },
      {
        protocol: 'https',
        hostname: 'assets.bose.com'
      },
      {
        protocol: 'https',
        hostname: 'images.samsung.com'
      },
      {
        protocol: 'https',
        hostname: 'in.jbl.com'
      },
      {
        protocol: 'https',
        hostname: 'store.in.panasonic.com'
      },
      {
        protocol: 'https',
        hostname: 'www.oneplus.in'
      },
      {
        protocol: 'https',
        hostname: 'in.canon'
      },
      {
        protocol: 'https',
        hostname: 'www.sony.net'
      },
      {
        protocol: 'https',
        hostname: 'store.google.com'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization, rsc, next-router-state-tree, next-router-prefetch, next-url' },
          { key: 'Access-Control-Expose-Headers', value: 'request-id, x-rtb-fingerprint-id' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), otp-credentials=*' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimizer = config.optimization.minimizer || []
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
              drop_debugger: true,
            },
          },
        })
      )
    }
    return config
  }
}

module.exports = nextConfig
