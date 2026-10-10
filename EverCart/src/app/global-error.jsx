'use client'

import { useEffect } from 'react'

export default function GlobalFatalError({ error, reset }) {
  useEffect(() => {
    console.error('Fatal application error:', error)
  }, [error])

  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900">Application Error</h2>
          <p className="text-sm text-gray-600">
            A temporary connection issue occurred. Please reload to continue shopping.
          </p>
          <div className="pt-2 flex gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => { window.location.href = '/' }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
