'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '../../components/Loading'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)
  const [updatedOrder, setUpdatedOrder] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    price: '',
    originalPrice: '',
    description: '',
    category: '',
    stock: '',
    rating: '',
    sku: '',
    status: 'active',
    isFeatured: false,
    images: [],
    features: [],
    specifications: {},
    tags: []
  })

  useEffect(() => {
    checkAuth()
    loadData()
  }, [activeTab])

  const checkAuth = () => {
    const user = localStorage.getItem('currentUser')
    if (!user) {
      alert('Please login to access admin panel')
      window.location.href = '/login'
      return
    }
    
    const userData = JSON.parse(user)
    if (userData.role !== 'admin') {
      alert('Access denied. Admin privileges required.')
      window.location.href = '/'
      return
    }
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      if (activeTab === 'products') {
        const response = await fetch(`${window.location.origin}/api/products`)
        const data = await response.json()
        setProducts(data.products || [])
      } else if (activeTab === 'orders') {
        const response = await fetch(`${window.location.origin}/api/orders?admin=true`)
        const data = await response.json()
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm)
      })
      
      if (response.ok) {
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!')
        setShowProductModal(false)
        setEditingProduct(null)
        resetForm()
        loadData()
      } else {
        alert('Error saving product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name || '',
      brand: product.brand || '',
      price: product.price || '',
      originalPrice: product.originalPrice || '',
      description: product.description || '',
      category: product.category || '',
      stock: product.stock || '',
      rating: product.rating || '',
      sku: product.sku || '',
      status: product.status || 'active',
      isFeatured: product.isFeatured || false,
      images: product.images || [],
      features: product.features || [],
      specifications: product.specifications || {},
      tags: product.tags || []
    })
    setShowProductModal(true)
  }

  const resetForm = () => {
    setProductForm({
      name: '',
      brand: '',
      price: '',
      originalPrice: '',
      description: '',
      category: '',
      stock: '',
      rating: '',
      sku: '',
      status: 'active',
      isFeatured: false,
      images: [],
      features: [],
      specifications: {},
      tags: []
    })
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      console.log('Updating order status:', orderId, 'to', newStatus)
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Order updated successfully:', result)
        
        // Update the local state immediately for better UX
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, orderStatus: newStatus }
              : order
          )
        )
        
        // Clear updating state and show success
        setUpdatingOrder(null)
        setUpdatedOrder(orderId)
        
        // Hide success message after 2 seconds
        setTimeout(() => {
          setUpdatedOrder(null)
        }, 2000)
        
        console.log('Order status updated to:', newStatus)
      } else {
        const errorData = await response.json()
        console.error('Failed to update order:', errorData)
        alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`)
        setUpdatingOrder(null)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
      setUpdatingOrder(null)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (loading) return <Loading />

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage products and orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'products' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === 'orders' ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Orders
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Products</h2>
                    <button
                      onClick={() => {
                        resetForm()
                        setEditingProduct(null)
                        setShowProductModal(true)
                      }}
                      className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Add Product
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Stock</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Featured</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                  {product.images && product.images.length > 0 ? (
                                    <Image 
                                      src={product.images[0]} 
                                      alt={product.name}
                                      width={32}
                                      height={32}
                                      className="w-full h-full object-cover rounded-lg"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'block'
                                      }}
                                    />
                                  ) : null}
                                  <span className="text-gray-400 text-xs" style={{display: product.images && product.images.length > 0 ? 'none' : 'block'}}>📦</span>
                                </div>
                                <div className="ml-3 min-w-0 flex-1">
                                  <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{product.brand}</div>
                                  {product.sku && (
                                    <div className="text-xs text-gray-400 truncate">SKU: {product.sku}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium">{formatPrice(product.price)}</div>
                                {product.originalPrice && product.originalPrice > product.price && (
                                  <div className="text-xs text-gray-500 line-through">
                                    {formatPrice(product.originalPrice)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.stock > 10 ? 'bg-green-100 text-green-800' : 
                                product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.status || 'active'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.isFeatured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {product.isFeatured ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Orders</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Order ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              #{order._id?.slice(-8)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="truncate">
                                {order.shippingAddress?.firstName || order.shipping?.firstName} {order.shippingAddress?.lastName || order.shipping?.lastName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatPrice(order.totalAmount || order.total)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col space-y-1">
                                <select
                                  value={order.orderStatus || 'confirmed'}
                                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                  disabled={updatingOrder === order._id}
                                  className={`text-xs border border-gray-300 rounded px-2 py-1 ${
                                    updatingOrder === order._id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <option value="confirmed">Confirmed</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                {updatingOrder === order._id && (
                                  <span className="text-xs text-blue-600">Updating...</span>
                                )}
                                {updatedOrder === order._id && (
                                  <span className="text-xs text-green-600">✓ Updated</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">
                              <Link
                                href={`/order/${order._id}`}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleProductSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                      <input
                        type="text"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter brand name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={productForm.sku || ''}
                        onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="e.g., MBAIRM2256, WH1000XM5"
                      />
                      <p className="text-xs text-gray-500 mt-1">Unique identifier for inventory management (optional)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="electronics">electronics</option>
                        <option value="Computers">Computers</option>
                        <option value="computers">computers</option>
                        <option value="Mobile">Mobile</option>
                        <option value="mobile">mobile</option>
                        <option value="Audio">Audio</option>
                        <option value="audio">audio</option>
                        <option value="Gaming">Gaming</option>
                        <option value="gaming">gaming</option>
                        <option value="Accessories">Accessories</option>
                        <option value="accessories">accessories</option>
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="home & kitchen">home & kitchen</option>
                        <option value="Health & Fitness">Health & Fitness</option>
                        <option value="health & fitness">health & fitness</option>
                        {productForm.category && !['Electronics', 'electronics', 'Computers', 'computers', 'Mobile', 'mobile', 'Audio', 'audio', 'Gaming', 'gaming', 'Accessories', 'accessories', 'Home & Kitchen', 'home & kitchen', 'Health & Fitness', 'health & fitness'].includes(productForm.category) && (
                          <option value={productForm.category}>{productForm.category}</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      placeholder="Enter detailed product description"
                      rows="4"
                      required
                    />
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Pricing & Stock</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                      <input
                        type="number"
                        value={productForm.originalPrice}
                        onChange={(e) => setProductForm({...productForm, originalPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter original price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                      <input
                        type="number"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter stock quantity"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Product Images */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Images</h4>
                  <div className="space-y-3">
                    {productForm.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...productForm.images]
                            newImages[index] = e.target.value
                            setProductForm({...productForm, images: newImages})
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = productForm.images.filter((_, i) => i !== index)
                            setProductForm({...productForm, images: newImages})
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {productForm.images.length < 10 && (
                      <button
                        type="button"
                        onClick={() => setProductForm({...productForm, images: [...productForm.images, '']})}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        + Add Image
                      </button>
                    )}
                    <p className="text-xs text-gray-500">Maximum 10 images allowed</p>
                  </div>
                </div>

                {/* Product Features */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Features</h4>
                  <div className="space-y-3">
                    {productForm.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...productForm.features]
                            newFeatures[index] = e.target.value
                            setProductForm({...productForm, features: newFeatures})
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                          placeholder="Enter product feature"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = productForm.features.filter((_, i) => i !== index)
                            setProductForm({...productForm, features: newFeatures})
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {productForm.features.length < 10 && (
                      <button
                        type="button"
                        onClick={() => setProductForm({...productForm, features: [...productForm.features, '']})}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        + Add Feature
                      </button>
                    )}
                    <p className="text-xs text-gray-500">Maximum 10 features allowed</p>
                  </div>
                </div>

                {/* Product Specifications */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Specifications</h4>
                  <div className="space-y-3">
                    {Object.entries(productForm.specifications).map(([key, value], index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newSpecs = {...productForm.specifications}
                            delete newSpecs[key]
                            newSpecs[e.target.value] = value
                            setProductForm({...productForm, specifications: newSpecs})
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                          placeholder="e.g., Display, Processor, Battery"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newSpecs = {...productForm.specifications}
                              newSpecs[key] = e.target.value
                              setProductForm({...productForm, specifications: newSpecs})
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                            placeholder="e.g., 6.8-inch AMOLED, Snapdragon 8 Gen 3"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecs = {...productForm.specifications}
                              delete newSpecs[key]
                              setProductForm({...productForm, specifications: newSpecs})
                            }}
                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = {...productForm.specifications}
                        newSpecs[''] = ''
                        setProductForm({...productForm, specifications: newSpecs})
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      + Add Specification
                    </button>
                    <p className="text-xs text-gray-500">Maximum 15 specifications allowed. Format: Specification Name: Value</p>
                    <p className="text-xs text-gray-400">Example: Display: 6.8-inch Dynamic AMOLED 2X | Processor: Snapdragon 8 Gen 3 | Battery: 5000mAh with 45W charging</p>
                  </div>
                </div>

                {/* Product Tags */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Product Tags</h4>
                  <div className="space-y-3">
                    {productForm.tags.map((tag, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tag}
                          onChange={(e) => {
                            const newTags = [...productForm.tags]
                            newTags[index] = e.target.value
                            setProductForm({...productForm, tags: newTags})
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                          placeholder="Enter product tag (e.g., laptop, apple, ultrabook)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = productForm.tags.filter((_, i) => i !== index)
                            setProductForm({...productForm, tags: newTags})
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {productForm.tags.length < 10 && (
                      <button
                        type="button"
                        onClick={() => setProductForm({...productForm, tags: [...productForm.tags, '']})}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        + Add Tag
                      </button>
                    )}
                    <p className="text-xs text-gray-500">Maximum 10 tags allowed. Use tags to help customers find your products.</p>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={productForm.rating}
                        onChange={(e) => setProductForm({...productForm, rating: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                        placeholder="Enter rating (0-5)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={productForm.status || 'active'}
                        onChange={(e) => setProductForm({...productForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        checked={productForm.isFeatured}
                        onChange={(e) => setProductForm({...productForm, isFeatured: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                        Featured Product (show on homepage)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}