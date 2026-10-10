import connectDB from '../lib/mongodb.js'
import Product from '../models/Product.js'

export const revalidate = 3600 // Regenerate sitemap at most once per hour

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evercart.murtuja.in'

  // Static core routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/electronics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/laptops`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/gaming`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/audio`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/cameras`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/accessories`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  let productRoutes = []
  try {
    await connectDB()
    const products = await Product.find({ status: 'active' })
      .select('_id updatedAt')
      .lean()

    productRoutes = products.map((prod) => ({
      url: `${baseUrl}/product/${prod._id}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
  }

  return [...staticRoutes, ...productRoutes]
}
