'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback, memo } from 'react'
import { addToCart as saveProductToCart, isItemInCart } from '../utils/cartManager'
import { toast } from './Toast'

function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  
  const checkCartState = useCallback(() => {
    const pid = product?._id || product?.id
    if (pid) {
      setIsInCart(isItemInCart(pid))
    }
  }, [product?._id, product?.id])

  useEffect(() => {
    checkCartState()
    window.addEventListener('cartUpdated', checkCartState)
    return () => window.removeEventListener('cartUpdated', checkCartState)
  }, [checkCartState])
  
  const addToCart = useCallback((e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!product || (!product._id && !product.id) || product.stock <= 0) {
      return
    }

    setAdding(true)
    setJustAdded(true)
    saveProductToCart(product, 1)
    setIsInCart(true)
    
    const shortName = product.name?.length > 22 ? `${product.name.slice(0, 22)}…` : (product.name || 'Item')
    toast.success(`Added "${shortName}" to cart!`)

    setTimeout(() => setAdding(false), 250)
    setTimeout(() => setJustAdded(false), 1400)
  }, [product])

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
    if (!url || typeof url !== 'string') return true
    return url.includes('i.dell.com') || 
           url.includes('404') || 
           url.includes('store.google.com') || 
           url.includes('store.dji.com/pocket')
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-200/80 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 group flex flex-col h-full">
      {/* Image Section */}
      <div className="relative overflow-hidden">
        <Link href={`/product/${product._id || product.id}`} prefetch={true}>
          <div className="aspect-square w-full bg-gray-50/50">
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
              <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl text-gray-400 mb-1 sm:mb-2">📦</div>
                  <div className="text-xs text-gray-500 font-medium">No Image</div>
                </div>
              </div>
            )}
          </div>
        </Link>
        
        {/* Stock Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full backdrop-blur-sm shadow-sm ${
            product.stock > 0 
              ? 'bg-emerald-600/90 text-white' 
              : 'bg-rose-600/90 text-white'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow">
        {/* Brand */}
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
          {product.brand}
        </p>
        
        {/* Product Name */}
        <Link href={`/product/${product._id || product.id}`} prefetch={true}>
          <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug line-clamp-2 hover:text-black transition-colors mb-1.5">
            {product.name}
          </h3>
        </Link>

        {/* Rating Badge */}
        {product.rating ? (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-900">
              <span className="text-amber-500 text-xs">★</span>
              <span>{product.rating}</span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Ratings</span>
          </div>
        ) : (
          <div className="h-5 mb-2" />
        )}

        {/* Price Section */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
              {formatPrice(product.price)}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="text-[11px] font-extrabold text-emerald-600">
                  {discount}% off
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons - Always at bottom */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {isInCart && !justAdded ? (
            <Link
              href="/cart"
              prefetch={true}
              className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm whitespace-nowrap active:scale-95"
            >
              <span>✓</span>
              <span>In Cart</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              disabled={product.stock <= 0 || adding}
              className={`flex-1 h-9 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 whitespace-nowrap active:scale-95 cursor-pointer ${
                justAdded
                  ? 'bg-emerald-600 text-white scale-[1.02]'
                  : 'bg-black hover:bg-neutral-800 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <span className="text-sm">✓</span>
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}
          <Link
            href={`/product/${product._id || product.id}`}
            prefetch={true}
            className="h-9 px-3 bg-gray-50 text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-200 rounded-lg font-semibold text-xs flex items-center justify-center transition-all whitespace-nowrap active:scale-95"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCard)