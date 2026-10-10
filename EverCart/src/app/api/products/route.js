import { NextResponse } from 'next/server'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

// High-speed in-memory cache for sub-millisecond query responses
const productsCache = new Map()
const CACHE_TTL_MS = 30000 // 30 seconds

function getCachedProducts(key) {
  const item = productsCache.get(key)
  if (!item) return null
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    productsCache.delete(key)
    return null
  }
  return item.data
}

function setCachedProducts(key, data) {
  if (productsCache.size > 200) {
    const oldestKey = productsCache.keys().next().value
    productsCache.delete(oldestKey)
  }
  productsCache.set(key, { data, timestamp: Date.now() })
}

export function clearProductsCache() {
  productsCache.clear()
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    const cacheKey = searchParams.toString() || 'default'
    if (!isAdmin) {
      const cachedData = getCachedProducts(cacheKey)
      if (cachedData) {
        return NextResponse.json(cachedData, {
          headers: {
            'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
            'X-Cache': 'HIT',
          }
        })
      }
    }

    await connectDB()
    
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const spotlight = searchParams.get('spotlight') === 'true'
    
    // Validate and clamp pagination to prevent DoS
    const rawLimit = parseInt(searchParams.get('limit') || (isAdmin ? '1000' : '20'), 10)
    const limit = isAdmin
      ? Math.min(Math.max(isNaN(rawLimit) ? 1000 : rawLimit, 1), 2000)
      : Math.min(Math.max(isNaN(rawLimit) ? 20 : rawLimit, 1), 100)
    const rawPage = parseInt(searchParams.get('page') || '1', 10)
    const page = Math.max(isNaN(rawPage) ? 1 : rawPage, 1)
    
    const sort = searchParams.get('sort') || 'createdAt'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    
    let query = isAdmin ? {} : { status: 'active' }
    
    // Filter by featured products
    if (featured) {
      query.isFeatured = true
    }
    
    // Filter by spotlight products
    if (spotlight) {
      query.isSpotlight = true
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
        { category: { $regex: searchRegex } },
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
    
    // Run count and data query (optimized: skip expensive countDocuments when fetching single spotlight)
    let total = 0
    let products = []
    if (spotlight && limit === 1) {
      products = await Product.find(query)
        .select('name brand description price originalPrice category images stock sku rating status tags isFeatured isSpotlight sales createdAt updatedAt')
        .limit(1)
        .sort(sortObj)
        .lean()
      total = products.length
    } else {
      const selectedFields = isAdmin 
        ? 'name brand description price originalPrice category images features specifications stock sku rating status tags isFeatured isSpotlight sales createdAt updatedAt'
        : 'name brand price originalPrice category images stock rating tags isFeatured isSpotlight createdAt'

      const [t, p] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query)
          .select(selectedFields)
          .skip((page - 1) * limit)
          .limit(limit)
          .sort(sortObj)
          .lean()
      ])
      total = t
      products = p
    }
    
    const responsePayload = {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }

    if (!isAdmin) {
      setCachedProducts(cacheKey, responsePayload)
    }
    
    return NextResponse.json(
      responsePayload,
      {
        headers: isAdmin
          ? {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          : {
              'Cache-Control': 'public, max-age=15, s-maxage=60, stale-while-revalidate=300',
              'X-Cache': 'MISS',
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
      isSpotlight: Boolean(body.isSpotlight),
      images: cleanImages,
      features: cleanFeatures,
      specifications: cleanSpecs,
      tags: cleanTags
    }
    
    if (productData.isSpotlight) {
      await Product.updateMany({}, { $set: { isSpotlight: false } })
    }

    const product = new Product(productData)
    await product.save()
    
    clearProductsCache()

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
