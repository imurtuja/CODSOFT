'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Loading from '../../components/Loading'
import ProductCard from '../../components/ProductCard'

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])

  const categories = [
    { name: 'Electronics', href: '/category/electronics', icon: '📱' },
    { name: 'Laptops', href: '/category/laptops', icon: '💻' },
    { name: 'Gaming', href: '/category/gaming', icon: '🎮' },
    { name: 'Audio', href: '/category/audio', icon: '🎧' },
    { name: 'Cameras', href: '/category/cameras', icon: '📷' },
    { name: 'Accessories', href: '/category/accessories', icon: '🔌' },
  ]

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${window.location.origin}/api/products?featured=true&limit=8`)
      const data = await response.json()
      const products = data.products || []
      const featured = products.filter(product => product.isFeatured === true)
      setFeaturedProducts(featured)
    } catch (error) {
      console.error('Error fetching featured products:', error)
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Categories</h1>
            <p className="text-xl text-gray-600">Browse products by category</p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow border border-gray-200"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-lg text-gray-600">Handpicked products just for you</p>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No featured products available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              View All Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}