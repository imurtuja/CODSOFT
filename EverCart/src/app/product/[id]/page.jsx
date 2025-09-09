'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '../../../components/Loading'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showViewCart, setShowViewCart] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

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
    const user = localStorage.getItem('currentUser')
    if (!user) {
      window.location.href = '/login'
      return
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const id = product._id || product.id
    const item = cart.find(cartItem => cartItem.id === id)
    
    if (item) {
      item.quantity += quantity
    } else {
      cart.push({
        id: id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: quantity,
        brand: product.brand
      })
    }
    
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    setShowViewCart(true)
  }

  if (loading) return <Loading />
  
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
        <nav className="text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/category/${product.category}`} className="hover:text-gray-900 capitalize">
            {product.category}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-w-1 aspect-h-1 w-full mb-4">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-96 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-6xl text-gray-400">📦</div>
                </div>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-black' : ''
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.brand}</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              {product.rating && (
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {discount > 0 && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                      {discount}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-green-600 text-sm">Inclusive of all taxes</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <p className="text-green-600 font-medium">In Stock</p>
              ) : (
                <p className="text-red-600 font-medium">Out of Stock</p>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            {product.stock > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-6">
                  <label htmlFor="quantity" className="font-medium text-gray-900">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-l-md"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 border-l border-r border-gray-300 bg-white text-center min-w-[50px]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(Math.min(product.stock, 10), quantity + 1))}
                      className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-r-md"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                 <div className="flex space-x-4">
                   {showViewCart ? (
                     <Link
                       href="/cart"
                       className="flex-1 bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 transition-colors text-center"
                     >
                       View Cart
                     </Link>
                   ) : (
                     <button
                       onClick={addToCart}
                       className="flex-1 bg-black text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                     >
                       Add to Cart
                     </button>
                   )}
                   <Link
                     href="/cart"
                     className="flex-1 bg-gray-200 text-black py-3 rounded-md font-medium hover:bg-gray-300 transition-colors text-center"
                   >
                     View Cart
                   </Link>
                 </div>
              </div>
            )}

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Key Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Specifications</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex">
                        <dt className="font-medium text-gray-900 w-1/3">{key}:</dt>
                        <dd className="text-gray-700 w-2/3">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}