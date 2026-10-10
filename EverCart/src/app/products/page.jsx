'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'
import { toast } from '../../components/Toast'
import { fetchCached } from '../../utils/apiCache'

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'laptops', label: 'Laptops' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'audio', label: 'Audio' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'accessories', label: 'Accessories' },
]

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [priceRange, setPriceRange] = useState('all')

  const fetchProducts = useCallback(async () => {
    try {
      // If we already have products, do optimistic transition (keepPreviousData) instead of wiping the grid
      if (products.length > 0) {
        setIsPageTransitioning(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy,
      })

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }

      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number)
        if (!isNaN(min)) params.append('minPrice', min.toString())
        if (!isNaN(max)) params.append('maxPrice', max.toString())
      }

      const data = await fetchCached(`/api/products?${params.toString()}`)
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
      setTotalProducts(data.total || 0)
    } catch (error) {
      console.error('Error fetching products:', error)
      if (products.length === 0) setProducts([])
      setTotalPages(1)
      toast.error('Unable to load products. Please check connection.')
    } finally {
      setLoading(false)
      setIsPageTransitioning(false)
    }
  }, [currentPage, sortBy, priceRange, selectedCategory, products.length])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Background adjacent prefetching: pre-warm next & previous pages for 0ms instant pagination
  useEffect(() => {
    const buildParamUrl = (page) => {
      const p = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: sortBy,
      })
      if (selectedCategory !== 'all') p.append('category', selectedCategory)
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number)
        if (!isNaN(min)) p.append('minPrice', min.toString())
        if (!isNaN(max)) p.append('maxPrice', max.toString())
      }
      return `/api/products?${p.toString()}`
    }

    if (currentPage < totalPages) {
      fetchCached(buildParamUrl(currentPage + 1)).catch(() => {})
    }
    if (currentPage > 1) {
      fetchCached(buildParamUrl(currentPage - 1)).catch(() => {})
    }
  }, [currentPage, totalPages, sortBy, selectedCategory, priceRange])

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const handlePriceChange = (e) => {
    setPriceRange(e.target.value)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSortBy('createdAt')
    setPriceRange('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'createdAt'

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center space-x-2">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Products</span>
        </nav>

        {/* Page Banner Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="max-w-3xl mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              All Products
            </h1>
            <p className="text-gray-500 text-sm sm:text-base mt-2">
              Discover top-rated smartphones, audio devices, cameras, and accessories crafted for high performance.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200 hover:text-black'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Counter & Filter Controls */}
        <div id="products-toolbar" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 mb-8 shadow-sm">
          {/* Result Count and Active Filters */}
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="font-medium">
              Showing <strong className="text-gray-900">{products.length}</strong> of{' '}
              <strong className="text-gray-900">{totalProducts}</strong> products
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 ml-2"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Price Filter */}
            <div className="relative">
              <select
                value={priceRange}
                onChange={handlePriceChange}
                aria-label="Filter by price"
                className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all cursor-pointer"
              >
                <option value="all">All Prices</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-25000">₹10,000 - ₹25,000</option>
                <option value="25000-50000">₹25,000 - ₹50,000</option>
                <option value="50000-100000">₹50,000 - ₹1,00,000</option>
                <option value="100000-9999999">Above ₹1,00,000</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={handleSortChange}
                aria-label="Sort products"
                className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all cursor-pointer"
              >
                <option value="createdAt">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid / Skeleton / Empty State */}
        {loading && products.length === 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between h-[420px]"
              >
                <div>
                  <div className="w-full h-48 rounded-xl skeleton-shimmer mb-4" />
                  <div className="h-3.5 skeleton-shimmer rounded-full w-1/4 mb-2.5" />
                  <div className="h-5 skeleton-shimmer rounded-lg w-3/4 mb-2.5" />
                  <div className="h-4 skeleton-shimmer rounded w-1/2 mb-3" />
                  <div className="h-6 skeleton-shimmer rounded-lg w-1/3" />
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <div className="h-10 skeleton-shimmer rounded-xl flex-1" />
                  <div className="h-10 skeleton-shimmer rounded-xl flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className={`flex flex-wrap justify-center gap-6 transition-opacity duration-200 ${
              isPageTransitioning ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}>
              {products.map((product) => (
                <div
                  key={product._id || product.id}
                  className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm flex flex-col"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  type="button"
                  onClick={() => {
                    const prev = Math.max(1, currentPage - 1)
                    setCurrentPage(prev)
                    if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page)
                        if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' })
                      }}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(totalPages, currentPage + 1)
                    setCurrentPage(next)
                    if (typeof window !== 'undefined') window.scrollTo({ top: 120, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm px-4">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No matching products found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              We couldn&apos;t find any items matching your current filters. Try resetting the filters or browse our catalog.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}