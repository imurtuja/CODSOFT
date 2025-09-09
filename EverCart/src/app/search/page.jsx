'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Loading from '../../components/Loading'
import ProductCard from '../../components/ProductCard'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState('all')

  useEffect(() => {
    const query = searchParams.get('q')
    if (query) {
      setSearchQuery(query)
      fetchProducts(query)
    } else {
      setLoading(false)
    }
  }, [searchParams, currentPage, sortBy, priceRange])

  const fetchProducts = useCallback(async (query) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&page=${currentPage}&limit=12`)
      const data = await response.json()
      
      let filteredProducts = [...data.products]
      
      // Apply price filter
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number)
        if (max) {
          filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max)
        } else {
          filteredProducts = filteredProducts.filter(p => p.price >= min)
        }
      }
      
      // Apply sorting
      if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price)
      } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price)
      } else if (sortBy === 'rating') {
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      } else if (sortBy === 'name') {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name))
      }
      
      setProducts(filteredProducts)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, sortBy, priceRange])

  if (loading) return <Loading />

  if (!searchQuery) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Products</h2>
            <p className="text-gray-600 mb-8">Enter a search term to find products</p>
            <Link 
              href="/" 
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Search Results</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Search Results for &ldquo;{searchQuery}&rdquo;
          </h1>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 my-6">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Sort by Rating</option>
            </select>
            
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Prices</option>
              <option value="0-10000">Under ₹10,000</option>
              <option value="10000-25000">₹10,000 - ₹25,000</option>
              <option value="25000-50000">₹25,000 - ₹50,000</option>
              <option value="50000-100000">₹50,000 - ₹1,00,000</option>
              <option value="100000">Above ₹1,00,000</option>
            </select>
          </div>
          
          <p className="text-gray-600 mt-2">
            {products.length > 0 ? `Found ${products.length} products` : 'No products found'}
          </p>
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-8">
              Try searching with different keywords or browse our categories
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/categories" 
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                Browse Categories
              </Link>
              <Link 
                href="/" 
                className="bg-gray-200 text-black px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Go Home
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
    <Suspense fallback={<Loading />}>
      <SearchPageContent />
    </Suspense>
  )
}