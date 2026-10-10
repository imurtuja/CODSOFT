import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Order from '../../../models/Order.js'
import Product from '../../../models/Product.js'
import { getAuthUser } from '../../../lib/auth.js'

// In-memory cache for customer orders
const ordersCache = new Map()
const ORDERS_CACHE_TTL_MS = 15000

export function clearOrdersCache() {
  ordersCache.clear()
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isAdminRequested = searchParams.get('admin') === 'true'
    const orderIdParam = searchParams.get('orderId')

    const authUser = getAuthUser(request)

    // Check cache for non-admin requests
    const cacheKey = !orderIdParam && !isAdminRequested ? (authUser?.userId || userId || '') : null
    if (cacheKey) {
      const cached = ordersCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < ORDERS_CACHE_TTL_MS) {
        return NextResponse.json(cached.data, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'private, no-cache, no-transform',
          },
        })
      }
    }

    await connectDB()

    // Fetch single order by orderId
    if (orderIdParam) {
      const sanitizedOrderId = String(orderIdParam).trim()
      const singleOrder = await Order.findOne({ orderId: sanitizedOrderId }).lean()
      if (!singleOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Access control: verify requester owns this order or is admin
      if (!authUser) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const orderUserId = singleOrder.user?._id || singleOrder.user?.id || singleOrder.user
      const isOwner = (
        (orderUserId && String(orderUserId) === String(authUser.userId)) ||
        (singleOrder.shippingAddress?.email && authUser.email && singleOrder.shippingAddress.email.toLowerCase() === authUser.email.toLowerCase())
      )
      const isAdmin = authUser.role === 'admin'

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      const orderTimestamp = new Date(singleOrder.orderDate || singleOrder.createdAt || Date.now()).getTime()
      singleOrder.isConfirmationExpired = (Date.now() - orderTimestamp) > 30 * 60 * 1000

      return NextResponse.json(singleOrder)
    }

    // Admin listing requires admin role
    if (isAdminRequested) {
      if (!authUser || authUser.role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized: Admin privileges required' },
          { status: 403 }
        )
      }
      const allOrders = await Order.find({})
        .sort({ orderDate: -1 })
        .lean()
      return NextResponse.json(allOrders)
    }

    // Customer orders query
    const effectiveUserId = (userId ? String(userId).trim() : null) || authUser?.userId
    if (!effectiveUserId && !authUser) {
      return NextResponse.json(
        { error: 'Authentication or valid userId required' },
        { status: 401 }
      )
    }

    // Non-admins can only request their own orders
    if (authUser && authUser.role !== 'admin' && userId) {
      const isOwner = String(userId).trim() === String(authUser.userId) ||
                      (authUser.email && String(userId).trim().toLowerCase() === authUser.email.toLowerCase())
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Forbidden: Access to specified orders is denied' },
          { status: 403 }
        )
      }
    }

    // Match against user ID and email fields
    const queryConditions = []
    if (effectiveUserId) {
      queryConditions.push({ user: String(effectiveUserId) })
      queryConditions.push({ userId: String(effectiveUserId) })
    }
    if (authUser?.userId && String(authUser.userId) !== String(effectiveUserId)) {
      queryConditions.push({ user: String(authUser.userId) })
      queryConditions.push({ userId: String(authUser.userId) })
    }
    if (authUser?.email) {
      queryConditions.push({ 'shippingAddress.email': authUser.email.toLowerCase() })
    }
    if (userId && String(userId).includes('@')) {
      queryConditions.push({ 'shippingAddress.email': String(userId).toLowerCase().trim() })
    }

    const filter = queryConditions.length > 1 ? { $or: queryConditions } : (queryConditions[0] || {})
    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .lean()

    if (cacheKey) {
      ordersCache.set(cacheKey, { data: orders, timestamp: Date.now() })
    }
    
    return NextResponse.json(orders)
    
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    await connectDB()
    
    const orderData = await request.json()
    const authUser = getAuthUser(request)
    
    // User validation
    const userId = (orderData.user || orderData.userId || authUser?.userId)
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const sanitizedUserId = String(userId).trim()
    
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one valid item' },
        { status: 400 }
      )
    }

    if (!orderData.shippingAddress || typeof orderData.shippingAddress !== 'object') {
      return NextResponse.json(
        { error: 'Valid shipping address is required' },
        { status: 400 }
      )
    }

    // Validate items and recalculate prices from DB
    let serverSubtotal = 0
    const verifiedItems = []

    for (const item of orderData.items) {
      const quantity = Math.max(1, parseInt(item.quantity) || 1)
      const productId = item.product || item.id || item._id

      let dbProduct = null
      if (productId) {
        try {
          dbProduct = await Product.findById(productId).lean()
        } catch (e) {
          // Fallback lookup by SKU or product name
          dbProduct = await Product.findOne({
            $or: [{ sku: String(productId) }, { name: String(item.name || '') }]
          }).lean()
        }
      }

      // Prefer database price over client-provided value
      const authoritativePrice = dbProduct && typeof dbProduct.price === 'number'
        ? dbProduct.price
        : Math.max(0, Number(item.price) || 0)

      const itemTotal = authoritativePrice * quantity
      serverSubtotal += itemTotal

      verifiedItems.push({
        product: dbProduct ? dbProduct._id : (productId || null),
        name: dbProduct?.name || String(item.name || 'Product'),
        brand: dbProduct?.brand || String(item.brand || ''),
        price: authoritativePrice,
        quantity: quantity,
        image: (dbProduct?.images && dbProduct.images[0]) || item.image || '/placeholder.png'
      })

      // Deduct stock and increment sales count
      if (dbProduct) {
        await Product.findByIdAndUpdate(dbProduct._id, {
          $inc: {
            stock: -quantity,
            sales: quantity
          }
        }).catch(err => console.warn('Stock decrement warning:', err.message))
      }
    }

    const authoritativeTotal = Math.max(0, Math.round(serverSubtotal))
    const paymentMethod = orderData.paymentMethod === 'cod' ? 'cod' : 'razorpay'
    
    // Generate order ID and invoice number
    const orderId = 'EVR-' + Date.now()
    const now = new Date()
    const currentYear = now.getFullYear()
    const fiscalYear = now.getMonth() >= 3 ? `${currentYear}-${String(currentYear + 1).slice(-2)}` : `${currentYear - 1}-${String(currentYear).slice(-2)}`
    const refSuffix = orderId.slice(-6).toUpperCase()
    const invoiceNumber = `INV/EC/${fiscalYear}/${refSuffix}`

    // Inclusive GST (18%) breakdown
    const taxableAmount = Math.round((authoritativeTotal / 1.18) * 100) / 100
    const totalGst = Math.round((authoritativeTotal - taxableAmount) * 100) / 100
    const cgst = Math.round((totalGst / 2) * 100) / 100
    const sgst = Math.round((totalGst - cgst) * 100) / 100

    const order = await Order.create({
      orderId,
      invoiceNumber,
      invoiceDate: now,
      taxDetails: {
        taxableAmount,
        totalGst,
        cgst,
        sgst,
        rate: 18
      },
      user: sanitizedUserId,
      items: verifiedItems,
      subtotal: authoritativeTotal,
      total: authoritativeTotal,
      totalAmount: authoritativeTotal,
      shippingAddress: {
        firstName: String(orderData.shippingAddress.firstName || '').slice(0, 100),
        lastName: String(orderData.shippingAddress.lastName || '').slice(0, 100),
        email: String(orderData.shippingAddress.email || '').slice(0, 150),
        phone: String(orderData.shippingAddress.phone || '').slice(0, 30),
        address: String(orderData.shippingAddress.address || '').slice(0, 300),
        city: String(orderData.shippingAddress.city || '').slice(0, 100),
        state: String(orderData.shippingAddress.state || '').slice(0, 100),
        zipCode: String(orderData.shippingAddress.zipCode || '').slice(0, 20),
      },
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending'
    })
    
    clearOrdersCache()

    return NextResponse.json({
      success: true,
      order: order.toObject(),
      orderId
    })
    
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}
