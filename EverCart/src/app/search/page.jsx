'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'
import { ChevronRightIcon } from '../../components/CategoryIcons'

const POPULAR_SEARCHES = ['iPhone', 'Sony', 'Camera', 'Watch', 'Headphones', 'DJI', 'Earbuds', 'Samsung']

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryParam = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [sortBy, setSortBy] = useState('createdAt')
  const [priceRange, setPriceRange] = useState('all')

  const fetchProducts = useCallback(async (query, page = 1, sort = 'createdAt', price = 'all') => {
    if (!query || !query.trim()) {
      setProducts([])
      setTotalProducts(0)
      setTotalPages(1)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let url = `/api/products?search=${encodeURIComponent(query.trim())}&page=${page}&limit=12&sort=${sort}`
      
      if (price !== 'all') {
        const [min, max] = price.split('-').map(Number)
        if (!isNaN(min)) url += `&minPrice=${min}`
        if (!isNaN(max)) url += `&maxPrice=${max}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalPages(data.totalPages || 1)
        setTotalProducts(data.total || 0)
        setCurrentPage(data.page || 1)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching search products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (queryParam) {
      fetchProducts(queryParam, currentPage, sortBy, priceRange)
    } else {
      setLoading(false)
    }
  }, [queryParam, currentPage, sortBy, priceRange, fetchProducts])

  const handleQuickTagClick = (tag) => {
    setCurrentPage(1)
    router.push(`/search?q=${encodeURIComponent(tag)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center space-x-2">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Search</span>
        </nav>

        {/* Search Header Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="max-w-3xl mx-auto text-center mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {queryParam ? (
                <>
                  Results for <span className="text-blue-600">&ldquo;{queryParam}&rdquo;</span>
                </>
              ) : (
                'Search Our Catalog'
              )}
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              Find premium electronics, smartphones, audio gear, and cutting-edge tech
            </p>
          </div>

          {/* Popular Search Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-400 font-medium mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickTagClick(tag)}
                className={`px-3 py-1 rounded-full border transition-all ${
                  queryParam.toLowerCase() === tag.toLowerCase()
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Sort Controls Bar */}
        {queryParam && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 mb-8 shadow-sm">
            <div className="text-sm text-gray-600 font-medium">
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="animate-pulse">Searching...</span>
                </span>
              ) : (
                <span>
                  Found <strong className="text-gray-900">{totalProducts}</strong> {totalProducts === 1 ? 'product' : 'products'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-gray-900 font-medium"
                >
                  <option value="createdAt">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>

              {/* Price Filter Dropdown */}
              <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                <label className="text-xs text-gray-500 font-medium whitespace-nowrap">Price:</label>
                <select
                  value={priceRange}
                  onChange={(e) => {
                    setPriceRange(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black text-gray-900 font-medium"
                >
                  <option value="all">All Prices</option>
                  <option value="0-10000">Under ₹10,000</option>
                  <option value="10000-25000">₹10,000 - ₹25,000</option>
                  <option value="25000-50000">₹25,000 - ₹50,000</option>
                  <option value="50000-100000">₹50,000 - ₹1,00,000</option>
                  <option value="100000-9999999">Above ₹1,00,000</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Container */}
        {loading ? (
          <div className="flex flex-wrap justify-center gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-sm bg-white rounded-xl border border-gray-200 p-4 animate-pulse shadow-sm"
              >
                <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="flex flex-wrap justify-center gap-6">
              {products.map((product) => (
                <div
                  key={product._id || product.id}
                  className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] max-w-sm flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="inline-flex rounded-xl shadow-sm border border-gray-200 bg-white p-1 space-x-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                      currentPage === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-black text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                      currentPage === totalPages
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 bg-gray-100/80 rounded-2xl flex items-center justify-center mx-auto mb-3.5 text-gray-700 shadow-2xs border border-gray-200/60">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mb-1">
              No products found {queryParam ? `for "${queryParam}"` : ''}
            </h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any matches. Check your spelling, try broader keywords, or select one of our popular tags below.
            </p>

            {/* Popular searches */}
            <div className="mb-5 pt-3 border-t border-gray-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                Popular Searches
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mx-auto">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-black hover:text-white text-gray-700 border border-gray-200/70 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              <Link
                href="/products"
                className="h-10 bg-black text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1 hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>All Products</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/categories"
                className="h-10 bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-colors"
              >
                Categories
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading search...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}