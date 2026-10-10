import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '../../../../lib/mongodb.js'
import Order from '../../../../models/Order.js'
import { requireAuth, getAuthUser } from '../../../../lib/auth.js'
import { clearOrdersCache } from '../route.js'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const resolvedParams = await params
    const rawId = resolvedParams?.id

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const cleanId = String(rawId).trim()

    // Try to find by orderId first
    let order = await Order.findOne({ orderId: cleanId }).lean()
    
    // If not found and valid ObjectId, try by _id
    if (!order && mongoose.Types.ObjectId.isValid(cleanId)) {
      order = await Order.findById(cleanId).lean()
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify viewer is either the order owner or an admin
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderUserId = order.user?._id || order.user?.id || order.user
    const isOwner = (
      (orderUserId && String(orderUserId) === String(authUser.userId)) ||
      (order.shippingAddress?.email && authUser.email && order.shippingAddress.email.toLowerCase() === authUser.email.toLowerCase())
    )
    const isAdmin = authUser.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if the 30-minute confirmation link window has passed
    const orderTimestamp = new Date(order.orderDate || order.createdAt || Date.now()).getTime()
    const ageMs = Date.now() - orderTimestamp
    const CONFIRMATION_LIFESPAN_MS = 30 * 60 * 1000 // 30 minutes
    const isConfirmationExpired = ageMs > CONFIRMATION_LIFESPAN_MS

    order.isConfirmationExpired = isConfirmationExpired
    order.confirmationExpiresAt = new Date(orderTimestamp + CONFIRMATION_LIFESPAN_MS).toISOString()

    // Populate invoice number and GST breakdown if missing
    if (!order.invoiceNumber) {
      const orderDate = order.orderDate || order.createdAt || new Date()
      const d = new Date(orderDate)
      const currentYear = d.getFullYear()
      const fiscalYear = d.getMonth() >= 3 ? `${currentYear}-${String(currentYear + 1).slice(-2)}` : `${currentYear - 1}-${String(currentYear).slice(-2)}`
      const refSuffix = String(order.orderId || order._id).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
      const invoiceNumber = `INV/EC/${fiscalYear}/${refSuffix}`
      const invoiceDate = orderDate

      const total = order.totalAmount || order.total || 0
      // Inclusive GST (18%) breakdown
      const taxableAmount = Math.round((total / 1.18) * 100) / 100
      const totalGst = Math.round((total - taxableAmount) * 100) / 100
      const cgst = Math.round((totalGst / 2) * 100) / 100
      const sgst = Math.round((totalGst - cgst) * 100) / 100

      const taxDetails = {
        taxableAmount,
        totalGst,
        cgst,
        sgst,
        rate: 18
      }

      await Order.updateOne(
        { _id: order._id },
        { $set: { invoiceNumber, invoiceDate, taxDetails } }
      )

      order.invoiceNumber = invoiceNumber
      order.invoiceDate = invoiceDate
      order.taxDetails = taxDetails
    }
    
    return NextResponse.json(order, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
      },
    })
    
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const resolvedParams = await params
    const rawId = resolvedParams?.id

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    const cleanId = String(rawId).trim()

    // Require authentication for modifying order records
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    let order = await Order.findOne({ orderId: cleanId })
    if (!order && mongoose.Types.ObjectId.isValid(cleanId)) {
      order = await Order.findById(cleanId)
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const isOwner = order.user && String(order.user) === String(authResult.userId)
    const isAdmin = authResult.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this order' },
        { status: 403 }
      )
    }

    const updateData = await request.json()

    // Non-admins can only cancel their own order if not yet shipped
    if (!isAdmin) {
      if (updateData.orderStatus === 'cancelled' && ['pending', 'confirmed'].includes(order.orderStatus)) {
        order.orderStatus = 'cancelled'
        await order.save()
        clearOrdersCache()
        return NextResponse.json({ success: true, order: order.toObject() })
      } else {
        return NextResponse.json(
          { error: 'Customer is not authorized to modify sensitive order parameters' },
          { status: 403 }
        )
      }
    }

    // Admin updates: selectively allow updating status
    if (updateData.orderStatus) {
      order.orderStatus = updateData.orderStatus
    }
    if (updateData.paymentStatus) {
      order.paymentStatus = updateData.paymentStatus
    }

    await order.save()
    clearOrdersCache()
    
    return NextResponse.json({
      success: true,
      order: order.toObject()
    })
    
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}