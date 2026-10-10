import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

function getUserId(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secure-secret-key')
      if (decoded?.userId) return decoded.userId
    }
  } catch (err) {
    // Fall back to query param
  }
  const url = new URL(request.url)
  return url.searchParams.get('userId')
}

// Fetch user's online cart
export async function GET(request) {
  try {
    await connectDB()
    const userId = getUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await User.findById(userId).select('cart')
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      cart: user.cart || [],
    })
  } catch (error) {
    console.error('Fetch cart error:', error)
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

// Update online cart
export async function POST(request) {
  try {
    await connectDB()
    const body = await request.json()
    const userId = body.userId || getUserId(request)
    const cart = Array.isArray(body.cart) ? body.cart : []

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const sanitizedCart = cart.map((item) => ({
      id: String(item.id || item._id),
      name: String(item.name || ''),
      price: Number(item.price || 0),
      image: String(item.image || item.images?.[0] || ''),
      quantity: Math.max(1, Math.min(99, Number(item.quantity || 1))),
      brand: String(item.brand || ''),
    }))

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { cart: sanitizedCart, updatedAt: new Date() },
      { new: true }
    ).select('cart')

    return NextResponse.json({
      success: true,
      cart: updatedUser?.cart || [],
    })
  } catch (error) {
    console.error('Save cart error:', error)
    return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
  }
}

// Merge guest cart with persistent account cart on login
export async function PUT(request) {
  try {
    await connectDB()
    const body = await request.json()
    const userId = body.userId || getUserId(request)
    const localCart = Array.isArray(body.localCart) ? body.localCart : []

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const mergedCartMap = new Map()

    // Index existing cart items
    for (const item of (user.cart || [])) {
      if (item && item.id) {
        mergedCartMap.set(item.id, {
          id: String(item.id),
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          brand: item.brand,
        })
      }
    }

    // Combine guest items
    for (const item of localCart) {
      const id = String(item.id || item._id)
      if (!id) continue

      if (mergedCartMap.has(id)) {
        const existing = mergedCartMap.get(id)
        existing.quantity = Math.min(99, (existing.quantity || 1) + (item.quantity || 1))
      } else {
        mergedCartMap.set(id, {
          id,
          name: String(item.name || ''),
          price: Number(item.price || 0),
          image: String(item.image || item.images?.[0] || ''),
          quantity: Math.max(1, Math.min(99, Number(item.quantity || 1))),
          brand: String(item.brand || ''),
        })
      }
    }

    const finalCart = Array.from(mergedCartMap.values())
    user.cart = finalCart
    user.updatedAt = new Date()
    await user.save()

    return NextResponse.json({
      success: true,
      cart: finalCart,
    })
  } catch (error) {
    console.error('Merge cart error:', error)
    return NextResponse.json({ error: 'Failed to merge cart' }, { status: 500 })
  }
}
