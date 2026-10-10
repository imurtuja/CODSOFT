'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '../../../components/ProductCard'
import { fetchCached } from '../../../utils/apiCache'

const CATEGORY_DETAILS = {
  electronics: {
    title: 'Electronics',
    description: 'Smartphones, tablets, and wearable tech from leading brands.',
  },
  laptops: {
    title: 'Laptops',
    description: 'High-performance laptops, ultrabooks, and workstations for pros and creators.',
  },
  gaming: {
    title: 'Gaming',
    description: 'Consoles, handheld gaming systems, high-precision controllers, and accessories.',
  },
  audio: {
    title: 'Audio',
    description: 'Noise-canceling headphones, wireless earbuds, and high-fidelity home speakers.',
  },
  cameras: {
    title: 'Cameras',
    description: 'Mirrorless cameras, compact gimbals, action cams, and cinematography drones.',
  },
  accessories: {
    title: 'Accessories',
    description: 'Precision mice, mechanical keyboards, GaN chargers, and connectivity docks.',
  },
}

export default function CategoryPageClient({ initialProducts, slug }) {
  const params = useParams()
  const rawSlug = (slug || (typeof params?.slug === 'string' ? params.slug : '')).toLowerCase()

  const [rawProducts, setRawProducts] = useState(initialProducts || [])
  const [loading, setLoading] = useState(!initialProducts)
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState('all')
  const [inStockOnly, setInStockOnly] = useState(false)

  const meta = useMemo(() => {
    if (CATEGORY_DETAILS[rawSlug]) {
      return CATEGORY_DETAILS[rawSlug]
    }
    const formattedTitle = rawSlug ? rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1) : 'Category'
    return {
      title: formattedTitle,
      description: `Browse curated ${formattedTitle.toLowerCase()} products.`,
    }
  }, [rawSlug])

  const fetchCategoryProducts = useCallback(async () => {
    if (!rawSlug) return
    try {
      const data = await fetchCached(`/api/products?category=${encodeURIComponent(rawSlug)}&limit=50`)
      setRawProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load category products:', err)
      setRawProducts([])
    } finally {
      setLoading(false)
    }
  }, [rawSlug])

  useEffect(() => {
    if (!initialProducts) {
      fetchCategoryProducts()
    }
  }, [initialProducts, fetchCategoryProducts])

  // Extract available brands
  const availableBrands = useMemo(() => {
    const brands = new Set()
    rawProducts.forEach((p) => {
      if (p.brand && typeof p.brand === 'string') {
        brands.add(p.brand.trim())
      }
    })
    return Array.from(brands).sort()
  }, [rawProducts])

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...rawProducts]

    // Brand filter
    if (selectedBrand !== 'all') {
      result = result.filter((p) => p.brand?.toLowerCase() === selectedBrand.toLowerCase())
    }

    // Stock filter
    if (inStockOnly) {
      result = result.filter((p) => (p.stock ?? 0) > 0)
    }

    // Price range filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      if (!isNaN(min) && !isNaN(max)) {
        result = result.filter((p) => p.price >= min && p.price <= max)
      } else if (!isNaN(min)) {
        result = result.filter((p) => p.price >= min)
      }
    }

    // Sort results
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    } else {
      // Default featured order
      result.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1
        return (b.rating || 0) - (a.rating || 0)
      })
    }

    return result
  }, [rawProducts, selectedBrand, inStockOnly, priceRange, sortBy])

  const hasActiveFilters =
    selectedBrand !== 'all' ||
    priceRange !== 'all' ||
    inStockOnly ||
    sortBy !== 'featured'

  const handleResetFilters = () => {
    setSelectedBrand('all')
    setPriceRange('all')
    setInStockOnly(false)
    setSortBy('featured')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/categories" className="hover:text-black transition-colors">
            Categories
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">{meta.title}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {meta.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              {meta.description}
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium">
            Showing <strong className="text-gray-900 font-semibold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
          </div>
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="py-4 border-b border-gray-200 mb-8 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Brand Filter */}
            {availableBrands.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  aria-label="Filter by brand"
                  className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer transition-colors"
                >
                  <option value="all">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Price Filter */}
            <div className="relative">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                aria-label="Filter by price"
                className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer transition-colors"
              >
                <option value="all">All Prices</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-25000">₹10,000 – ₹25,000</option>
                <option value="25000-50000">₹25,000 – ₹50,000</option>
                <option value="50000-100000">₹50,000 – ₹1,00,000</option>
                <option value="100000-9999999">Above ₹1,00,000</option>
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* In Stock Checkbox */}
            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-medium cursor-pointer select-none pl-1">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-gray-500 hover:text-black underline underline-offset-2 ml-2 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Right: Sort Control */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="appearance-none pl-3 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer transition-colors"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-square rounded-xl skeleton-shimmer mb-4" />
                  <div className="h-3.5 rounded-full skeleton-shimmer w-1/3 mb-2.5" />
                  <div className="h-5 rounded-lg skeleton-shimmer w-3/4 mb-3" />
                  <div className="h-6 rounded-lg skeleton-shimmer w-1/2 mb-4" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <div className="h-9 rounded-xl skeleton-shimmer flex-1" />
                  <div className="h-9 rounded-xl skeleton-shimmer flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products match your criteria</h3>
            <p className="text-sm text-gray-500 mb-6">
              Try adjusting your price range or brand filter.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}