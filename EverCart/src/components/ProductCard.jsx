import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, memo } from 'react'

function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)
  const [showViewCart, setShowViewCart] = useState(false)
  
  const addToCart = useCallback((product) => {
    const user = localStorage.getItem('currentUser')
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!product || !product._id && !product.id) {
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const productId = product._id || product.id
    const existingItem = cart.find(item => item.id === productId)
    
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: productId,
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        image: product.images?.[0] || product.image || '',
        quantity: 1,
        brand: product.brand || 'Unknown Brand'
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    setShowViewCart(true)
  }, [])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    }
    return 0
  }

  const discount = calculateDiscount()
  const imageUrl = product.images?.[0] || product.image || ''
  
  const isBadUrl = (url) => {
    if (!url) return true
    return url.includes('i.dell.com') || url.includes('404')
  }

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <Link href={`/product/${product._id || product.id}`}>
          <div className="aspect-square w-full">
            {imageUrl && !imageError && !isBadUrl(imageUrl) ? (
              <Image
                src={imageUrl}
                alt={product.name}
                width={300}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl text-gray-400 mb-1 sm:mb-2">📦</div>
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">No Image</div>
                </div>
              </div>
            )}
          </div>
        </Link>
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {discount}% OFF
          </div>
        )}
        
        {/* Stock Badge */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            product.stock > 0 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-3 sm:p-5 flex flex-col flex-grow">
        {/* Brand */}
        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
          {product.brand}
        </p>
        
        {/* Product Name */}
        <Link href={`/product/${product._id || product.id}`}>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2 min-h-[2.5rem] sm:min-h-[1.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mb-3 min-h-[1.5rem]">
          {product.rating && (
            <div className="flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600 font-medium">({product.rating})</span>
            </div>
          )}
        </div>

        {/* Price Section */}
        <div className="mb-3 sm:mb-4 min-h-[3.5rem] sm:min-h-[4rem]">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="min-h-[1.25rem]">
            {discount > 0 && (
              <p className="text-xs sm:text-sm text-green-600 font-medium">
                You save {formatPrice(product.originalPrice - product.price)}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex gap-2 mt-auto">
          {showViewCart ? (
            <Link
              href="/cart"
              className="flex-1 py-2.5 px-4 bg-green-600 text-white rounded-lg font-medium text-sm text-center hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
            >
              View Cart
            </Link>
          ) : (
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                product.stock > 0 
                  ? 'bg-black text-white hover:bg-gray-800 hover:shadow-md' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          )}
          <Link
            href={`/product/${product._id || product.id}`}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm text-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)