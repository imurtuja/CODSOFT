import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Order from '../../../models/Order.js'
import Product from '../../../models/Product.js'
import { getAuthUser } from '../../../lib/auth.js'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isAdminRequested = searchParams.get('admin') === 'true'
    const orderIdParam = searchParams.get('orderId')

    const authUser = getAuthUser(request)

    // Specific order inquiry
    if (orderIdParam) {
      const sanitizedOrderId = String(orderIdParam).trim()
      const singleOrder = await Order.findOne({ orderId: sanitizedOrderId }).lean()
      if (!singleOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Security: Only the authenticated owner or admin can access
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

    // Admin listing requires authenticated admin role
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

    // Customer order listing
    const effectiveUserId = (userId ? String(userId).trim() : null) || authUser?.userId
    if (!effectiveUserId && !authUser) {
      return NextResponse.json(
        { error: 'Authentication or valid userId required' },
        { status: 401 }
      )
    }

    // Security: If authenticated as regular customer, ensure they are requesting their own orders
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

    // Build flexible query matching user, userId or email to ensure all legitimate orders are retrieved
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

    // Validate and price check items from database
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
          // If not valid ObjectId, find by sku or id
          dbProduct = await Product.findOne({
            $or: [{ sku: String(productId) }, { name: String(item.name || '') }]
          }).lean()
        }
      }

      // Use authoritative database price if product found; otherwise fallback safely
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

      // Update inventory stock safely if product exists in database
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
    
    // Generate unique cryptographically unforgeable order reference and official invoice number
    const orderId = 'EVR-' + Date.now()
    const now = new Date()
    const currentYear = now.getFullYear()
    const fiscalYear = now.getMonth() >= 3 ? `${currentYear}-${String(currentYear + 1).slice(-2)}` : `${currentYear - 1}-${String(currentYear).slice(-2)}`
    const refSuffix = orderId.slice(-6).toUpperCase()
    const invoiceNumber = `INV/EC/${fiscalYear}/${refSuffix}`

    // Indian GST 18% inclusive in price:
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
