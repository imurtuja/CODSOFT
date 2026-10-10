import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '../components/ProductCard'
import { getCategoryIcon, ChevronRightIcon } from '../components/CategoryIcons'
import connectDB from '../lib/mongodb.js'
import Product from '../models/Product.js'

export const revalidate = 60 // Revalidate in background every 60 seconds (ISR)

export const metadata = {
  title: 'EverCart - Flagship Electronics, Smartphones & Laptops',
  description: 'Shop curated consumer technology, flagship smartphones, high-performance laptops, gaming gear, and studio-grade audio at EverCart. Best Deals, Genuine Warranty & Fast Delivery.',
  alternates: {
    canonical: 'https://evercart.murtuja.in',
  },
}

const CATEGORIES = [
  {
    name: 'Electronics',
    slug: 'electronics',
    href: '/category/electronics',
    tagline: 'Phones & Smart Wearables',
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    href: '/category/laptops',
    tagline: 'Ultrabooks & Workstations',
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    href: '/category/gaming',
    tagline: 'Consoles & Handheld Systems',
  },
  {
    name: 'Audio',
    slug: 'audio',
    href: '/category/audio',
    tagline: 'Noise-Canceling & Hi-Fi',
  },
  {
    name: 'Cameras',
    slug: 'cameras',
    href: '/category/cameras',
    tagline: 'Mirrorless & 4K Gimbals',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    href: '/category/accessories',
    tagline: 'Keyboards, Mice & Docks',
  },
]

// Server memory cache for instant <1ms response
let cachedHomeData = null
let lastCacheTime = 0
const CACHE_TTL_MS = 60000 // 60s

export function clearHomeServerCache() {
  cachedHomeData = null
  lastCacheTime = 0
}

async function getHomeData() {
  const now = Date.now()
  if (cachedHomeData && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedHomeData
  }

  try {
    await connectDB()

    const [spotlightDoc, featuredDocs] = await Promise.all([
      Product.findOne({ status: 'active', isSpotlight: true })
        .select('name brand description price originalPrice category images rating status isSpotlight isFeatured stock')
        .lean(),
      Product.find({ status: 'active', isFeatured: true })
        .select('name brand description price originalPrice category images rating status isSpotlight isFeatured stock')
        .limit(8)
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const spotlight = spotlightDoc || (featuredDocs && featuredDocs.length > 0 ? featuredDocs[0] : null)

    const data = {
      spotlightProduct: spotlight ? JSON.parse(JSON.stringify(spotlight)) : null,
      featuredProducts: featuredDocs ? JSON.parse(JSON.stringify(featuredDocs)) : [],
    }

    cachedHomeData = data
    lastCacheTime = now
    return data
  } catch (error) {
    console.error('Error fetching home page products on server:', error)
    if (cachedHomeData) return cachedHomeData
    return { spotlightProduct: null, featuredProducts: [] }
  }
}

// Targeted Skeletons for Progressive Streaming
function SpotlightCardSkeleton() {
  return (
    <div className="w-full max-w-md bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="relative w-full h-80 sm:h-92 bg-gray-200">
        <div className="absolute top-4 left-4 w-28 h-6 rounded-full bg-gray-300/80" />
        <div className="absolute top-4 right-4 w-14 h-6 rounded-full bg-gray-300/80" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent via-white/80 to-white" />
      </div>
      <div className="relative -mt-20 sm:-mt-24 px-6 pb-6 pt-0 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded-full" />
        </div>
        <div className="h-6 bg-gray-300 rounded-lg w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-7 w-28 bg-gray-300 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-gray-900/10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function FeaturedProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3">
          <div className="w-full h-48 bg-gray-100 rounded-xl" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-5 w-full bg-gray-300 rounded-lg" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="pt-2 flex items-center justify-between">
            <div className="h-6 w-24 bg-gray-300 rounded" />
            <div className="h-9 w-24 bg-gray-900/10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function SpotlightSection() {
  const { spotlightProduct } = await getHomeData()

  if (!spotlightProduct) {
    return (
      <div className="w-full max-w-md h-96 bg-white rounded-2xl border border-gray-200/80 flex items-center justify-center text-gray-400 text-sm">
        Explore our curated products
      </div>
    )
  }

  return (
    <Link
      href={`/product/${spotlightProduct._id}`}
      prefetch={true}
      className="group block w-full max-w-md bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
    >
      {/* Top-to-Middle Faded Image Container */}
      <div className="relative w-full h-80 sm:h-92 overflow-hidden bg-gray-50">
        <Image
          src={spotlightProduct.images?.[0] || spotlightProduct.image || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80'}
          alt={spotlightProduct.name}
          fill
          priority={true}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 450px"
          className="object-cover object-center"
        />

        {/* Smooth Fade Effect: Starts at ~65% and softly turns into solid white */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-b from-transparent via-white/85 to-white pointer-events-none" />

        {/* Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <span className="px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide shadow-sm">
            Spotlight Deal
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold shadow-sm flex items-center gap-1">
            <span className="text-amber-500">★</span> {spotlightProduct.rating || 4.8}
          </span>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="relative -mt-20 sm:-mt-24 px-6 pb-6 pt-0 z-10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
            {spotlightProduct.brand}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            In Stock & Ready to Ship
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-black transition-colors">
          {spotlightProduct.name}
        </h3>

        {spotlightProduct.description && (
          <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
            {spotlightProduct.description}
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-gray-400 font-medium">Special Price</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-gray-900 tracking-tight">
                ₹{spotlightProduct.price?.toLocaleString('en-IN')}
              </span>
              {spotlightProduct.originalPrice && spotlightProduct.originalPrice > spotlightProduct.price && (
                <>
                  <span className="text-xs text-gray-400 line-through">
                    ₹{spotlightProduct.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600">
                    {Math.round(((spotlightProduct.originalPrice - spotlightProduct.price) / spotlightProduct.originalPrice) * 100)}% off
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold group-hover:bg-gray-800 transition-colors shadow-xs">
            <span>View Product</span>
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

async function FeaturedSection() {
  const { featuredProducts } = await getHomeData()

  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No featured products available at the moment.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredProducts.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  )
}

export default function Home() {
  // Google Structured Data for Organization & SearchAction
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://evercart.murtuja.in/#website',
        'url': 'https://evercart.murtuja.in',
        'name': 'EverCart',
        'description': 'Premier Destination for Curated Consumer Technology, Smartphones & Laptops',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://evercart.murtuja.in/search?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': 'https://evercart.murtuja.in/#organization',
        'name': 'EverCart',
        'url': 'https://evercart.murtuja.in',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://evercart.murtuja.in/favicon.png',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50/40">
      {/* Schema.org JSON-LD Script for Google Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Light Theme Hero Section */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50/60 border-b border-gray-200/80 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content (Instantly rendered shell) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Curated Consumer Technology</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.12]">
                Cutting-Edge Tech.{' '}
                <span className="block text-gray-400 font-bold">
                  Built for Every Task.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Explore our handpicked catalog of flagship smartphones, high-performance laptops, immersive gaming hardware, and studio-grade acoustics.
              </p>

              <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start pt-2">
                <Link
                  href="/products"
                  prefetch={true}
                  className="px-7 py-3.5 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 active:scale-95 transition-all text-sm text-center shadow-sm cursor-pointer"
                >
                  Shop All Products
                </Link>
                <Link
                  href="/categories"
                  prefetch={true}
                  className="px-7 py-3.5 rounded-xl bg-white text-gray-800 font-semibold hover:bg-gray-50 border border-gray-300 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Browse Departments</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Trust Metrics */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200/80 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-bold text-gray-900">40+</div>
                  <div className="text-xs text-gray-500 mt-0.5">Curated Products</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500 mt-0.5">Brand Genuine</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">₹0</div>
                  <div className="text-xs text-gray-500 mt-0.5">Free Delivery</div>
                </div>
              </div>
            </div>

            {/* Right Dynamic Spotlight Card with Streaming Suspense */}
            <div className="lg:col-span-5 flex justify-center">
              <Suspense fallback={<SpotlightCardSkeleton />}>
                <SpotlightSection />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Strip */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">100% Genuine</h4>
                <p className="text-xs text-gray-500">Official brand warranties</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">Express Delivery</h4>
                <p className="text-xs text-gray-500">Fast pan-India dispatch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">7-Day Returns</h4>
                <p className="text-xs text-gray-500">Hassle-free replacement</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">Secure Checkout</h4>
                <p className="text-xs text-gray-500">256-bit SSL encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Department */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Shop by Department
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Find the right hardware across our specialized technology categories.
              </p>
            </div>
            <Link
              href="/categories"
              prefetch={true}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-900 hover:underline underline-offset-4"
            >
              <span>All Departments</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                prefetch={true}
                className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-xs hover:border-gray-900 hover:shadow-md active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white transition-all mb-3">
                    {getCategoryIcon(cat.slug, 'w-5 h-5')}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-black mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {cat.tagline}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-900">
                  <span>Explore</span>
                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products with Streaming Suspense */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Featured Highlights
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Top-rated hardware and customer favorites across our store.
              </p>
            </div>
            <Link
              href="/products"
              prefetch={true}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-900 hover:underline underline-offset-4"
            >
              <span>View all products</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Suspense fallback={<FeaturedProductsSkeleton />}>
            <FeaturedSection />
          </Suspense>
        </div>
      </section>

      {/* Promotional Banners */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promo 1: Gaming */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-8 text-gray-900 flex flex-col justify-between border border-gray-200 shadow-xs hover:border-gray-400 transition-colors">
              <div className="space-y-3 max-w-sm">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                  Gaming Department
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  Next-Gen Gaming & Consoles
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  High-refresh rate hardware, ultra-fast handheld gaming systems, and ergonomic pro wireless controllers.
                </p>
              </div>
              <div className="mt-6 pt-4">
                <Link
                  href="/category/gaming"
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <span>Explore Gaming Hardware</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Promo 2: Studio Audio */}
            <div className="relative overflow-hidden bg-white rounded-2xl p-8 text-gray-900 flex flex-col justify-between border border-gray-200 shadow-xs hover:border-gray-400 transition-colors">
              <div className="space-y-3 max-w-sm">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                  Audio & Acoustics
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                  Studio Acoustics & Noise Canceling
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Premium active noise cancellation, studio-grade wireless earbuds, and room-filling acoustic home sound.
                </p>
              </div>
              <div className="mt-6 pt-4">
                <Link
                  href="/category/audio"
                  prefetch={true}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  <span>Discover Audio Gear</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}