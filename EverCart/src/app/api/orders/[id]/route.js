import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import Order from '../../../../models/Order.js'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    
    // Try to find by orderId first, then by _id
    let order = await Order.findOne({ orderId: id }).lean()
    
    if (!order) {
      // If not found by orderId, try by _id
      order = await Order.findById(id).lean()
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(order)
    
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    const updateData = await request.json()
    
    let order = await Order.findOneAndUpdate(
      { orderId: id },
      { $set: updateData },
      { new: true }
    )
    
    if (!order) {
      order = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
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