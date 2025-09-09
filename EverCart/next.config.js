/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
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
      }
    ]
  },
  // Suppress console errors in production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.minimizer = config.optimization.minimizer || []
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true,
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
