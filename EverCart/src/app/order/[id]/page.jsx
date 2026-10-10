'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import OrderDetailsSkeleton from '../../../components/skeletons/OrderDetailsSkeleton'
import { toast } from '../../../components/Toast'
import { ChevronRightIcon, ChevronLeftIcon } from '../../../components/CategoryIcons'
import { fetchCached } from '../../../utils/apiCache'
import NotFoundView from '../../../components/NotFoundView'

export default function OrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'not_found'
  const [copied, setCopied] = useState(false)

  const loadOrder = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        setOrder(null)
        setStatus('not_found')
        return
      }

      setStatus('loading')
      const data = await fetchCached(`/api/orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 15000)
      if (data && (data._id || data.orderId)) {
        setOrder(data)
        setStatus('success')
      } else {
        setOrder(null)
        setStatus('not_found')
      }
    } catch (error) {
      console.error('Error loading order:', error)
      setOrder(null)
      setStatus('not_found')
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      loadOrder()
    }
  }, [params.id, loadOrder])

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    try {
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

  const copyToClipboard = (text, label = 'Copied') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copied!`)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'idle') {
    return <div className="min-h-[calc(100vh-64px)] bg-white" />
  }

  if (status === 'loading') {
    return <OrderDetailsSkeleton />
  }

  if (status === 'not_found' || !order) {
    return <NotFoundView />
  }

  const rawId = order._id || order.orderId || ''
  const displayId = order.orderId || (rawId ? `#${rawId.slice(-8)}` : '#Unknown')
  const fullOrderId = order.orderId || order._id || ''
  const isCod = order.paymentMethod === 'cod' || order.payment?.method === 'cod'
  const rawStatus = (order.orderStatus || '').toLowerCase()
  const isPaidOrCod = isCod || order.paymentStatus === 'completed' || order.payment?.status === 'completed' || order.paymentMethod === 'razorpay'
  const orderStatus = (rawStatus === 'pending' && isPaidOrCod) ? 'confirmed' : (rawStatus || 'confirmed')
  const totalAmount = order.totalAmount || order.total || 0
  const subtotal = order.subtotal || totalAmount
  const orderDate = order.createdAt || order.orderDate
  const shippingAddress = order.shippingAddress || order.shipping || {}
  const items = Array.isArray(order.items) ? order.items : []

  // Calculate order progress steps
  let currentLevel = 2 // Default: confirmed for placed orders
  if (orderStatus === 'delivered') {
    currentLevel = 4
  } else if (orderStatus === 'shipped') {
    currentLevel = 3
  } else if (orderStatus === 'cancelled') {
    currentLevel = 0
  } else if (
    orderStatus === 'confirmed' ||
    orderStatus === 'processing' ||
    isPaidOrCod
  ) {
    currentLevel = 2
  } else if (orderStatus === 'pending') {
    currentLevel = 1
  }

  const trackingSteps = [
    { level: 1, title: 'Order Placed', desc: 'Received in system' },
    { level: 2, title: 'Confirmed', desc: isCod ? 'COD Verified' : 'Payment Verified' },
    { level: 3, title: 'Dispatched', desc: 'Handed to courier' },
    { level: 4, title: 'Delivered', desc: 'Doorstep handover' },
  ]

  const renderStatusBadge = () => {
    switch (orderStatus) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Delivered
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Shipped
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Processing
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Cancelled
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Confirmed
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-6 sm:py-8">
      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="text-gray-300">/</span>
          <Link href="/orders" className="hover:text-black transition-colors">Orders</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Order Details</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-200/80 mb-6">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Order</span> <span className="font-mono">{displayId}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(fullOrderId, 'Order ID')}
                className="p-1 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                title="Copy Order Reference ID"
                aria-label="Copy Order ID"
              >
                {copied ? (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Copied ✓</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </h1>
            {renderStatusBadge()}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isCod ? 'bg-amber-50 text-amber-900 border border-amber-200/80' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
            }`}>
              {isCod ? 'Cash on Delivery' : 'Paid'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/orders"
              prefetch={true}
              className="h-9 px-3.5 bg-white text-gray-700 hover:text-black border border-gray-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition-all shadow-2xs"
            >
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </Link>
          </div>
        </div>

        {/* Content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Order details column */}
          <div className="lg:col-span-8 space-y-4">
            {/* Shipment progress tracker */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5 sm:p-6">
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-gray-900">
                    Shipment Progress
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  {currentLevel >= 4
                    ? 'Delivered'
                    : currentLevel === 3
                    ? 'Dispatched'
                    : 'Order Confirmed'}
                </span>
              </div>

              {/* Stepper progress bar */}
              <div className="relative">
                <div className="grid grid-cols-4 gap-2 sm:gap-3 relative">
                  {trackingSteps.map((step, idx) => {
                    const isDone = currentLevel >= step.level
                    const isNextDone = currentLevel > step.level
                    const isCurrent = currentLevel === step.level

                    return (
                      <div key={step.level} className="relative flex flex-col items-center">
                        {/* Step connector */}
                        {idx < trackingSteps.length - 1 && (
                          <div className="absolute top-[16px] sm:top-[18px] left-1/2 w-full h-1 -translate-y-1/2 z-0">
                            {/* Track line */}
                            <div className="w-full h-full bg-gray-200 overflow-hidden">
                              {/* Completed line */}
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isNextDone ? 'w-full bg-emerald-500' : 'w-0 bg-transparent'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Step indicator */}
                        <div
                          className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all shadow-2xs ${
                            isDone
                              ? 'bg-emerald-500 text-white ring-4 ring-white'
                              : isCurrent
                              ? 'bg-black text-white ring-4 ring-white animate-pulse'
                              : 'bg-white text-gray-400 border-2 border-gray-200 ring-4 ring-white'
                          }`}
                        >
                          {isDone ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step.level
                          )}
                        </div>

                        {/* Step label */}
                        <div
                          className={`w-full mt-3 p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200/90 shadow-2xs'
                              : isCurrent
                              ? 'bg-gray-50 border-gray-300'
                              : 'bg-gray-50/40 border-gray-100 opacity-60'
                          }`}
                        >
                          <h4 className={`text-xs font-bold ${isDone ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug hidden sm:block">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Ordered items */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
              <div className="px-4 sm:px-5 py-3.5 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between text-xs">
                <h3 className="font-extrabold text-gray-900">
                  Ordered Items ({items.length})
                </h3>
                <span className="text-gray-400 font-medium">Standard Delivery</span>
              </div>

              <div className="p-4 sm:p-5 divide-y divide-gray-100">
                {items.map((item, index) => {
                  const productId = item.product?._id || item.product || item._id
                  const hasImage = Boolean(item.image)

                  return (
                    <div key={index} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5 sm:gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200/70 shrink-0 overflow-hidden flex items-center justify-center">
                        {hasImage ? (
                          <Image
                            src={item.image}
                            alt={item.name || 'Product'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>

                      {/* Product Information */}
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

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">
                              {formatPrice((item.price || 0) * (item.quantity || 1))}
                            </span>
                            {productId && (
                              <Link
                                href={`/product/${productId}`}
                                className="text-[10px] font-semibold text-gray-500 hover:text-black underline underline-offset-2 mt-1 inline-block"
                              >
                                Buy Again
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-4 sm:p-5">
              <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 pb-3 border-b border-gray-100 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Delivery & Shipping Address</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Recipient
                  </span>
                  <p className="font-bold text-gray-900 text-sm">
                    {shippingAddress.firstName ? `${shippingAddress.firstName} ${shippingAddress.lastName || ''}` : 'Recipient'}
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    {shippingAddress.address || 'Address not available'}
                  </p>
                  <p className="mt-0.5">
                    {shippingAddress.city ? `${shippingAddress.city}, ` : ''}
                    {shippingAddress.state ? `${shippingAddress.state} ` : ''}
                    {shippingAddress.zipCode || ''}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                    Contact & Courier
                  </span>
                  <p className="font-medium text-gray-900">
                    Phone: {shippingAddress.phone || 'Not provided'}
                  </p>
                  {shippingAddress.email && (
                    <p className="text-gray-500 mt-0.5">
                      Email: {shippingAddress.email}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200/70 rounded-lg text-[11px] text-gray-700 font-medium">
                    <span>🚚</span>
                    <span>Premium Tracked National Courier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary column */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            {/* Order summary */}
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs p-5">
              <h3 className="font-extrabold text-sm text-gray-900 pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="py-3.5 space-y-2.5 text-xs text-gray-600 border-b border-gray-100">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes</span>
                  <span className="text-gray-500">Included in price</span>
                </div>
              </div>

              {/* Total Due */}
              <div className="py-3.5 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900">Total Paid</span>
                  <p className="text-[10px] text-gray-400">All taxes included</p>
                </div>
                <span className="text-xl font-black text-gray-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              {/* Payment Method Details */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">Payment Mode</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCod ? 'bg-amber-50 text-amber-900 border border-amber-200/80' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  }`}>
                    {isCod ? 'Cash on Delivery' : 'Paid'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[11px]">Placed At</span>
                  <span className="font-medium text-gray-900 text-[11px]">
                    {formatDate(orderDate)}
                  </span>
                </div>

                {order.payment?.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[11px]">Transaction ID</span>
                    <span className="font-mono text-[10px] text-gray-700 truncate max-w-[140px]">
                      {order.payment.transactionId}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-3 border-t border-gray-100 space-y-2">
                <Link
                  href="/orders"
                  prefetch={true}
                  className="w-full h-10 bg-black text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-800 active:scale-95 transition-all shadow-xs"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                  <span>View All Orders</span>
                </Link>

                <Link
                  href="/products"
                  prefetch={true}
                  className="w-full h-10 bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center active:scale-95 transition-all"
                >
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}