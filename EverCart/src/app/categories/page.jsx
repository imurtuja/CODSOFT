'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from '../../components/ProductCard'
import { getCategoryIcon, ChevronRightIcon } from '../../components/CategoryIcons'

const CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    href: '/category/electronics',
    badge: 'Smartphones & Tech',
    desc: 'Flagship phones, smartwatches, and tablets.',
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    href: '/category/laptops',
    badge: 'Pro Performance',
    desc: 'MacBooks, ultra-portables, and creator rigs.',
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    href: '/category/gaming',
    badge: 'Next-Gen Gear',
    desc: 'Consoles, handhelds, and pro controllers.',
  },
  {
    name: 'Audio',
    slug: 'audio',
    href: '/category/audio',
    badge: 'Studio Sound',
    desc: 'Noise-canceling headphones and Hi-Fi speakers.',
  },
  {
    name: 'Cameras',
    slug: 'cameras',
    href: '/category/cameras',
    badge: 'Pro Visuals',
    desc: 'Mirrorless cameras, gimbals, and 4K drones.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    href: '/category/accessories',
    badge: 'Power & Workstation',
    desc: 'Ergonomic mice, mechanical keyboards, and docks.',
  },
]

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=8')
      const data = await response.json()
      const products = data.products || []
      const featured = products.filter((product) => product.isFeatured === true)
      setFeaturedProducts(featured)
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setLoading(false)
    }
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
          <span className="text-gray-900 font-medium">Categories</span>
        </nav>

        {/* Page Header */}
        <div className="pb-6 border-b border-gray-200 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            All Categories
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Browse our catalog by department to discover flagship devices, gaming rigs, and workstation gear.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-10">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:border-gray-900 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white transition-all">
                    {getCategoryIcon(cat.slug, 'w-5 h-5')}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    {cat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-black mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-900">
                <span>View Products</span>
                <ChevronRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Section */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Highlights</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Top-rated items across all departments</p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-black hover:underline underline-offset-4"
            >
              <span>View all products</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse flex flex-col justify-between"
                >
                  <div className="w-full aspect-square bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-9 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}