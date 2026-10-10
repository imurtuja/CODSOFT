'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('EverCart caught client-side runtime exception:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            We encountered a temporary connection issue while loading this page.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white text-sm font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-all active:scale-95"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
