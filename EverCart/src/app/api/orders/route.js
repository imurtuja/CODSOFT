import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Order from '../../../models/Order.js'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isAdmin = searchParams.get('admin') === 'true'
    
    let query = {}
    if (userId && !isAdmin) {
      query = { user: userId }
    }
    
    const orders = await Order.find(query)
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
    
    // Validation
    if (!orderData.user && !orderData.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    if (!orderData.items || !orderData.totalAmount || !orderData.shippingAddress) {
      return NextResponse.json(
        { error: 'Missing required order data' },
        { status: 400 }
      )
    }
    
    // Use userId if user is not provided
    const userId = orderData.user || orderData.userId
    
    // Generate order ID
    const orderId = 'EVR-' + Date.now()
    
    const order = await Order.create({
      orderId,
      user: userId,
      items: orderData.items,
      total: orderData.totalAmount,
      totalAmount: orderData.totalAmount,
      subtotal: orderData.subtotal || orderData.totalAmount,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod === 'online' ? 'razorpay' : 'cod',
      paymentStatus: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
      orderStatus: orderData.paymentMethod === 'cod' ? 'confirmed' : 'pending'
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
