'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Loading from '../../components/Loading'
import ProductCard from '../../components/ProductCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [currentPage, sortBy, priceRange, fetchProducts])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy
      })
      
      // Add price filter to API call
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number)
        if (max) {
          params.append('minPrice', min.toString())
          params.append('maxPrice', max.toString())
        } else {
          params.append('minPrice', min.toString())
        }
      }
      
      const response = await fetch(`/api/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setProducts(data.products || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setTotalPages(1)
      alert('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Products</h1>
            <p className="text-xl text-gray-600">Discover our complete collection</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-4 sm:py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Mobile: Stack filters vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Sort by Rating</option>
              </select>
              
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <option value="all">All Prices</option>
                <option value="0-10000">Under ₹10,000</option>
                <option value="10000-25000">₹10,000 - ₹25,000</option>
                <option value="25000-50000">₹25,000 - ₹50,000</option>
                <option value="50000-100000">₹50,000 - ₹1,00,000</option>
                <option value="100000">Above ₹1,00,000</option>
              </select>
            </div>
            
            <button
              onClick={() => fetchProducts()}
              className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8 sm:mt-12">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 sm:px-4 rounded-lg text-sm sm:text-base ${
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
            <div className="text-center py-8 sm:py-12">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 px-4">Try adjusting your filters or browse our categories</p>
              <Link 
                href="/categories" 
                className="bg-black text-white px-4 py-2 sm:px-6 rounded-lg hover:bg-gray-800 text-sm sm:text-base"
              >
                Browse Categories
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}