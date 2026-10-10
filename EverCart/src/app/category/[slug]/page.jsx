import connectDB from '../../../lib/mongodb.js'
import Product from '../../../models/Product.js'
import CategoryPageClient from './CategoryPageClient'

const CATEGORY_DETAILS = {
  electronics: {
    title: 'Electronics',
    description: 'Shop flagship smartphones, tablets, smart wearables, and consumer tech from leading brands at EverCart.',
  },
  laptops: {
    title: 'Laptops',
    description: 'High-performance laptops, ultrabooks, gaming rigs, and workstations for pros and creators at EverCart.',
  },
  gaming: {
    title: 'Gaming',
    description: 'Consoles, handheld gaming systems, high-precision controllers, and accessories at EverCart.',
  },
  audio: {
    title: 'Audio',
    description: 'Noise-canceling headphones, wireless earbuds, and high-fidelity home acoustics at EverCart.',
  },
  cameras: {
    title: 'Cameras',
    description: 'Mirrorless cameras, compact gimbals, action cams, and cinematography drones at EverCart.',
  },
  accessories: {
    title: 'Accessories',
    description: 'Precision mice, mechanical keyboards, GaN chargers, and connectivity docks at EverCart.',
  },
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const rawSlug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : ''
  const details = CATEGORY_DETAILS[rawSlug]
  const title = details ? details.title : (rawSlug ? rawSlug.charAt(0).toUpperCase() + rawSlug.slice(1) : 'Category')
  const description = details ? details.description : `Explore curated ${title} products at the best prices on EverCart.`

  return {
    title: `${title} - Shop Online at Best Prices`,
    description,
    keywords: [title, `buy ${title.toLowerCase()} online`, `${title.toLowerCase()} deals India`, 'EverCart tech'],
    alternates: {
      canonical: `https://evercart.murtuja.in/category/${rawSlug}`,
    },
    openGraph: {
      title: `${title} - Shop Online at Best Prices | EverCart`,
      description,
      url: `https://evercart.murtuja.in/category/${rawSlug}`,
      siteName: 'EverCart',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Shop Online at Best Prices | EverCart`,
      description,
    },
  }
}

export default async function CategoryPage({ params }) {
  const resolvedParams = await params
  const rawSlug = resolvedParams?.slug ? String(resolvedParams.slug).toLowerCase() : ''

  let products = []
  try {
    await connectDB()
    const docs = await Product.find({
      category: { $regex: new RegExp(`^${rawSlug}$`, 'i') },
      status: 'active',
    })
      .select('name brand description price originalPrice category images rating status isSpotlight isFeatured stock')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    products = JSON.parse(JSON.stringify(docs))
  } catch (error) {
    console.error('Error fetching category products on server:', error)
  }

  // Breadcrumb structured data
  const breadcrumbJsonLd = {
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
        name: CATEGORY_DETAILS[rawSlug]?.title || rawSlug,
        item: `https://evercart.murtuja.in/category/${rawSlug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryPageClient initialProducts={products} slug={rawSlug} />
    </>
  )
}