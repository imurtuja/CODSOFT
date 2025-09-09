'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Loading from '../../../components/Loading'

export default function OrderDetailsPage() {
  const params = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadOrder()
    }
  }, [params.id, loadOrder])

  const loadOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        console.log('Order data received:', data)
        setOrder(data)
      } else {
        console.error('Error fetching order:', data.error)
        setOrder(null)
      }
    } catch (error) {
      console.error('Error loading order:', error)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const formatPrice = (price) => {
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
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }
      
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Date not available'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderTrackingSteps = (order) => {
    const status = order.orderStatus || 'confirmed'
    const orderDate = order.createdAt ? formatDate(order.createdAt) : order.orderDate ? formatDate(order.orderDate) : 'Date not available'
    
    const steps = [
      {
        title: 'Order Placed',
        description: 'Your order has been received',
        date: orderDate,
        completed: true,
        current: false
      },
      {
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and payment verified',
        completed: status === 'confirmed' || status === 'processing' || status === 'shipped' || status === 'delivered',
        current: status === 'confirmed'
      },
      {
        title: 'Processing',
        description: 'Your order is being prepared for shipment',
        completed: status === 'processing' || status === 'shipped' || status === 'delivered',
        current: status === 'processing'
      },
      {
        title: 'Shipped',
        description: 'Your order is on the way to you',
        completed: status === 'shipped' || status === 'delivered',
        current: status === 'shipped'
      },
      {
        title: 'Delivered',
        description: 'Your order has been delivered successfully',
        completed: status === 'delivered',
        current: status === 'delivered'
      }
    ]

    // Handle cancelled orders
    if (status === 'cancelled') {
      return [
        {
          title: 'Order Placed',
          description: 'Your order has been received',
          date: orderDate,
          completed: true,
          current: false
        },
        {
          title: 'Order Cancelled',
          description: 'Your order has been cancelled',
          completed: true,
          current: true
        }
      ]
    }

    return steps
  }


  if (loading) {
    return <Loading />
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
          <Link href="/orders" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-xs sm:text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/orders" className="hover:text-gray-900">Orders</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Order Details</span>
          </nav>
          
          {/* Mobile Layout: Stack order info and status */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order._id?.slice(-8) || order.orderId}
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus || 'confirmed'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Placed on {order.createdAt ? formatDate(order.createdAt) : order.orderDate ? formatDate(order.orderDate) : 'Date not available'}
            </p>
          </div>

          {/* Desktop Layout: Original layout */}
          <div className="hidden sm:flex sm:justify-between sm:items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order._id?.slice(-8) || order.orderId}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {order.createdAt ? formatDate(order.createdAt) : order.orderDate ? formatDate(order.orderDate) : 'Date not available'}
              </p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus || 'confirmed'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Items</h2>
              <div className="space-y-3 sm:space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-400 text-lg sm:text-2xl">📦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{item.brand}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Tracking - Mobile Optimized */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Progress</h2>
              <div className="relative">
                {getOrderTrackingSteps(order).map((step, index) => (
                  <div key={index} className="relative flex items-start pb-6 sm:pb-8 last:pb-0">
                    {/* Timeline line */}
                    {index < getOrderTrackingSteps(order).length - 1 && (
                      <div className={`absolute left-3 sm:left-4 top-6 sm:top-8 w-0.5 h-12 sm:h-16 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    )}
                    
                    {/* Status indicator */}
                    <div className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : step.current ? 'bg-blue-500' : 'bg-gray-200'}`}>
                      {step.completed ? (
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : step.current ? (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                      ) : (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="ml-4 sm:ml-6 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <h3 className={`text-sm sm:text-lg font-semibold ${step.completed || step.current ? 'text-gray-900' : 'text-gray-500'}`}>
                          {step.title}
                        </h3>
                        {step.date && (
                          <span className="text-xs sm:text-sm text-gray-500">{step.date}</span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm mt-1 ${step.completed || step.current ? 'text-gray-600' : 'text-gray-400'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address - Mobile Optimized */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Shipping Address</h2>
              <div className="text-sm sm:text-base text-gray-700 space-y-1">
                <p className="font-medium">
                  {order.shippingAddress?.firstName || order.shipping?.firstName || order.shippingAddress?.name || 'Name not provided'} {order.shippingAddress?.lastName || order.shipping?.lastName || ''}
                </p>
                <p>{order.shippingAddress?.address || order.shipping?.address || 'Address not provided'}</p>
                <p>
                  {order.shippingAddress?.city || order.shipping?.city || 'City'}, {order.shippingAddress?.state || order.shipping?.state || 'State'} {order.shippingAddress?.zipCode || order.shipping?.zipCode || 'ZIP'}
                </p>
                <p>Phone: {order.shippingAddress?.phone || order.shipping?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Order Summary - Mobile First */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Order Summary</h2>
              
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Subtotal ({order.items.length} items)</span>
                  <span className="font-medium">{formatPrice(order.subtotal || order.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">{formatPrice(order.totalAmount || order.total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Order Information</h3>
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div>
                    <span className="text-gray-600 text-xs sm:text-sm">Order ID</span>
                    <p className="text-xs sm:text-sm font-mono text-gray-900 break-all">{order._id || order.orderId || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-xs sm:text-sm">Order Date</span>
                    <p className="text-xs sm:text-sm text-gray-900">{order.createdAt ? formatDate(order.createdAt) : order.orderDate ? formatDate(order.orderDate) : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 sm:pt-4">
                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Payment Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 text-xs sm:text-sm">Method</span>
                    <p className="text-xs sm:text-sm text-gray-900 capitalize">{order.paymentMethod || order.paymentDetails?.method || 'Not specified'}</p>
                  </div>
                  {order.paymentDetails?.paymentId && (
                    <div>
                      <span className="text-gray-600 text-xs sm:text-sm">Transaction ID</span>
                      <p className="text-xs font-mono text-gray-900 break-all">{order.paymentDetails.paymentId}</p>
                    </div>
                  )}
                  {order.paymentDetails?.razorpayOrderId && (
                    <div>
                      <span className="text-gray-600 text-xs sm:text-sm">Razorpay Order ID</span>
                      <p className="text-xs font-mono text-gray-900 break-all">{order.paymentDetails.razorpayOrderId}</p>
                    </div>
                  )}
                  {order.paymentDetails?.status && (
                    <div>
                      <span className="text-gray-600 text-xs sm:text-sm">Payment Status</span>
                      <p className={`text-xs sm:text-sm font-medium ${order.paymentDetails.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.paymentDetails.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                <Link
                  href="/orders"
                  className="w-full bg-black text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center block text-sm sm:text-base"
                >
                  Back to Orders
                </Link>
                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block text-sm sm:text-base"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}