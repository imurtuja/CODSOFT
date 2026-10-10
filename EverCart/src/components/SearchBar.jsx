'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function SearchBar({
  placeholder = 'Search products, brands, categories...',
  className = '',
  autoFocus = false,
  showDropdown = true,
  onSearchSubmit = null,
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const abortControllerRef = useRef(null)
  const inputRef = useRef(null)

  // Sync initial query from URL search param if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentQ = new URLSearchParams(window.location.search).get('q')
      if (currentQ) {
        setQuery(currentQ)
      }
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Debounced search suggestions
  useEffect(() => {
    const trimmed = query.trim()
    if (!showDropdown || trimmed.length < 2) {
      setSuggestions([])
      setLoading(false)
      setIsOpen(false)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(trimmed)}&limit=5`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.products || [])
          setIsOpen(true)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err)
        }
      } finally {
        setLoading(false)
      }
    }, 200)

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [query, showDropdown])

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setIsOpen(false)

    if (onSearchSubmit) {
      onSearchSubmit(trimmed)
      return
    }

    if (isOnAdmin) {
      window.location.href = getMainUrl(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
    // We intentionally keep `query` in state so the user sees their active search term!
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-2.5 pl-10 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-gray-900 placeholder-gray-400 text-sm transition-all shadow-sm"
        />

        {/* Left Search Icon */}
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
        >
          {loading ? (
            <svg
              className="animate-spin h-4 w-4 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>

        {/* Right Actions: Clear Button & Enter Shortcut Badge */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="hidden sm:inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded transition-colors"
            title="Press Enter to search"
          >
            ↵ Enter
          </button>
        </div>
      </form>

      {/* Live Suggestions Dropdown */}
      {showDropdown && isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
          {loading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Searching products...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 flex justify-between items-center">
                <span>Products Matching &ldquo;{query}&rdquo;</span>
                <span className="text-gray-400 font-normal">{suggestions.length} suggestions</span>
              </div>
              <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {suggestions.map((p) => {
                  const productUrl = isOnAdmin
                    ? getMainUrl(`/product/${p._id || p.id}`)
                    : `/product/${p._id || p.id}`

                  const itemContent = (
                    <div className="flex items-center p-3 hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center mr-3 border border-gray-200">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        ) : (
                          <span className="text-lg">📦</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider truncate">
                          {p.brand}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </p>
                        {p.category && (
                          <span className="inline-block mt-0.5 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded capitalize">
                            {p.category}
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {formatPrice(p.price)}
                        </p>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <p className="text-[10px] text-green-600 font-semibold">
                            Save {formatPrice(p.originalPrice - p.price)}
                          </p>
                        )}
                      </div>
                    </div>
                  )

                  return (
                    <li key={p._id || p.id}>
                      {isOnAdmin ? (
                        <a href={productUrl} onClick={() => setIsOpen(false)}>
                          {itemContent}
                        </a>
                      ) : (
                        <Link href={productUrl} prefetch={false} onClick={() => setIsOpen(false)}>
                          {itemContent}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* View All Button */}
              <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-2 px-4 text-xs font-semibold text-black bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>View all results for &ldquo;{query}&rdquo;</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              <p className="font-semibold text-gray-800 mb-1">No products found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400">
                Check for typos or try searching for a brand like &ldquo;Sony&rdquo;, &ldquo;Apple&rdquo;, or &ldquo;Canon&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
