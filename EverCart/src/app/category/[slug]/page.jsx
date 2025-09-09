'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Loading from '../../../components/Loading'
import ProductCard from '../../../components/ProductCard'

export default function CategoryPage() {
  const params = useParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('name')
  const [priceRange, setPriceRange] = useState('all')

  useEffect(() => {
    fetchProducts()
  }, [params.slug, sortBy, priceRange, fetchProducts])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?category=${params.slug}`)
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
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }, [params.slug, sortBy, priceRange])

  const getCategoryName = (slug) => {
    return slug.charAt(0).toUpperCase() + slug.slice(1)
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="hover:text-gray-900">Categories</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{getCategoryName(params.slug)}</span>
          </nav>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getCategoryName(params.slug)}</h1>
          <p className="text-xl text-gray-600">{products.length} products found</p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
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
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-8">No products available in this category</p>
              <Link 
                href="/categories" 
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                Browse Other Categories
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}