import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import Product from '../../../../models/Product.js'
import { clearProductsCache } from '../route.js'

const singleProductCache = new Map()
const PRODUCT_TTL_MS = 60000 // 60 seconds

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // Check in-memory cache
    const cached = singleProductCache.get(id)
    if (cached && Date.now() - cached.timestamp < PRODUCT_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        }
      })
    }

    await connectDB()
    const product = await Product.findById(id).lean()
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    singleProductCache.set(id, { data: product, timestamp: Date.now() })
    
    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      }
    })
    
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    
    const body = await request.json()

    // Support quick partial updates (e.g. inline stock adjuster, isFeatured toggle, status toggle, isSpotlight toggle)
    if (!body.name && (body.stock !== undefined || body.isFeatured !== undefined || body.status !== undefined || body.isSpotlight !== undefined)) {
      const updateFields = {}
      if (body.stock !== undefined) updateFields.stock = parseInt(body.stock, 10)
      if (body.isFeatured !== undefined) updateFields.isFeatured = Boolean(body.isFeatured)
      if (body.status !== undefined) updateFields.status = body.status
      if (body.isSpotlight !== undefined) {
        updateFields.isSpotlight = Boolean(body.isSpotlight)
        if (body.isSpotlight) {
          // Unset spotlight on all other products so this product becomes the primary homepage top spotlight
          await Product.updateMany({ _id: { $ne: id } }, { $set: { isSpotlight: false } })
        }
      }

      const updated = await Product.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      ).lean()

      singleProductCache.clear()
      if (typeof clearProductsCache === 'function') {
        clearProductsCache()
      }

      return NextResponse.json({ success: true, product: updated })
    }
    
    const { name, brand, price, description, category, stock } = body
    
    if (!name || !brand || !price || !description || !category || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const cleanImages = body.images?.filter(img => img.trim() !== '') || []
    const cleanFeatures = body.features?.filter(feature => feature.trim() !== '') || []
    const cleanTags = body.tags?.filter(tag => tag.trim() !== '') || []
    
    const cleanSpecs = {}
    if (body.specifications) {
      Object.entries(body.specifications).forEach(([key, value]) => {
        if (key.trim() !== '' && value.trim() !== '') {
          cleanSpecs[key.trim()] = value.trim()
        }
      })
    }
    
    const productData = {
      name: name.trim(),
      brand: brand.trim(),
      price: parseFloat(price),
      originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
      description: description.trim(),
      category: category.trim(),
      stock: parseInt(stock),
      rating: body.rating ? parseFloat(body.rating) : 0,
      sku: body.sku?.trim() || undefined,
      status: body.status || 'active',
      isFeatured: Boolean(body.isFeatured),
      isSpotlight: Boolean(body.isSpotlight),
      images: cleanImages,
      features: cleanFeatures,
      specifications: cleanSpecs,
      tags: cleanTags
    }
    
    if (Boolean(body.isSpotlight)) {
      await Product.updateMany({ _id: { $ne: id } }, { $set: { isSpotlight: false } })
    }

    const product = await Product.findByIdAndUpdate(
      id,
      productData,
      { new: true, runValidators: true }
    )
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    singleProductCache.clear()
    if (typeof clearProductsCache === 'function') {
      clearProductsCache()
    }
    
    return NextResponse.json({ 
      success: true, 
      product: product,
      message: 'Product updated successfully' 
    })
    
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB()
    const { id } = await params
    
    const product = await Product.findByIdAndDelete(id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    singleProductCache.delete(id)
    
    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully' 
    })
    
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}