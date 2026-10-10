import mongoose from 'mongoose'
import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'
import ProductDetailClient from './ProductDetailClient'
import NotFoundView from '../../../components/NotFoundView'

export const revalidate = 60 // 60s background revalidation (ISR)
export const dynamicParams = true // Allow dynamic rendering for new products

export async function generateStaticParams() {
  try {
    await connectDB()
    const products = await Product.find({ status: 'active' }).select('_id').lean()
    return products.map((p) => ({ id: String(p._id) }))
  } catch (error) {
    console.error('Error generating static product params:', error)
    return []
  }
}

// In-memory cache for product details and metadata queries
const productServerCache = new Map()
const CACHE_TTL_MS = 60000 // 60s

export function clearProductServerCache(id) {
  if (id) {
    productServerCache.delete(String(id))
  } else {
    productServerCache.clear()
  }
}

async function getProduct(id) {
  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) return null

  const cached = productServerCache.get(id)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    await connectDB()
    const doc = await Product.findById(id).lean()
    const data = doc ? JSON.parse(JSON.stringify(doc)) : null

    if (data) {
      if (productServerCache.size > 200) {
        const oldestKey = productServerCache.keys().next().value
        productServerCache.delete(oldestKey)
      }
      productServerCache.set(id, { data, timestamp: Date.now() })
    }

    return data
  } catch (error) {
    console.error('Error fetching product for SSR/SEO:', error)
    return null
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams?.id)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found on EverCart.',
      robots: { index: false, follow: true },
    }
  }

  const cleanDescription = (product.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155)

  const seoTitle = `${product.name} - Buy Online at Best Price in India`
  const seoDescription = `${cleanDescription}... Buy ${product.name} online at ₹${product.price?.toLocaleString('en-IN')} with 100% Brand Genuine Warranty & Free Delivery on EverCart.`
  const primaryImage = product.images?.[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&h=630&q=85'
  const canonicalUrl = `https://evercart.murtuja.in/product/${product._id}`

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      product.name,
      product.brand,
      product.category,
      `buy ${product.name} online`,
      `${product.name} price in India`,
      `${product.brand} ${product.category}`,
      'EverCart best deals',
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} - ₹${product.price?.toLocaleString('en-IN')}`,
      description: seoDescription,
      url: canonicalUrl,
      siteName: 'EverCart',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} - ₹${product.price?.toLocaleString('en-IN')}`,
      description: seoDescription,
      images: [primaryImage],
    },
  }
}

export default async function ProductPage({ params }) {
  const resolvedParams = await params
  const productId = resolvedParams?.id
  const product = await getProduct(productId)

  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <NotFoundView
          title="Product Not Found"
          message="The product you are looking for does not exist, is inactive, or has been discontinued."
        />
      </div>
    )
  }

  // Product structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image].filter(Boolean),
    description: product.description,
    sku: product.sku || String(product._id),
    mpn: String(product._id),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'EverCart',
    },
    offers: {
      '@type': 'Offer',
      url: `https://evercart.murtuja.in/product/${product._id}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'EverCart',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(product.rating || 4.8),
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(product.reviewsCount || 128),
    },
  }

  // Breadcrumb structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://evercart.murtuja.in',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : 'Products',
        item: product.category ? `https://evercart.murtuja.in/category/${product.category}` : 'https://evercart.murtuja.in/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://evercart.murtuja.in/product/${product._id}`,
      },
    ],
  }

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <ProductDetailClient
        initialProduct={product}
        productId={productId}
      />
    </>
  )
}