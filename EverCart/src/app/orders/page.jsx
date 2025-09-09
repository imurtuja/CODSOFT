'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Loading from '../../components/Loading'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserAuthentication()
    fetchUserOrders()
  }, [checkUserAuthentication, fetchUserOrders])

  const checkUserAuthentication = useCallback(() => {
    try {
      const userData = localStorage.getItem('currentUser')
      if (!userData) {
        alert('Please login to view your orders')
        window.location.href = '/login'
        return false
      }
      return true
    } catch (error) {
      console.error('Authentication check failed:', error)
      return false
    }
  }, [])

  const fetchUserOrders = useCallback(async () => {
    try {
      setLoading(true)
      
      if (!checkUserAuthentication()) return
      
      const userData = JSON.parse(localStorage.getItem('currentUser'))
      const userId = userData._id || userData.email
      
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      
      const ordersData = await response.json()
      
      if (ordersData.error) {
        throw new Error(ordersData.error)
      }
      
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
      alert('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

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

  const getOrderStatusColor = (status) => {
    const statusColors = {
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'shipped': 'bg-blue-100 text-blue-800 border-blue-200',
      'processing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-gray-100 text-gray-800 border-gray-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    }
    return statusColors[status] || statusColors['confirmed']
  }

  const getOrderStatusIcon = (status) => {
    const statusIcons = {
      'delivered': '✅',
      'shipped': '🚚',
      'processing': '⚙️',
      'confirmed': '📦',
      'cancelled': '❌'
    }
    return statusIcons[status] || statusIcons['confirmed']
  }

  if (loading) {
    return <Loading />
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start shopping to see your orders here. Browse our amazing collection of products!
            </p>
            <Link 
              href="/categories" 
              className="inline-block bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order, index) => (
            <OrderCard 
              key={order._id || order.orderId || index} 
              order={order}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getOrderStatusColor={getOrderStatusColor}
              getOrderStatusIcon={getOrderStatusIcon}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Separate Order Card Component for better organization
function OrderCard({ order, formatPrice, formatDate, getOrderStatusColor, getOrderStatusIcon }) {
  const orderId = order._id?.slice(-8) || order.orderId?.slice(-8) || 'Unknown'
  const orderStatus = order.orderStatus || 'confirmed'
  const totalAmount = order.totalAmount || order.total || 0
  const orderDate = order.createdAt || order.orderDate
  const shippingAddress = order.shippingAddress || order.shipping || {}

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
       {/* Order Header */}
       <div className="p-4 sm:p-6 border-b border-gray-100">
         {/* Mobile Layout: Order ID and (Price + Items) in same row */}
         <div className="sm:hidden">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <h3 className="text-lg font-semibold text-gray-900">
                 Order #{orderId}
               </h3>
               <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(orderStatus)}`}>
                 <span>{getOrderStatusIcon(orderStatus)}</span>
                 <span className="capitalize">{orderStatus}</span>
               </span>
             </div>
             <div className="text-center">
               <p className="text-lg font-bold text-gray-900">
                 {formatPrice(totalAmount)}
               </p>
               <p className="text-xs text-gray-500">
                 {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
               </p>
             </div>
           </div>
           <p className="text-sm text-gray-600 mt-1">
             Placed on {formatDate(orderDate)}
           </p>
         </div>

         {/* Desktop Layout: Original layout */}
         <div className="hidden sm:flex sm:items-center sm:justify-between gap-3">
           {/* Order Info */}
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <h3 className="text-lg font-semibold text-gray-900">
                 Order #{orderId}
               </h3>
               <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getOrderStatusColor(orderStatus)}`}>
                 <span>{getOrderStatusIcon(orderStatus)}</span>
                 <span className="capitalize">{orderStatus}</span>
               </span>
             </div>
             <p className="text-sm text-gray-600">
               Placed on {formatDate(orderDate)}
             </p>
           </div>

           {/* Total Amount */}
           <div className="text-right">
             <p className="text-xl font-bold text-gray-900">
               {formatPrice(totalAmount)}
             </p>
             <p className="text-xs text-gray-500">
               {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
             </p>
           </div>
         </div>
       </div>

      {/* Order Items */}
      <div className="p-4 sm:p-6">
        <h4 className="font-medium text-gray-900 mb-4 text-sm sm:text-base">
          Order Items
        </h4>
        
        <div className="space-y-3">
          {order.items?.map((item, itemIndex) => (
            <div key={itemIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Product Image Placeholder */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                <span className="text-gray-400 text-lg">📦</span>
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                  {item.name || 'Unknown Product'}
                </h5>
                <p className="text-xs text-gray-600">
                  {item.brand || 'Unknown Brand'} • Qty: {item.quantity || 1}
                </p>
              </div>
              
              {/* Price - Only show on desktop, hide on mobile to avoid duplication */}
              <div className="hidden sm:block text-right">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {formatPrice((item.price || 0) * (item.quantity || 1))}
                </p>
              </div>
            </div>
          ))}
        </div>

         {/* Shipping Address & Actions */}
         <div className="mt-6 pt-4 border-t border-gray-100">
           {/* Mobile Layout: Shipping address only, View Details button at bottom right */}
           <div className="sm:hidden">
             <p className="text-sm font-medium text-gray-900 mb-2">Shipping Address</p>
             <div className="text-xs text-gray-600 space-y-1 mb-4">
               <p className="font-medium">
                 {shippingAddress.firstName || ''} {shippingAddress.lastName || ''}
               </p>
               <p>{shippingAddress.address || 'Address not available'}</p>
               <p>
                 {shippingAddress.city || ''}, {shippingAddress.state || ''} {shippingAddress.zipCode || ''}
               </p>
             </div>
             <div className="flex justify-end">
               <Link
                 href={`/order/${order._id || order.orderId}`}
                 className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
               >
                 <span>View Details</span>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </Link>
             </div>
           </div>

           {/* Desktop Layout: Original layout */}
           <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
             {/* Shipping Address */}
             <div className="flex-1">
               <p className="text-sm font-medium text-gray-900 mb-1">Shipping Address</p>
               <div className="text-xs text-gray-600 space-y-1">
                 <p className="font-medium">
                   {shippingAddress.firstName || ''} {shippingAddress.lastName || ''}
                 </p>
                 <p>{shippingAddress.address || 'Address not available'}</p>
                 <p>
                   {shippingAddress.city || ''}, {shippingAddress.state || ''} {shippingAddress.zipCode || ''}
                 </p>
               </div>
             </div>

             {/* View Details Button */}
             <div className="flex-shrink-0">
               <Link
                 href={`/order/${order._id || order.orderId}`}
                 className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
               >
                 <span>View Details</span>
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </Link>
             </div>
           </div>
         </div>
      </div>
    </div>
  )
}