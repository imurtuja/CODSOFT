import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const sort = searchParams.get('sort') || 'createdAt'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    let query = { status: 'active' }
    
    // Filter by featured products
    if (featured) {
      query.isFeatured = true
    }
    
    // Filter by category
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') }
    }
    
    // Filter by search query
    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search, 'i') } },
        { description: { $regex: new RegExp(search, 'i') } },
        { brand: { $regex: new RegExp(search, 'i') } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ]
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = parseInt(minPrice)
      if (maxPrice) query.price.$lte = parseInt(maxPrice)
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(query)
    
    // Build sort object
    let sortObj = { createdAt: -1 }
    if (sort === 'name') {
      sortObj = { name: 1 }
    } else if (sort === 'price-low') {
      sortObj = { price: 1 }
    } else if (sort === 'price-high') {
      sortObj = { price: -1 }
    } else if (sort === 'rating') {
      sortObj = { rating: -1 }
    }
    
    // Get products with pagination
    const products = await Product.find(query)
      .select('-reviews')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortObj)
      .lean()
    
    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
    
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
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
    
    const product = new Product(productData)
    await product.save()
    
    return NextResponse.json({ 
      success: true, 
      product: product,
      message: 'Product created successfully' 
    })
    
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
