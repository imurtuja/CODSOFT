'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import OrdersSkeleton from '../../components/skeletons/OrdersSkeleton'
import AuthModal from '../../components/AuthModal'
import { toast } from '../../components/Toast'
import { ChevronRightIcon } from '../../components/CategoryIcons'

export default function OrdersPage() {
  // Hydrate orders from session storage
  const [orders, setOrders] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const rawUser = localStorage.getItem('currentUser') || localStorage.getItem('user')
      if (!rawUser) return []
      const user = JSON.parse(rawUser)
      const uid = user?._id || user?.id || user?.email
      if (uid) {
        const cached = sessionStorage.getItem(`evercart_orders_${uid}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      }
    } catch (e) {}
    return []
  })

  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const rawUser = localStorage.getItem('currentUser') || localStorage.getItem('user')
      if (!rawUser) return false
      const user = JSON.parse(rawUser)
      const uid = user?._id || user?.id || user?.email
      if (uid) {
        const cached = sessionStorage.getItem(`evercart_orders_${uid}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) return false
        }
      }
    } catch (e) {}
    return true
  })

  const [isAuth, setIsAuth] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const checkUserAuthentication = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false
      const rawUser = localStorage.getItem('currentUser') || localStorage.getItem('user')
      if (!rawUser) {
        setIsAuth(false)
        setLoading(false)
        setAuthModalOpen(true)
        return false
      }
      setIsAuth(true)
      return true
    } catch (error) {
      console.error('Authentication check failed:', error)
      setIsAuth(false)
      setLoading(false)
      return false
    }
  }, [])

  const fetchUserOrders = useCallback(async () => {
    try {
      if (!checkUserAuthentication()) {
        setLoading(false)
        return
      }

      const rawUser = typeof window !== 'undefined' ? (localStorage.getItem('currentUser') || localStorage.getItem('user')) : null
      let userData = null
      try {
        userData = rawUser ? JSON.parse(rawUser) : null
      } catch (e) {
        userData = null
      }

      if (!userData) {
        setOrders([])
        setLoading(false)
        return
      }

      const userId = userData._id || userData.id || userData.email
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const queryUrl = userId ? `/api/orders?userId=${encodeURIComponent(userId)}` : '/api/orders'
      const response = await fetch(queryUrl, { headers })
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        console.warn('Orders fetch warning:', errJson.error || response.statusText)
        return
      }

      const ordersData = await response.json().catch(() => [])
      if (Array.isArray(ordersData)) {
        setOrders(ordersData)
        try {
          if (typeof window !== 'undefined' && userId) {
            sessionStorage.setItem(`evercart_orders_${userId}`, JSON.stringify(ordersData))
          }
        } catch (e) {
          // Ignore cache write errors
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [checkUserAuthentication])

  useEffect(() => {
    checkUserAuthentication()
    fetchUserOrders()
  }, [checkUserAuthentication, fetchUserOrders])

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date not available'

      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Date not available'
    }
  }

  if (loading) {
    return <OrdersSkeleton />
  }

  if (!isAuth) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-gray-50/50">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-2xs">
            📦
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
            Sign In to View Your Orders
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            Track live shipment milestones, review payment receipts, and manage your purchase history securely.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="flex-1 h-11 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Sign In / Register
            </button>
            <Link
              href="/"
              className="flex-1 h-11 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center transition-colors"
            >
              Return to Store
            </Link>
          </div>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialTab="login"
          onAuthSuccess={() => {
            checkUserAuthentication()
            fetchUserOrders()
          }}
        />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200/90 p-8 text-center shadow-xs">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-500 border border-gray-200/60">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-1.5">No orders yet</h2>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              You haven&apos;t placed any orders yet. Explore our curated store to find flagship devices and premium tech gear.
            </p>
            <Link
              href="/products"
              className="w-full h-11 bg-black text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Explore Products</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Your Orders</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-200/80 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Your Orders</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Track shipments, review items, and manage your purchase history.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-gray-800 border border-gray-200/90 shadow-2xs self-start sm:self-auto">
            <span>{orders.length}</span>
            <span>Order{orders.length !== 1 ? 's' : ''} Placed</span>
          </span>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {(Array.isArray(orders) ? orders : []).map((order, index) => (
            <OrderCard
              key={order._id || order.orderId || index}
              order={order}
              formatPrice={formatPrice}
              formatDate={formatDate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderCard({ order, formatPrice, formatDate }) {
  const rawId = order._id || order.orderId || ''
  const displayId = order.orderId || (rawId ? `#${rawId.slice(-8)}` : '#Unknown')
  const orderStatus = (order.orderStatus || 'confirmed').toLowerCase()
  const totalAmount = order.totalAmount || order.total || 0
  const orderDate = order.createdAt || order.orderDate
  const shippingAddress = order.shippingAddress || order.shipping || {}
  const isCod = order.paymentMethod === 'cod' || order.payment?.method === 'cod'
  const items = Array.isArray(order.items) ? order.items : []
  const totalItemsCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0)

  const renderStatusBadge = () => {
    switch (orderStatus) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Delivered
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Shipped
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Processing
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800 border border-gray-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        )
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden">
      {/* Order Top Bar Header */}
      <div className="px-4 sm:px-6 py-3.5 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200/80 shadow-2xs">
            {displayId}
          </span>
          {renderStatusBadge()}
          <span className="text-gray-400 hidden sm:inline">•</span>
          <span className="text-gray-500 text-[11px] sm:text-xs">
            Placed on {formatDate(orderDate)}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isCod ? 'bg-amber-50 text-amber-900 border border-amber-200/80' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
          }`}>
            {isCod ? 'Cash on Delivery' : 'Paid'}
          </span>
        </div>

        {/* Order Total & Item Count */}
        <div className="text-right ml-auto">
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="text-gray-400 text-[11px]">Total:</span>
            <span className="font-black text-gray-900 text-sm sm:text-base">
              {formatPrice(totalAmount)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 block font-medium">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Order Items List */}
      <div className="p-4 sm:p-5 divide-y divide-gray-100">
        {items.map((item, itemIndex) => {
          const productId = item.product?._id || item.product || item._id
          const hasImage = Boolean(item.image)

          return (
            <div key={itemIndex} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3 sm:gap-4">
              {/* Product Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200/70 shrink-0 overflow-hidden flex items-center justify-center">
                {hasImage ? (
                  <Image
                    src={item.image}
                    alt={item.name || 'Product'}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {productId ? (
                      <Link
                        href={`/product/${productId}`}
                        className="font-bold text-xs sm:text-sm text-gray-900 hover:underline underline-offset-2 line-clamp-1 block"
                      >
                        {item.name || 'Product'}
                      </Link>
                    ) : (
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                        {item.name || 'Product'}
                      </h4>
                    )}
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                      {item.brand && <span>{item.brand}</span>}
                      {item.brand && <span>•</span>}
                      <span className="font-medium text-gray-700">Qty: {item.quantity || 1}</span>
                      <span>•</span>
                      <span>{formatPrice(item.price || 0)} each</span>
                    </div>
                  </div>

                  {/* Item Subtotal */}
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900 shrink-0">
                    {formatPrice((item.price || 0) * (item.quantity || 1))}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Card Footer: Shipping Info & View Details Button */}
      <div className="px-4 sm:px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-600 min-w-0">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="truncate text-[11px] sm:text-xs">
            <span className="font-bold text-gray-900">
              {shippingAddress.firstName ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}` : 'Recipient'}
            </span>
            {shippingAddress.city && (
              <span className="text-gray-500">
                {' '}• {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </span>
            )}
          </p>
        </div>

        <Link
          href={`/order/${order._id || order.orderId}`}
          className="h-9 px-4 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 active:scale-95 transition-all shadow-2xs self-end sm:self-auto shrink-0"
        >
          <span>View Details</span>
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}