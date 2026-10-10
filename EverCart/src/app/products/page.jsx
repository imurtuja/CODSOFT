import connectDB from '../../lib/mongodb.js'
import Product from '../../models/Product.js'
import ProductsPageClient from './ProductsPageClient'

export const revalidate = 60 // 60s background revalidation (ISR)

let productsCatalogCache = null
let catalogCacheTime = 0
const CACHE_TTL_MS = 60000 // 60s

export function clearProductsCatalogCache() {
  productsCatalogCache = null
  catalogCacheTime = 0
}

async function getInitialProducts() {
  const now = Date.now()
  if (productsCatalogCache && now - catalogCacheTime < CACHE_TTL_MS) {
    return productsCatalogCache
  }

  try {
    await connectDB()
    const [total, docs] = await Promise.all([
      Product.countDocuments({ status: 'active' }),
      Product.find({ status: 'active' })
        .select('name brand price originalPrice category images stock rating tags isFeatured isSpotlight createdAt')
        .limit(12)
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const payload = {
      products: JSON.parse(JSON.stringify(docs)),
      total,
      totalPages: Math.ceil(total / 12) || 1,
    }

    productsCatalogCache = payload
    catalogCacheTime = now
    return payload
  } catch (error) {
    console.error('Error fetching initial catalog products:', error)
    if (productsCatalogCache) return productsCatalogCache
    return { products: [], total: 0, totalPages: 1 }
  }
}

export const metadata = {
  title: 'All Products - Shop Premium Electronics & Tech Deals',
  description: 'Explore the full catalog of premium electronics, smartphones, laptops, audio, and accessories with exclusive deals and 100% genuine brand warranty on EverCart.',
  alternates: {
    canonical: 'https://evercart.murtuja.in/products',
  },
}

export default async function ProductsPage() {
  const { products, total, totalPages } = await getInitialProducts()

  return (
    <ProductsPageClient
      initialProducts={products}
      initialTotal={total}
      initialTotalPages={totalPages}
    />
  )
}