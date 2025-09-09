import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import Product from '../../../../models/Product.js'

export async function GET(request, { params }) {
  try {
    await connectDB()
    
    const product = await Product.findById(params.id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(product)
    
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
    
    const body = await request.json()
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
      images: cleanImages,
      features: cleanFeatures,
      specifications: cleanSpecs,
      tags: cleanTags
    }
    
    const product = await Product.findByIdAndUpdate(
      params.id,
      productData,
      { new: true, runValidators: true }
    )
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
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
    
    const product = await Product.findByIdAndDelete(params.id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
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