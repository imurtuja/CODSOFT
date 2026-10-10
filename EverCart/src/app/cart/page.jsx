'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getLocalCart,
  updateCartQuantity,
  removeFromCart as removeCartItem,
  clearCart as clearAllCartItems,
} from '../../utils/cartManager'
import { toast } from '../../components/Toast'
import { ChevronRightIcon } from '../../components/CategoryIcons'
import CartSkeleton from '../../components/skeletons/CartSkeleton'

const QUICK_CATEGORIES = [
  { name: 'Electronics', href: '/category/electronics' },
  { name: 'Laptops', href: '/category/laptops' },
  { name: 'Gaming', href: '/category/gaming' },
  { name: 'Audio', href: '/category/audio' },
  { name: 'Cameras', href: '/category/cameras' },
  { name: 'Accessories', href: '/category/accessories' },
]

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState({})

  const loadCart = useCallback(() => {
    try {
      const cart = getLocalCart()
      setCartItems(cart)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
      toast.error('Error loading cart. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCart()
    router.prefetch('/checkout')
    window.addEventListener('cartUpdated', loadCart)
    return () => window.removeEventListener('cartUpdated', loadCart)
  }, [loadCart, router])

  const updateQuantity = (id, newQuantity) => {
    try {
      if (newQuantity <= 0) {
        removeItem(id)
        return
      }

      if (newQuantity > 99) {
        toast.warning('Maximum quantity is 99 per item')
        return
      }

      const updatedCart = updateCartQuantity(id, newQuantity)
      setCartItems(updatedCart)
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity. Please try again.')
    }
  }

  const removeItem = (id) => {
    try {
      const updatedCart = removeCartItem(id)
      setCartItems(updatedCart)
      toast.info('Item removed from cart')
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item. Please try again.')
    }
  }

  const handleClearCart = () => {
    if (cartItems.length === 0) return
    try {
      clearAllCartItems()
      setCartItems([])
      toast.info('Your cart has been cleared')
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Failed to clear cart')
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalOriginalPrice = () => {
    return cartItems.reduce((total, item) => {
      const original = item.originalPrice && item.originalPrice > item.price ? item.originalPrice : item.price
      return total + (original * item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0)
  }

  const totalItems = getTotalItems()
  const subtotal = getTotalPrice()
  const originalTotal = getTotalOriginalPrice()
  const totalSavings = originalTotal > subtotal ? originalTotal - subtotal : 0

  if (loading) {
    return <CartSkeleton />
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-black transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Cart</span>
          </nav>

          {/* Empty Cart Card */}
          <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200/90 shadow-sm p-8 sm:p-10 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Your Cart is Empty
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
              Looks like you haven&apos;t added any technology or gear yet. Explore our curated catalog to discover top-rated gadgets and flagship deals.
            </p>

            <div className="space-y-2.5">
              <Link
                href="/products"
                className="w-full h-11 bg-black text-white rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Explore All Products</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/categories"
                className="w-full h-11 bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Browse Departments</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Quick Department Shortcuts */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Popular Departments
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {QUICK_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
          <span className="text-gray-900 font-medium">Cart</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Shopping Cart
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-black text-white text-xs font-bold shadow-xs">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              Review your items, manage quantities, and proceed to secure checkout.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleClearCart}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Cart</span>
            </button>
          </div>
        </div>

        {/* Main Cart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Cart Items ({cartItems.length})
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Free Nationwide Delivery
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const itemDiscount =
                    item.originalPrice && item.originalPrice > item.price
                      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                      : 0

                  return (
                    <div key={item.id} className="p-4 sm:p-6 transition-colors hover:bg-gray-50/40">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                        {/* Thumbnail */}
                        <Link
                          href={`/product/${item.id}`}
                          className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          {item.image && !failedImages[item.id] ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              unoptimized
                              className="object-contain"
                              onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {item.brand && (
                              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                {item.brand}
                              </p>
                            )}

                            <Link
                              href={`/product/${item.id}`}
                              className="text-base sm:text-lg font-bold text-gray-900 hover:text-black line-clamp-2 transition-colors"
                            >
                              {item.name}
                            </Link>

                            {/* Unit Price & Discount */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatPrice(item.price)}
                              </span>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    {formatPrice(item.originalPrice)}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {itemDiscount}% off
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>In Stock &middot; Ready for Dispatch</span>
                            </div>
                          </div>

                          {/* Controls Row */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <div className="inline-flex items-center border border-gray-200 rounded-xl bg-gray-50/80 p-0.5 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  aria-label="Decrease quantity"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-black hover:bg-white active:scale-90 transition-all font-semibold disabled:opacity-40"
                                >
                                  &minus;
                                </button>
                                <span className="w-9 text-center font-bold text-xs sm:text-sm text-gray-900 select-none">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                  disabled={item.quantity >= 99}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-700 hover:text-black hover:bg-white active:scale-90 transition-all font-semibold disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-600 active:scale-95 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Remove</span>
                              </button>
                            </div>

                            {/* Line Total */}
                            <div className="text-right">
                              <span className="text-xs text-gray-400 block sm:hidden">Total:</span>
                              <span className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>100% Genuine Products guaranteed with manufacturer warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Trust */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-6">
              <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">
                Order Summary
              </h2>

              <div className="space-y-3.5 py-4 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-1">
                    <span>Estimated Shipping</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Standard</span>
                  </span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                <div className="flex justify-between items-center text-gray-600">
                  <span>Estimated Taxes</span>
                  <span className="font-medium text-gray-500">Included in price</span>
                </div>

                {totalSavings > 0 && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100/80 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1">
                      <span>🏷️</span>
                      <span>Total Savings</span>
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      -{formatPrice(totalSavings)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-4 border-t border-gray-100 mb-6">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-gray-900">Total Due</span>
                    <p className="text-[11px] text-gray-400">Inclusive of all applicable taxes</p>
                  </div>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div>
                <Link
                  href="/checkout"
                  prefetch={true}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('isDirectCheckout')
                      sessionStorage.removeItem('buyNowItem')
                    }
                  }}
                  className="w-full h-12 bg-black text-white rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Trust & Guarantee Box */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs space-y-3.5 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">256-Bit SSL Encrypted</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Secure payment gateway via Razorpay, UPI & Cards.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">7-Day Return Guarantee</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Hassle-free replacement or quick refund policy.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Free Express Delivery</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Fast, tracked dispatch across all major Indian cities.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}