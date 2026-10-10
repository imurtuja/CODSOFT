'use client'
import Link from 'next/link'

export default function NotFoundView() {
  const getStorefrontUrl = (path = '/') => {
    if (typeof window === 'undefined') return path
    const host = window.location.host
    const protocol = window.location.protocol
    if (host.startsWith('admin.')) {
      const cleanHost = host.replace(/^admin\./, '')
      return `${protocol}//${cleanHost}${path}`
    }
    return path
  }

  const homeUrl = getStorefrontUrl('/')
  const productsUrl = getStorefrontUrl('/products')

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-white">
      <div className="max-w-md w-full text-center">
        {/* Subtle 404 tag */}
        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-gray-100 text-gray-800 mb-6">
          Error 404
        </div>

        {/* Big clean headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Page Not Found
        </h1>

        {/* Minimalist description */}
        <p className="text-gray-500 text-base sm:text-lg mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist, has been removed, or is temporarily unavailable.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={homeUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 transition-colors shadow-sm"
          >
            Go to Homepage
          </Link>
          <Link
            href={productsUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  )
}
