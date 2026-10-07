import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export async function GET(request) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    
    // Validate and clamp pagination to prevent DoS
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 50)
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1)
    
    const sort = searchParams.get('sort') || 'createdAt'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    let query = { status: 'active' }
    
    // Filter by featured products
    if (featured) {
      query.isFeatured = true
    }
    
    // Safe category filter (prevent ReDoS)
    if (category && category.trim()) {
      const safeCat = escapeRegex(category.trim())
      query.category = { $regex: new RegExp(`^${safeCat}$`, 'i') }
    }
    
    // Safe search filter
    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim())
      const searchRegex = new RegExp(safeSearch, 'i')
      query.$or = [
        { name: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { brand: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } }
      ]
    }
    
    // Filter by price range
    const parsedMin = parseInt(minPrice, 10)
    const parsedMax = parseInt(maxPrice, 10)
    if (!isNaN(parsedMin) || !isNaN(parsedMax)) {
      query.price = {}
      if (!isNaN(parsedMin) && parsedMin >= 0) query.price.$gte = parsedMin
      if (!isNaN(parsedMax) && parsedMax >= 0) query.price.$lte = parsedMax
    }
    
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
    
    // Run count and data query concurrently in parallel
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select('-reviews -features -specifications -sources')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sortObj)
        .lean()
    ])
    
    return NextResponse.json(
      {
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        }
      }
    )
    
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
