export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evercart.murtuja.in'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/checkout',
          '/cart',
          '/profile',
          '/orders',
          '/order/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
