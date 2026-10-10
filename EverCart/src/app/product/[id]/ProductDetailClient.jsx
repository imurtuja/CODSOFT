'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ProductDetailSkeleton from '../../../components/skeletons/ProductDetailSkeleton'
import { addToCart as saveProductToCart, isItemInCart } from '../../../utils/cartManager'
import { toast } from '../../../components/Toast'
import { fetchCached } from '../../../utils/apiCache'

export default function ProductDetailClient({ initialProduct, productId }) {
  const router = useRouter()
  const currentId = productId || initialProduct?._id || initialProduct?.id
  const [product, setProduct] = useState(initialProduct || null)
  const [loading, setLoading] = useState(!initialProduct)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isInCart, setIsInCart] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageOrientation, setImageOrientation] = useState('portrait')
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(true)
  const [isSpecsOpen, setIsSpecsOpen] = useState(true)

  const checkCartState = useCallback(() => {
    const pid = product?._id || product?.id || currentId
    if (pid) {
      setIsInCart(isItemInCart(pid))
    }
  }, [product?._id, product?.id, currentId])

  useEffect(() => {
    checkCartState()
    window.addEventListener('cartUpdated', checkCartState)
    return () => window.removeEventListener('cartUpdated', checkCartState)
  }, [checkCartState])

  const fetchProduct = useCallback(async () => {
    if (!currentId) return
    try {
      const data = await fetchCached(`/api/products/${currentId}`)
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }, [currentId])

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct)
      setLoading(false)
      setSelectedImage(0)
    }
  }, [initialProduct])

  useEffect(() => {
    if (!initialProduct && currentId) {
      fetchProduct()
    }
    // Prefetch high-intent routes for instant 0ms transition
    router.prefetch('/cart')
    router.prefetch('/checkout')
  }, [currentId, initialProduct, fetchProduct, router])

  // Dynamically detect orientation of the active image
  useEffect(() => {
    const currentSrc = product?.images?.[selectedImage] || product?.image
    if (!currentSrc || typeof window === 'undefined') return
    setImageError(false)
    const img = new window.Image()
    img.src = currentSrc
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth * 1.05) {
        setImageOrientation('portrait')
      } else {
        setImageOrientation('landscape')
      }
    }
  }, [selectedImage, product])

  // Bulletproof body scroll lock when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'

      const preventDefault = (e) => {
        e.preventDefault()
      }
      window.addEventListener('wheel', preventDefault, { passive: false })
      window.addEventListener('touchmove', preventDefault, { passive: false })

      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
        window.scrollTo(0, scrollY)
        window.removeEventListener('wheel', preventDefault)
        window.removeEventListener('touchmove', preventDefault)
      }
    }
  }, [isLightboxOpen])

  // Mouse & touch drag-to-pan handlers for zoomed image
  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    if (zoomLevel <= 1 || e.touches.length !== 1) return
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    })
  }

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
        setZoomLevel(1)
        setPan({ x: 0, y: 0 })
      } else if (e.key === 'ArrowRight' && product?.images?.length > 1) {
        setSelectedImage((prev) => (prev + 1) % product.images.length)
        setZoomLevel(1)
        setPan({ x: 0, y: 0 })
      } else if (e.key === 'ArrowLeft' && product?.images?.length > 1) {
        setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
        setZoomLevel(1)
        setPan({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, product?.images?.length])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const calculateDiscount = () => {
    if (product?.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    }
    return 0
  }

  const addToCart = () => {
    if (!product || (!product._id && !product.id) || product.stock <= 0) return

    setAddingToCart(true)
    setJustAdded(true)
    saveProductToCart(product, quantity)
    setIsInCart(true)
    const shortName = product.name?.length > 22 ? `${product.name.slice(0, 22)}…` : (product.name || 'Item')
    toast.success(`Added ${quantity > 1 ? `${quantity} × ` : ''}"${shortName}" to cart!`)

    setTimeout(() => setAddingToCart(false), 250)
    setTimeout(() => setJustAdded(false), 1400)
  }

  const handleBuyNow = () => {
    if (!product || (!product._id && !product.id) || product.stock <= 0) return

    setBuyingNow(true)
    const buyNowItem = {
      product: product._id || product.id,
      id: product._id || product.id,
      _id: product._id || product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      image: (product.images && product.images[0]) || '/placeholder.png',
      category: product.category,
      brand: product.brand,
      quantity: quantity,
      stock: product.stock
    }

    try {
      sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
      sessionStorage.setItem('isDirectCheckout', 'true')
      router.push('/checkout')
    } catch (e) {
      console.error('Failed to set buyNowItem:', e)
      setBuyingNow(false)
      router.push('/checkout')
    }
  }

  if (loading) return <ProductDetailSkeleton />
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
          <Link href="/" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const discount = calculateDiscount()
  const images = product.images || []

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs sm:text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/category/${product.category}`} className="hover:text-gray-900 capitalize transition-colors">
            {product.category}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium truncate max-w-[280px] sm:max-w-md">{product.name}</span>
        </nav>

        {/* Main Product Layout: 45% Gallery (Amazon-style left thumbnails & directly rounded image) + 55% Details Column */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12 items-start justify-between">
          {/* Left: Gallery Column (45% Width on Desktop) */}
          <div className="w-full lg:w-[45%] shrink-0 lg:sticky lg:top-24">
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
              {/* Amazon-style Left Thumbnails Strip */}
              {images.length > 1 && (
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[68vh] no-scrollbar shrink-0 w-full sm:w-[68px] lg:w-[72px] py-0.5">
                  {images.map((image, index) => {
                    const isSelected = selectedImage === index
                    return (
                      <button
                        key={index}
                        type="button"
                        onMouseEnter={() => {
                          setSelectedImage(index)
                          setZoomLevel(1)
                          setPan({ x: 0, y: 0 })
                        }}
                        onClick={() => {
                          setSelectedImage(index)
                          setZoomLevel(1)
                          setPan({ x: 0, y: 0 })
                        }}
                        className={`relative flex-shrink-0 w-14 h-14 sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-xl p-1 bg-white border transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-gray-900 ring-2 ring-gray-900/15 shadow-xs'
                            : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                        }`}
                        title={`View photo ${index + 1}`}
                      >
                        <Image
                          src={image}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          width={72}
                          height={72}
                          className="w-full h-full object-contain rounded-lg"
                          unoptimized
                        />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Fixed Main Product Image Stage (65-70% viewport height, smooth hover scale, NO outer border/box) */}
              <div className="flex-1 w-full min-w-0">
                <div
                  onClick={() => {
                    if (images.length > 0 && !imageError) {
                      setIsLightboxOpen(true)
                      setZoomLevel(1)
                      setPan({ x: 0, y: 0 })
                    }
                  }}
                  className="relative w-full h-[400px] sm:h-[480px] lg:h-[68vh] min-h-[460px] max-h-[720px] rounded-2xl overflow-hidden flex items-center justify-center cursor-zoom-in select-none group"
                  title="Click to open full-screen preview"
                >
                  {images.length > 0 && !imageError ? (
                    <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden">
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        width={900}
                        height={900}
                        priority
                        className="w-full h-full object-contain rounded-2xl pointer-events-none transition-transform duration-500 ease-out transform-gpu group-hover:scale-110 sm:group-hover:scale-115"
                        onError={() => setImageError(true)}
                        unoptimized
                      />
                      {/* Floating Zoom / Expand Icon Hint */}
                      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <span>Click to expand</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <span className="text-6xl mb-2">📦</span>
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>

                {/* Gallery footer hint */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400 px-1">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span>Hover to zoom &middot; Click to expand</span>
                  </span>
                  {images.length > 1 && (
                    <span className="font-medium text-gray-500">{selectedImage + 1} / {images.length}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Product Info & Purchase Column (55% Width on Desktop) */}
          <div className="w-full lg:w-[55%] min-w-0 flex-1 space-y-4 sm:space-y-5">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.brand && (
                  <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {product.brand}
                  </span>
                )}
                <span className="text-xs font-semibold text-gray-400 capitalize">
                  in {product.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Rating & Stock Status (Private Stock - No numbers, No 100% Genuine badge) */}
              <div className="flex items-center gap-2.5 mt-2.5 flex-wrap">
                {product.rating && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-md shadow-2xs">
                    <span className="text-amber-500 text-xs font-black">★</span>
                    <span className="text-xs font-bold text-amber-900">{product.rating}</span>
                    <span className="text-[11px] text-amber-700/80 font-medium">Rating</span>
                  </div>
                )}
                {product.stock <= 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Currently Unavailable</span>
                  </span>
                )}
              </div>
            </div>

            {/* Price Section (Clean, Directly on Page - No Box) */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  {formatPrice(product.price)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-base sm:text-lg text-gray-400 line-through font-normal">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Inclusive of all taxes &middot; Free shipping available
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Actions Bar: Add to Cart & Buy Now side-by-side (Count stepper removed for clean UI) */}
            {product.stock > 0 && (
              <div className="pt-1 grid grid-cols-2 gap-3">
                {/* Primary CTA: Add to Cart / View in Cart */}
                {isInCart && !justAdded ? (
                  <Link
                    href="/cart"
                    prefetch={true}
                    className="evercart-add-to-cart-btn w-full h-11 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 text-sm active:scale-95 cursor-pointer shadow-sm text-white"
                  >
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="cart-svg text-white shrink-0" fill="white" viewBox="0 0 576 512" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="product-svg">
                        <path d="M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0h12.6c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7V448c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64V197.7l-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0h12.6z" />
                      </svg>
                    </div>
                    <span>VIEW IN CART</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={product.stock <= 0 || addingToCart}
                    className="evercart-add-to-cart-btn w-full h-11 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 active:scale-95 cursor-pointer shadow-sm text-white"
                  >
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="cart-svg text-white shrink-0" fill="white" viewBox="0 0 576 512" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="product-svg">
                        <path d="M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0h12.6c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7V448c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64V197.7l-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0h12.6z" />
                      </svg>
                    </div>
                    <span>{justAdded ? 'ADDED TO CART!' : 'ADD TO CART'}</span>
                  </button>
                )}

                {/* Secondary CTA: Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0 || buyingNow}
                  className="evercart-buy-now-btn w-full h-11 px-4 rounded-xl font-bold flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {buyingNow ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="btn-text">Preparing Checkout...</span>
                    </span>
                  ) : (
                    <>
                      <svg viewBox="0 0 16 16" className="bi-cart-check-svg shrink-0" height={20} width={20} xmlns="http://www.w3.org/2000/svg" fill="#181717">
                        <path d="M11.354 6.354a.5.5 0 0 0-.708-.708L8 8.293 6.854 7.146a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z" />
                        <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                      </svg>
                      <span className="btn-text">Buy Now</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Interactive Clean Sections: Key Features & Technical Specifications */}
            <div className="pt-2 divide-y divide-gray-100 border-t border-gray-100">
              {/* 1. Key Features Section */}
              {product.features && product.features.length > 0 && (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => setIsFeaturesOpen(!isFeaturesOpen)}
                    className="w-full flex items-center justify-between text-left group cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Direct Lucide Hash Icon (No box, no hover effect) */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-900 shrink-0"
                      >
                        <line x1="4" x2="20" y1="9" y2="9"/>
                        <line x1="4" x2="20" y1="15" y2="15"/>
                        <line x1="10" x2="8" y1="3" y2="21"/>
                        <line x1="16" x2="14" y1="3" y2="21"/>
                      </svg>
                      <h3 className="text-sm font-bold text-gray-900 transition-colors">
                        Key Features
                      </h3>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                        {product.features.length} Highlights
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isFeaturesOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isFeaturesOpen && (
                    <div className="mt-3.5 space-y-3 animate-in fade-in duration-200">
                      {product.features.map((feature, index) => {
                        const words = feature.split(' ')
                        const hasColon = feature.includes(':')
                        let lead = ''
                        let rest = feature

                        if (hasColon) {
                          const [h, ...t] = feature.split(':')
                          lead = h.trim()
                          rest = t.join(':').trim()
                        } else if (words.length > 4) {
                          lead = words.slice(0, 3).join(' ')
                          rest = words.slice(3).join(' ')
                        }

                        return (
                          <div key={index} className="flex items-start gap-2.5 text-xs sm:text-sm">
                            {/* Lucide Line Dot Left Horizontal Pointer */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-line-dot-left-horizontal preview-icon text-emerald-600 shrink-0 mt-0.5"
                            >
                              <path d="M9 12h12" />
                              <circle cx="6" cy="12" r="3" />
                            </svg>
                            <div className="leading-relaxed">
                              {lead ? (
                                <>
                                  <span className="font-bold text-gray-950">{lead}</span>{' '}
                                  <span className="text-gray-600 font-normal">{rest}</span>
                                </>
                              ) : (
                                <span className="text-gray-800 font-medium">{feature}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Technical Specifications Section */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                    className="w-full flex items-center justify-between text-left group cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Direct Lucide Drone Icon (No box, no hover effect) */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-900 shrink-0"
                      >
                        <path d="M10 10 7 7"/>
                        <path d="m10 14-3 3"/>
                        <path d="m14 10 3-3"/>
                        <path d="m14 14 3 3"/>
                        <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/>
                        <path d="M19.637 14a4 4 0 1 1-5.432 5.868"/>
                        <path d="M4.367 10a4 4 0 1 1 5.438-5.862"/>
                        <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/>
                        <rect x="10" y="8" width="4" height="8" rx="1"/>
                      </svg>
                      <h3 className="text-sm font-bold text-gray-900 transition-colors">
                        Technical Specifications
                      </h3>
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {Object.keys(product.specifications).length} Specs
                      </span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-300 ${isSpecsOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isSpecsOpen && (
                    <div className="mt-3.5 divide-y divide-gray-100 text-xs sm:text-sm animate-in fade-in duration-200">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div
                          key={key}
                          className="group flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-6 py-2.5 sm:py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50/70 transition-colors"
                        >
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider sm:w-1/3 shrink-0">
                            {key}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900 sm:text-right sm:w-2/3 break-words leading-relaxed">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modern Interactive Lightbox Modal */}
      {isLightboxOpen && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-hidden select-none touch-none flex items-center justify-center transition-all duration-300 animate-in fade-in"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Top Bar: Counter & Close button (FIXED) */}
          <div className="fixed top-4 left-4 right-4 flex items-center justify-between z-[120] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white/90 text-sm font-medium shadow-lg">
              <span>{selectedImage + 1} / {images.length}</span>
              {zoomLevel > 1 && (
                <span className="text-xs text-white/60 pl-1 border-l border-white/20">
                  Drag image to pan
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLightboxOpen(false)
                setZoomLevel(1)
                setPan({ x: 0, y: 0 })
              }}
              className="pointer-events-auto text-white/90 hover:text-white bg-black/60 hover:bg-black/80 p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-colors shadow-lg"
              title="Close (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Arrows: Left and Right (FIXED) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
                  setZoomLevel(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-[120] text-white/90 hover:text-white bg-black/60 hover:bg-black/80 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-105"
                title="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage((prev) => (prev + 1) % images.length)
                  setZoomLevel(1)
                  setPan({ x: 0, y: 0 })
                }}
                className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-[120] text-white/90 hover:text-white bg-black/60 hover:bg-black/80 p-3 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-105"
                title="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Center Image Canvas with Pan and Zoom (Zero Scrollbars) */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDragging) {
                setIsLightboxOpen(false)
                setZoomLevel(1)
                setPan({ x: 0, y: 0 })
              }
            }}
          >
            <div 
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onClick={(e) => {
                e.stopPropagation()
                if (zoomLevel === 1) {
                  setZoomLevel(2)
                }
              }}
              className={`relative select-none flex items-center justify-center ${
                zoomLevel > 1 
                  ? 'cursor-grab active:cursor-grabbing' 
                  : 'cursor-zoom-in'
              }`}
              style={{
                transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              <div className="relative rounded-2xl overflow-hidden drop-shadow-2xl inline-block">
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  width={900}
                  height={900}
                  className={`pointer-events-none rounded-2xl object-contain ${
                    imageOrientation === 'portrait'
                      ? 'max-h-[68vh] sm:max-h-[76vh] w-auto'
                      : 'max-h-[58vh] sm:max-h-[70vh] max-w-[85vw] w-auto'
                  }`}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Floating Corner Zoom Controls (STRICTLY FIXED in bottom-right corner) */}
          <div 
            className="fixed bottom-6 right-6 z-[120] flex items-center gap-1.5 bg-black/60 text-white backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Zoom Out Button */}
            <button
              type="button"
              onClick={() => {
                setZoomLevel((prev) => {
                  const next = Math.max(1, +(prev - 0.5).toFixed(1))
                  if (next === 1) setPan({ x: 0, y: 0 })
                  return next
                })
              }}
              disabled={zoomLevel <= 1}
              className="text-white/80 hover:text-white disabled:opacity-30 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>

            {/* Zoom Level Indicator / Reset Button */}
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1)
                setPan({ x: 0, y: 0 })
              }}
              className="text-white text-xs font-semibold px-2 py-1 rounded bg-white/15 hover:bg-white/25 transition-colors min-w-[48px] text-center"
              title="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            {/* Zoom In Button */}
            <button
              type="button"
              onClick={() => {
                setZoomLevel((prev) => Math.min(3, +(prev + 0.5).toFixed(1)))
              }}
              disabled={zoomLevel >= 3}
              className="text-white/80 hover:text-white disabled:opacity-30 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Bottom Thumbnails Strip (STRICTLY FIXED in bottom-center) */}
          {images.length > 1 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 max-w-[80vw] overflow-x-auto shadow-xl">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(index)
                    setZoomLevel(1)
                    setPan({ x: 0, y: 0 })
                  }}
                  className={`flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-lg p-0.5 overflow-hidden transition-all ${
                    selectedImage === index 
                      ? 'ring-2 ring-white scale-105' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image}
                    alt=""
                    width={52}
                    height={52}
                    className="w-full h-full object-contain rounded-md"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}