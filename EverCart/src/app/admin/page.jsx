'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Loading from '../../components/Loading'
import NotFoundView from '../../components/NotFoundView'
import { toast } from '../../components/Toast'

// Status badge dot color
function statusDotColor(st) {
  switch (st) {
    case 'delivered': return 'bg-emerald-500'
    case 'shipped': return 'bg-purple-500'
    case 'processing': return 'bg-indigo-500'
    case 'confirmed': return 'bg-blue-500'
    case 'cancelled': return 'bg-rose-500'
    case 'pending': default: return 'bg-amber-500'
  }
}

// Payment method display label
function getPaymentMethodDisplay(order) {
  if (!order) return 'Cash on Delivery'
  if (order.paymentMethod === 'cod') return 'Cash on Delivery'
  const method = order.payment?.method || order.paymentDetails?.method || order.paymentMode
  if (method) {
    const m = String(method).toLowerCase()
    if (m === 'upi') return 'UPI'
    if (m === 'card') return 'Card'
    if (m === 'netbanking') return 'Net Banking'
    if (m === 'wallet') return 'Wallet'
  }
  return 'UPI / Card'
}

// Storefront origin resolution
function getStorefrontUrl(path = '/') {
  if (typeof window === 'undefined') return path
  const host = window.location.host || ''
  const protocol = window.location.protocol || 'http:'
  const cleanPath = path.startsWith('/') ? path : `/${path}`

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const cleanHost = host.replace(/^admin\./, '')
    return `${protocol}//${cleanHost}${cleanPath}`
  }

  if (host.startsWith('admin.')) {
    const cleanHost = host.replace(/^admin\./, '')
    return `${protocol}//${cleanHost}${cleanPath}`
  }

  return `https://evercart.murtuja.in${cleanPath}`
}

// Copy-to-clipboard cell with tooltip
function CopyableCell({ text, displayText, className = '', copyLabel = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e) => {
    e.stopPropagation()
    if (!text || text === '-') return
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(copyLabel ? `${copyLabel} copied` : 'Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!text || text === '-') {
    return <span className={`text-gray-400 text-xs ${className}`}>{displayText || '-'}</span>
  }

  return (
    <div className="relative group/copy inline-flex items-center">
      <button
        type="button"
        onClick={handleCopy}
        className={`text-left transition-colors cursor-pointer select-none focus:outline-none hover:text-black ${className}`}
        title={`Click to copy ${copyLabel || 'text'}`}
      >
        {displayText || text}
      </button>

      {/* Hover tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 pointer-events-none hidden group-hover/copy:flex flex-col items-center z-30">
        <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mb-1" />
        <div className="bg-gray-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-md whitespace-nowrap flex items-center gap-1">
          {copied ? (
            <>
              <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <span>Copy</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Checkbox input
function CustomCheckbox({ checked, indeterminate = false, onChange, title = '' }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={(e) => {
        e.stopPropagation()
        onChange && onChange(!checked)
      }}
      title={title}
      className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer select-none shrink-0 ${
        checked || indeterminate
          ? 'bg-black border-black text-white shadow-2xs'
          : 'bg-white border-gray-300 hover:border-gray-500 text-transparent'
      }`}
    >
      {indeterminate ? (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
        </svg>
      ) : checked ? (
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : null}
    </button>
  )
}

// Dropdown select
function CustomDropdown({
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  className = '',
  buttonClassName = '',
  align = 'left',
  size = 'sm',
  direction = 'down' // 'down' | 'up'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selected = options.find((o) => o.value === value) || { label: value || placeholder, value }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`inline-flex items-center justify-between gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-800 rounded-md font-medium transition-colors shadow-2xs outline-none focus:outline-none focus:border-gray-300 cursor-pointer select-none ${
          size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {selected.dot && <span className={`w-1.5 h-1.5 rounded-full ${selected.dot}`} />}
          <span className="capitalize">{selected.label}</span>
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 shrink-0 transition-transform duration-150 ${
            direction === 'up'
              ? (isOpen ? '' : 'rotate-180')
              : (isOpen ? 'rotate-180' : '')
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 ${
            direction === 'up' ? 'bottom-full mb-1.5' : 'mt-1'
          } min-w-[140px] bg-white rounded-lg border border-gray-200 shadow-xl py-1 text-xs animate-in fade-in duration-75 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-medium transition-colors cursor-pointer outline-none focus:outline-none ${
                  isSelected ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                  <span className="capitalize">{opt.label}</span>
                </span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' | 'products' | 'analytics'
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const [lastSyncTime, setLastSyncTime] = useState(null)

  // Order filtering and pagination state
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')
  const [orderSortBy, setOrderSortBy] = useState('newest') // 'newest' | 'oldest' | 'highest' | 'lowest'
  const [orderPage, setOrderPage] = useState(1)
  const [ordersPerPage, setOrdersPerPage] = useState(15)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [updatedOrderId, setUpdatedOrderId] = useState(null)
  const [inspectingOrder, setInspectingOrder] = useState(null)
  const [activeStatusMenu, setActiveStatusMenu] = useState(null) // { orderKey, currentStatus, rect }

  // Close status dropdown on outside click, scroll, or resize
  useEffect(() => {
    if (!activeStatusMenu) return
    const handleClose = () => setActiveStatusMenu(null)
    window.addEventListener('click', handleClose)
    window.addEventListener('scroll', handleClose, true)
    window.addEventListener('resize', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('scroll', handleClose, true)
      window.removeEventListener('resize', handleClose)
    }
  }, [activeStatusMenu])

  // Product catalog filters
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStockFilter, setProductStockFilter] = useState('all')
  const [updatingStockId, setUpdatingStockId] = useState(null)

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productFormSaving, setProductFormSaving] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    images: [''],
    features: [''],
    specifications: [{ key: '', value: '' }],
    tags: [''],
    rating: '4.8',
    status: 'active',
    isFeatured: false,
    isSpotlight: false
  })

  // Active tab indicator positioning
  const mainTabsRef = useRef(null)
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const updateTabIndicator = useCallback(() => {
    if (!mainTabsRef.current) return
    const activeBtn = mainTabsRef.current.querySelector(`[data-tab="${activeTab}"]`)
    if (activeBtn) {
      setTabIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      })
    }
  }, [activeTab])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      updateTabIndicator()
    })
    window.addEventListener('resize', updateTabIndicator)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateTabIndicator)
    }
  }, [updateTabIndicator, orders.length, products.length])

  const orderFiltersRef = useRef(null)
  const [filterIndicatorStyle, setFilterIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const updateFilterIndicator = useCallback(() => {
    if (!orderFiltersRef.current) return
    const activeBtn = orderFiltersRef.current.querySelector(`[data-filter="${orderStatusFilter}"]`)
    if (activeBtn) {
      setFilterIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      })
    }
  }, [orderStatusFilter])

  useEffect(() => {
    if (activeTab !== 'orders') return
    const raf = requestAnimationFrame(() => {
      updateFilterIndicator()
    })
    window.addEventListener('resize', updateFilterIndicator)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateFilterIndicator)
    }
  }, [updateFilterIndicator, activeTab, orders.length])

  // Session verification
  const verifySession = useCallback(async () => {
    setAuthChecking(true)
    try {
      if (typeof window === 'undefined') return false

      const rawStoredToken = localStorage.getItem('token')
      const storedToken = (rawStoredToken && rawStoredToken !== 'null' && rawStoredToken !== 'undefined') ? rawStoredToken.trim() : null
      const headers = {}
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`
      }

      // Verify session via endpoint and cookies
      const cookieRes = await fetch('/api/auth/admin-session', {
        headers,
        credentials: 'include',
        cache: 'no-store'
      }).catch(() => null)

      if (cookieRes && cookieRes.ok) {
        const data = await cookieRes.json().catch(() => ({}))
        if (data.authenticated && data.user && data.user.role === 'admin') {
          const validToken = (data.token && data.token !== 'null' && data.token !== 'undefined') ? data.token.trim() : storedToken
          if (validToken) {
            localStorage.setItem('token', validToken)
          }
          localStorage.setItem('currentUser', JSON.stringify(data.user))
          localStorage.setItem('user', JSON.stringify(data.user))
          setAdminUser(data.user)
          setIsAuthorized(true)
          setAuthChecking(false)
          return validToken || true
        }
      }

      // Check stored user
      const storedUserRaw = localStorage.getItem('currentUser')
      let storedUser = null
      try {
        storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null
      } catch (e) {}

      // Deny non-admin users without clearing their customer session
      if (storedUser && storedUser.role !== 'admin') {
        setIsAuthorized(false)
        setAdminUser(null)
        setAuthChecking(false)
        return false
      }

      setIsAuthorized(false)
      setAdminUser(null)
      setAuthChecking(false)
      return false
    } catch (err) {
      console.error('Session verify error:', err)
      setIsAuthorized(false)
      setAdminUser(null)
      setAuthChecking(false)
      return false
    }
  }, [])

  // Authorization headers for admin requests
  const getAdminHeaders = useCallback(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const token = (raw && raw !== 'null' && raw !== 'undefined') ? raw.trim() : null
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }, [])

  // Fetch products and orders data
  const loadData = useCallback(async (overrideToken = null) => {
    try {
      setLoading(true)
      const rawToken = overrideToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      const token = (rawToken && typeof rawToken === 'string' && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const [prodRes, ordersRes] = await Promise.all([
        fetch(`/api/products?admin=true&limit=1000&_t=${Date.now()}`, { 
          headers,
          credentials: 'include',
          cache: 'no-store' 
        }).catch(err => ({ ok: false, error: err.message })),
        fetch(`/api/orders?admin=true&_t=${Date.now()}`, { 
          headers,
          credentials: 'include',
          cache: 'no-store' 
        }).catch(err => ({ ok: false, error: err.message }))
      ])

      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json().catch(() => ({}))
        const list = Array.isArray(prodData.products) ? prodData.products : (Array.isArray(prodData) ? prodData : [])
        setProducts(list)
      } else {
        setProducts([])
      }

      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json().catch(() => [])
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      } else {
        setOrders([])
        if (ordersRes && (ordersRes.status === 401 || ordersRes.status === 403)) {
          console.warn('Orders fetch unauthorized status; admin credentials check.')
        }
      }

      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Error loading admin data:', error)
      setProducts([])
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifySession().then(authed => {
      if (authed) {
        const token = typeof authed === 'string' ? authed : null
        loadData(token)
      }
    })
  }, [verifySession, loadData])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin-session', {
        method: 'DELETE',
        credentials: 'include'
      }).catch(() => null)
    } catch (e) {}

    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('user')
    setIsAuthorized(false)
    setAdminUser(null)
    setOrders([])
    setProducts([])
    toast.info('Signed out of Admin Console')
    if (typeof window !== 'undefined') {
      window.location.href = getStorefrontUrl('/')
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId)
      const headers = getAdminHeaders()

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ orderStatus: newStatus })
      })

      if (response.ok) {
        setOrders(prev =>
          (Array.isArray(prev) ? prev : []).map(o =>
            (o._id === orderId || o.orderId === orderId)
              ? { ...o, orderStatus: newStatus }
              : o
          )
        )
        if (inspectingOrder && (inspectingOrder._id === orderId || inspectingOrder.orderId === orderId)) {
          setInspectingOrder(prev => ({ ...prev, orderStatus: newStatus }))
        }
        setUpdatedOrderId(orderId)
        setTimeout(() => setUpdatedOrderId(null), 2500)
        toast.success(`Order status set to ${newStatus.toUpperCase()}`)
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(`Failed to update status: ${err.error || 'Error'}`)
      }
    } catch (error) {
      toast.error('Network error updating order status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Bulk update order status
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrderIds.length === 0) return
    const count = selectedOrderIds.length
    if (!window.confirm(`Update ${count} selected order(s) to status "${newStatus.toUpperCase()}"?`)) {
      return
    }

    try {
      const headers = getAdminHeaders()

      await Promise.all(
        selectedOrderIds.map(id =>
          fetch(`/api/orders/${id}`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify({ orderStatus: newStatus })
          }).catch(e => console.error(e))
        )
      )

      setOrders(prev =>
        (Array.isArray(prev) ? prev : []).map(o => {
          const id = o.orderId || o._id
          return selectedOrderIds.includes(id) ? { ...o, orderStatus: newStatus } : o
        })
      )
      setSelectedOrderIds([])
      toast.success(`Updated ${count} orders to ${newStatus.toUpperCase()}`)
    } catch (e) {
      toast.error('Bulk update encountered an issue')
    }
  }

  // Quick inline stock adjustment
  const handleQuickStockAdjust = async (productId, delta) => {
    const product = products.find(p => p._id === productId)
    if (!product) return

    const currentStock = Number(product.stock) || 0
    const newStock = Math.max(0, currentStock + delta)
    if (newStock === currentStock) return

    try {
      setUpdatingStockId(productId)
      const headers = getAdminHeaders()

      // Optimistic update
      setProducts(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
          p._id === productId ? { ...p, stock: newStock } : p
        )
      )

      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ stock: newStock })
      })

      if (!response.ok) {
        // Revert on error
        setProducts(prev =>
          (Array.isArray(prev) ? prev : []).map(p =>
            p._id === productId ? { ...p, stock: currentStock } : p
          )
        )
        toast.error('Failed to sync stock update')
      }
    } catch (e) {
      toast.error('Network error updating stock')
    } finally {
      setUpdatingStockId(null)
    }
  }

  // Toggle featured flag
  const handleToggleProductFeatured = async (productId, currentVal) => {
    try {
      const headers = getAdminHeaders()

      // Optimistic update
      setProducts(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
          p._id === productId ? { ...p, isFeatured: !currentVal } : p
        )
      )

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ isFeatured: !currentVal })
      })

      if (res.ok) {
        toast.success(!currentVal ? 'Product marked as Featured on homepage' : 'Product removed from Featured')
      } else {
        // Revert on error
        setProducts(prev =>
          (Array.isArray(prev) ? prev : []).map(p =>
            p._id === productId ? { ...p, isFeatured: currentVal } : p
          )
        )
        toast.error('Failed to update featured status')
      }
    } catch (e) {
      toast.error('Network error updating featured status')
    }
  }

  // Toggle spotlight flag
  const handleToggleProductSpotlight = async (productId, nextSpotlight) => {
    const targetProd = (Array.isArray(products) ? products : []).find(p => p._id === productId)
    const prodName = targetProd?.name || 'Product'
    try {
      const headers = getAdminHeaders()

      // Optimistic update
      setProducts(prev =>
        (Array.isArray(prev) ? prev : []).map(p => {
          if (p._id === productId) {
            return { ...p, isSpotlight: nextSpotlight }
          }
          return nextSpotlight ? { ...p, isSpotlight: false } : p
        })
      )

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ isSpotlight: nextSpotlight })
      })

      if (res.ok) {
        toast.success(
          nextSpotlight
            ? `"${prodName}" is now the Top Spotlight Deal on Homepage!`
            : `Removed "${prodName}" from Homepage Spotlight`
        )
      } else {
        loadData()
        toast.error('Failed to update spotlight status')
      }
    } catch (e) {
      loadData()
      toast.error('Network error updating spotlight status')
    }
  }

  // Toggle active status
  const handleToggleProductStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const headers = getAdminHeaders()

      // Optimistic update
      setProducts(prev =>
        (Array.isArray(prev) ? prev : []).map(p =>
          p._id === productId ? { ...p, status: nextStatus } : p
        )
      )

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      })

      if (res.ok) {
        toast.success(`Product status set to ${nextStatus.toUpperCase()}`)
      } else {
        // Revert on error
        setProducts(prev =>
          (Array.isArray(prev) ? prev : []).map(p =>
            p._id === productId ? { ...p, status: currentStatus } : p
          )
        )
        toast.error('Failed to update product status')
      }
    } catch (e) {
      toast.error('Network error updating product status')
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Permanently delete "${productName}" from the store catalog?`)) {
      return
    }

    try {
      const headers = getAdminHeaders()

      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      })

      if (response.ok) {
        toast.success(`"${productName}" removed from catalog`)
        setProducts(prev => (Array.isArray(prev) ? prev : []).filter(p => p._id !== productId))
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || 'Failed to delete product')
      }
    } catch (e) {
      toast.error('Error deleting product')
    }
  }

  // Open edit modal
  const openEditModal = (product) => {
    setEditingProduct(product)
    
    // Map product specifications to key-value pairs
    let specsArray = []
    if (product.specifications) {
      if (typeof product.specifications === 'object') {
        const entries = product.specifications instanceof Map 
          ? Array.from(product.specifications.entries())
          : Object.entries(product.specifications)
        specsArray = entries.map(([key, value]) => ({ key, value }))
      }
    }
    if (specsArray.length === 0) specsArray = [{ key: '', value: '' }]

    setProductForm({
      name: product.name || '',
      brand: product.brand || '',
      sku: product.sku || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price ?? '',
      originalPrice: product.originalPrice ?? '',
      stock: product.stock ?? '',
      images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [''],
      features: Array.isArray(product.features) && product.features.length > 0 ? product.features : [''],
      specifications: specsArray,
      tags: Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : [''],
      rating: product.rating ?? '4.8',
      status: product.status || 'active',
      isFeatured: Boolean(product.isFeatured),
      isSpotlight: Boolean(product.isSpotlight)
    })
    setShowProductModal(true)
  }

  // Open add product modal
  const openAddModal = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      brand: '',
      sku: '',
      category: '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '',
      images: [''],
      features: [''],
      specifications: [{ key: '', value: '' }],
      tags: [''],
      rating: '4.8',
      status: 'active',
      isFeatured: false,
      isSpotlight: false
    })
    setShowProductModal(true)
  }

  // Save product
  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setProductFormSaving(true)

    try {
      const headers = getAdminHeaders()

      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products'

      // Sanitize image URLs
      const cleanImages = productForm.images
        .map(img => img.trim())
        .filter(Boolean)
        .slice(0, 10)

      // Sanitize features
      const cleanFeatures = productForm.features
        .map(f => f.trim())
        .filter(Boolean)
        .slice(0, 10)

      // Sanitize tags
      const cleanTags = productForm.tags
        .map(t => t.trim())
        .filter(Boolean)
        .slice(0, 10)

      // Sanitize specifications
      const cleanSpecs = {}
      productForm.specifications
        .slice(0, 15)
        .forEach(s => {
          if (s.key?.trim() && s.value?.trim()) {
            cleanSpecs[s.key.trim()] = s.value.trim()
          }
        })

      const payload = {
        name: productForm.name.trim(),
        brand: productForm.brand.trim(),
        sku: productForm.sku?.trim() || undefined,
        category: productForm.category.trim(),
        description: productForm.description.trim(),
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stock: Number(productForm.stock),
        rating: productForm.rating ? Number(productForm.rating) : 0,
        status: productForm.status || 'active',
        isFeatured: Boolean(productForm.isFeatured),
        isSpotlight: Boolean(productForm.isSpotlight),
        images: cleanImages,
        features: cleanFeatures,
        specifications: cleanSpecs,
        tags: cleanTags
      }

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json().catch(() => ({}))
        const savedProd = result.product
        toast.success(editingProduct ? 'Product details updated successfully!' : 'New product created successfully!')
        setShowProductModal(false)
        setEditingProduct(null)
        if (savedProd) {
          setProducts(prev => {
            const list = Array.isArray(prev) ? prev : []
            if (editingProduct) {
              return list.map(p => p._id === savedProd._id ? { ...p, ...savedProd } : p)
            } else {
              return [savedProd, ...list.filter(p => p._id !== savedProd._id)]
            }
          })
        }
        await loadData()
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err.error || 'Error saving product')
      }
    } catch (e) {
      toast.error('Network error saving product')
    } finally {
      setProductFormSaving(false)
    }
  }

  // Export orders to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.warning('No orders match the current filter to export')
      return
    }

    const headers = [
      'Order Ref',
      'Invoice Number',
      'Date Placed',
      'Customer Name',
      'Email',
      'Phone',
      'Address',
      'City',
      'State',
      'ZipCode',
      'Items Count',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Fulfillment Status'
    ]

    const rows = filteredOrders.map(o => {
      const ship = o.shippingAddress || o.shipping || {}
      const itemsCount = (Array.isArray(o.items) ? o.items : []).reduce((acc, it) => acc + (it.quantity || 1), 0)
      return [
        `"${o.orderId || o._id || ''}"`,
        `"${o.invoiceNumber || ''}"`,
        `"${new Date(o.orderDate || o.createdAt || Date.now()).toISOString().slice(0, 19).replace('T', ' ')}"`,
        `"${(ship.firstName || '')} ${(ship.lastName || '')}".trim()`,
        `"${ship.email || ''}"`,
        `"${ship.phone || ''}"`,
        `"${(ship.address || '').replace(/"/g, '""')}"`,
        `"${ship.city || ''}"`,
        `"${ship.state || ''}"`,
        `"${ship.zipCode || ''}"`,
        itemsCount,
        o.totalAmount || o.total || 0,
        `"${getPaymentMethodDisplay(o)}"`,
        `"${o.paymentStatus || 'pending'}"`,
        `"${o.orderStatus || 'pending'}"`
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `evercart-orders-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filteredOrders.length} orders to CSV`)
  }

  // Summary metrics
  const metrics = useMemo(() => {
    const validOrders = Array.isArray(orders) ? orders : []
    const validProducts = Array.isArray(products) ? products : []

    const nonCancelled = validOrders.filter(o => o.orderStatus !== 'cancelled')
    const totalRevenue = nonCancelled.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0)
    const aov = nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0

    const pendingFulfillment = validOrders.filter(o =>
      ['pending', 'confirmed', 'processing'].includes(o.orderStatus)
    ).length

    const deliveredCount = validOrders.filter(o => o.orderStatus === 'delivered').length
    const shippedCount = validOrders.filter(o => o.orderStatus === 'shipped').length

    const lowStockCount = validProducts.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length
    const outOfStockCount = validProducts.filter(p => Number(p.stock) <= 0).length

    const codOrders = nonCancelled.filter(o => o.paymentMethod === 'cod')
    const codRevenue = codOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0)
    const onlineOrders = nonCancelled.filter(o => o.paymentMethod !== 'cod')
    const onlineRevenue = onlineOrders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0)

    // Inclusive GST (18%) breakdown
    const taxableSales = Math.round((totalRevenue / 1.18) * 100) / 100
    const totalGst = Math.round((totalRevenue - taxableSales) * 100) / 100
    const cgst = Math.round((totalGst / 2) * 100) / 100
    const sgst = Math.round((totalGst - cgst) * 100) / 100

    return {
      totalRevenue,
      aov,
      totalOrders: validOrders.length,
      pendingFulfillment,
      deliveredCount,
      shippedCount,
      totalProducts: validProducts.length,
      lowStockCount,
      outOfStockCount,
      codRevenue,
      onlineRevenue,
      codCount: codOrders.length,
      onlineCount: onlineOrders.length,
      taxableSales,
      totalGst,
      cgst,
      sgst
    }
  }, [orders, products])

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return []
    let list = orders.filter(order => {
      if (orderStatusFilter !== 'all') {
        const st = (order.orderStatus || 'pending').toLowerCase()
        if (orderStatusFilter === 'action_required') {
          if (!['pending', 'confirmed', 'processing'].includes(st)) return false
        } else if (st !== orderStatusFilter.toLowerCase()) {
          return false
        }
      }

      if (orderPaymentFilter !== 'all') {
        const isCod = (order.paymentMethod || '').toLowerCase() === 'cod'
        if (orderPaymentFilter === 'cod' && !isCod) return false
        if (orderPaymentFilter === 'online' && isCod) return false
      }

      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase().trim()
        const orderIdStr = String(order.orderId || order._id || '').toLowerCase()
        const ship = order.shippingAddress || order.shipping || {}
        const custName = `${ship.firstName || ''} ${ship.lastName || ''}`.toLowerCase()
        const custEmail = String(ship.email || '').toLowerCase()
        const custPhone = String(ship.phone || '').toLowerCase()
        const custCity = String(ship.city || '').toLowerCase()
        const invoiceStr = String(order.invoiceNumber || '').toLowerCase()

        return (
          orderIdStr.includes(q) ||
          custName.includes(q) ||
          custEmail.includes(q) ||
          custPhone.includes(q) ||
          custCity.includes(q) ||
          invoiceStr.includes(q)
        )
      }
      return true
    })

    // Sort orders
    list = [...list].sort((a, b) => {
      const dateA = new Date(a.orderDate || a.createdAt || 0).getTime()
      const dateB = new Date(b.orderDate || b.createdAt || 0).getTime()
      const totalA = Number(a.totalAmount || a.total || 0)
      const totalB = Number(b.totalAmount || b.total || 0)

      if (orderSortBy === 'oldest') return dateA - dateB
      if (orderSortBy === 'highest') return totalB - totalA
      if (orderSortBy === 'lowest') return totalA - totalB
      return dateB - dateA // newest
    })

    return list
  }, [orders, orderStatusFilter, orderPaymentFilter, orderSearch, orderSortBy])

  // Paginated slice
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage
    return filteredOrders.slice(start, start + ordersPerPage)
  }, [filteredOrders, orderPage, ordersPerPage])

  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage))

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    return products.filter(product => {
      if (productCategoryFilter !== 'all' && product.category !== productCategoryFilter) {
        return false
      }

      const stock = Number(product.stock)
      if (productStockFilter === 'low_stock' && (stock > 5 || stock <= 0)) return false
      if (productStockFilter === 'out_of_stock' && stock > 0) return false
      if (productStockFilter === 'in_stock' && stock <= 0) return false

      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim()
        const name = String(product.name || '').toLowerCase()
        const brand = String(product.brand || '').toLowerCase()
        const sku = String(product.sku || '').toLowerCase()
        const cat = String(product.category || '').toLowerCase()
        return name.includes(q) || brand.includes(q) || sku.includes(q) || cat.includes(q)
      }
      return true
    })
  }, [products, productCategoryFilter, productStockFilter, productSearch])

  // Distinct categories
  const categoriesList = useMemo(() => {
    if (!Array.isArray(products)) return []
    const set = new Set()
    products.forEach(p => { if (p.category) set.add(p.category) })
    return Array.from(set)
  }, [products])

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString))
    } catch (e) {
      return String(dateString).slice(0, 10)
    }
  }

  const getStatusBadge = (status) => {
    const s = String(status || 'pending').toLowerCase()
    switch (s) {
      case 'delivered':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Delivered'
        }
      case 'shipped':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          dot: 'bg-indigo-500',
          label: 'Shipped'
        }
      case 'processing':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Processing'
        }
      case 'confirmed':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          dot: 'bg-sky-500',
          label: 'Confirmed'
        }
      case 'cancelled':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Cancelled'
        }
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Pending'
        }
    }
  }

  // Loading state
  if (authChecking) {
    return <Loading />
  }

  // Not found view for unauthorized visitors
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-white">
        <NotFoundView />
      </div>
    )
  }

  // Admin dashboard view
  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 font-sans antialiased pb-12">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-black text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
                EC
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-gray-900 leading-none">EverCart</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-gray-100 text-gray-800 border border-gray-200 rounded">
                  Admin
                </span>
              </div>
            </Link>

            <span className="text-gray-300 hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-[10px] tracking-wide">Live Store Connected</span>
            </div>
          </div>

          {/* Quick Actions & Admin Menu */}
          <div className="flex items-center gap-2">
            {/* Sync Button */}
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh database records"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden md:inline">Sync</span>
              {lastSyncTime && (
                <span className="hidden lg:inline text-[10px] text-gray-400 font-normal">
                  ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </button>

            {/* Storefront Link */}
            <a
              href={getStorefrontUrl('/')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 shadow-2xs transition-colors"
            >
              <span>Storefront</span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <div className="h-4 w-px bg-gray-200 hidden sm:block" />

            {/* User Pill & Sign Out */}
            <div className="flex items-center gap-2 pl-0.5">
              <div className="w-7 h-7 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {adminUser?.firstName ? adminUser.firstName[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {adminUser?.firstName ? `${adminUser.firstName} ${adminUser.lastName || ''}` : 'Administrator'}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  {adminUser?.email || ''}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Sign out of console"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 space-y-3.5">
        {/* Metrics strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Gross sales */}
          <div className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ₹
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Revenue
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatPrice(metrics.totalRevenue)}
            </div>
            <div className="text-[11px] text-gray-500 mt-1.5 flex items-center justify-between pt-1.5 border-t border-gray-100">
              <span>Avg. Order Value (AOV):</span>
              <span className="font-bold text-gray-800">{formatPrice(metrics.aov)}</span>
            </div>
          </div>

          {/* Total orders */}
          <div className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {metrics.deliveredCount} Delivered
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {metrics.totalOrders} <span className="text-xs font-semibold text-gray-400">Orders</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1.5 flex items-center justify-between pt-1.5 border-t border-gray-100">
              <span>Fulfillment rate:</span>
              <span className="font-bold text-gray-800">
                {metrics.totalOrders > 0 ? `${Math.round((metrics.deliveredCount / metrics.totalOrders) * 100)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Pending fulfillment */}
          <div className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                metrics.pendingFulfillment > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-600'
              }`}>
                {metrics.pendingFulfillment > 0 ? 'Urgent Queue' : 'All Clear'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-700 tracking-tight">
              {metrics.pendingFulfillment} <span className="text-xs font-semibold text-gray-400">To Pack</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100 truncate">
              Orders requiring courier dispatch
            </div>
          </div>

          {/* Inventory health */}
          <div className="bg-white rounded-xl border border-gray-200/90 p-3.5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                metrics.lowStockCount > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Low Stock` : 'Healthy'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              {metrics.totalProducts} <span className="text-xs font-semibold text-gray-400">SKUs</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1.5 flex items-center justify-between pt-1.5 border-t border-gray-100">
              <span>Out of stock:</span>
              <span className="font-bold text-rose-600">{metrics.outOfStockCount} items</span>
            </div>
          </div>
        </section>

        {/* Section tabs */}
        <section className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
            {/* Primary navigation tabs */}
            <nav ref={mainTabsRef} className="relative flex items-center gap-1 sm:gap-2 select-none overflow-x-auto no-scrollbar">
              {/* Tab underline indicator */}
              <div
                className="absolute -bottom-[1px] h-[2.5px] bg-black rounded-t-full transition-all duration-200 ease-out pointer-events-none z-10"
                style={{
                  transform: `translateX(${tabIndicatorStyle.left}px)`,
                  width: `${tabIndicatorStyle.width}px`,
                  opacity: tabIndicatorStyle.opacity,
                }}
              />

              {/* Orders tab */}
              <button
                data-tab="orders"
                onClick={() => setActiveTab('orders')}
                className={`relative py-3 px-3 text-xs sm:text-[13px] font-bold transition-colors duration-150 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'text-gray-950'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 rounded-t-lg'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'orders' ? 'text-gray-950' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="whitespace-nowrap">Orders</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-tabular transition-colors ${
                  activeTab === 'orders' ? 'bg-black text-white shadow-2xs' : 'bg-gray-100 text-gray-600'
                }`}>
                  {orders.length}
                </span>
              </button>

              {/* Inventory tab */}
              <button
                data-tab="products"
                onClick={() => setActiveTab('products')}
                className={`relative py-3 px-3 text-xs sm:text-[13px] font-bold transition-colors duration-150 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'products'
                    ? 'text-gray-950'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 rounded-t-lg'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'products' ? 'text-gray-950' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="whitespace-nowrap">Inventory</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-tabular transition-colors ${
                  activeTab === 'products' ? 'bg-black text-white shadow-2xs' : 'bg-gray-100 text-gray-600'
                }`}>
                  {products.length}
                </span>
              </button>

              {/* Reports tab */}
              <button
                data-tab="analytics"
                onClick={() => setActiveTab('analytics')}
                className={`relative py-3 px-3 text-xs sm:text-[13px] font-bold transition-colors duration-150 cursor-pointer flex items-center gap-2 ${
                  activeTab === 'analytics'
                    ? 'text-gray-950'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/80 rounded-t-lg'
                }`}
              >
                <svg className={`w-4 h-4 shrink-0 transition-colors ${activeTab === 'analytics' ? 'text-gray-950' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="whitespace-nowrap">Reports</span>
              </button>
            </nav>

            {/* Primary action */}
            <div className="flex items-center gap-2 pb-2 shrink-0">
              {activeTab === 'orders' && (
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              )}

              {activeTab === 'products' && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Product</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <section className="space-y-2.5 animate-in fade-in duration-150">
            {/* Status filter tabs */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
              <div
                ref={orderFiltersRef}
                className="relative flex items-center gap-1 p-1 bg-gray-100/80 border border-gray-200/80 rounded-xl overflow-x-auto no-scrollbar text-xs select-none w-fit max-w-full"
              >
                {/* Active filter pill */}
                <div
                  className="absolute top-1 bottom-1 bg-white rounded-lg shadow-xs border border-gray-200/70 transition-all duration-200 ease-out pointer-events-none"
                  style={{
                    transform: `translateX(${filterIndicatorStyle.left}px)`,
                    width: `${filterIndicatorStyle.width}px`,
                    opacity: filterIndicatorStyle.opacity,
                  }}
                />

                {[
                  { id: 'all', label: 'All Orders', count: orders.length, dot: 'bg-gray-400' },
                  { id: 'action_required', label: 'Action Required', count: metrics.pendingFulfillment, highlight: true, dot: 'bg-amber-500' },
                  { id: 'pending', label: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length, dot: 'bg-amber-400' },
                  { id: 'confirmed', label: 'Confirmed', count: orders.filter(o => o.orderStatus === 'confirmed').length, dot: 'bg-sky-500' },
                  { id: 'processing', label: 'Processing', count: orders.filter(o => o.orderStatus === 'processing').length, dot: 'bg-blue-500' },
                  { id: 'shipped', label: 'Shipped', count: metrics.shippedCount, dot: 'bg-indigo-500' },
                  { id: 'delivered', label: 'Delivered', count: metrics.deliveredCount, dot: 'bg-emerald-500' },
                  { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.orderStatus === 'cancelled').length, dot: 'bg-rose-400' }
                ].map(tab => {
                  const isActive = orderStatusFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      data-filter={tab.id}
                      onClick={() => { setOrderStatusFilter(tab.id); setOrderPage(1) }}
                      className={`relative z-10 px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors duration-150 cursor-pointer flex items-center gap-1.5 text-xs ${
                        isActive
                          ? 'text-gray-950'
                          : tab.highlight && tab.count > 0
                            ? 'text-amber-800 hover:text-amber-950'
                            : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {/* Micro Status Dot */}
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot} ${tab.highlight && tab.count > 0 ? 'animate-pulse' : ''}`} />
                      <span className="whitespace-nowrap">{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black font-tabular transition-colors ${
                        isActive
                          ? 'bg-black text-white'
                          : tab.highlight && tab.count > 0
                            ? 'bg-amber-100 text-amber-900'
                            : tab.count > 0
                              ? 'bg-gray-200/80 text-gray-700'
                              : 'text-gray-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Filter & Search Control Bar (Compact) */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1) }}
                  placeholder="Search Order ID (EVR-...), customer name, email, phone, city..."
                  className="w-full pl-9 pr-10 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:bg-white transition-colors text-gray-900"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Payment Filter */}
                <CustomDropdown
                  value={orderPaymentFilter}
                  onChange={(val) => { setOrderPaymentFilter(val); setOrderPage(1) }}
                  options={[
                    { value: 'all', label: 'All Payments' },
                    { value: 'cod', label: 'Cash on Delivery (COD)' },
                    { value: 'online', label: 'Online (UPI / Card)' },
                  ]}
                  align="right"
                />

                {/* Sort dropdown */}
                <CustomDropdown
                  value={orderSortBy}
                  onChange={(val) => setOrderSortBy(val)}
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'highest', label: 'Highest Amount' },
                    { value: 'lowest', label: 'Lowest Amount' },
                  ]}
                  align="right"
                />
              </div>
            </div>

            {/* Bulk Action Bar (Visible when orders checked) */}
            {selectedOrderIds.length > 0 && (
              <div className="bg-gray-900 text-white rounded-lg p-2 shadow-md flex items-center justify-between gap-2 animate-in fade-in duration-150 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{selectedOrderIds.length} order(s) selected</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-gray-400 font-semibold hidden sm:inline">Set Status:</span>
                  <button
                    onClick={() => handleBulkStatusUpdate('confirmed')}
                    className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Confirmed
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('processing')}
                    className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Processing
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('shipped')}
                    className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Shipped
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('delivered')}
                    className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-xs font-bold cursor-pointer"
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => setSelectedOrderIds([])}
                    className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-[11px] text-gray-300 cursor-pointer"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            )}

            {/* Orders Table Container (Compact & Scrollbar-free) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <table className="w-[1374px] min-w-[1374px] text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-[5px] py-[5px] w-[32px] min-w-[32px] max-w-[32px] text-center group/header select-none">
                        <div className="relative w-4 h-4 mx-auto flex items-center justify-center">
                          {selectedOrderIds.length > 0 ? (
                            <CustomCheckbox
                              checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.orderId || o._id))}
                              indeterminate={selectedOrderIds.length > 0 && !paginatedOrders.every(o => selectedOrderIds.includes(o.orderId || o._id))}
                              onChange={(isChecked) => {
                                if (isChecked) {
                                  const allVisibleKeys = paginatedOrders.map(o => o.orderId || o._id)
                                  setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...allVisibleKeys])))
                                } else {
                                  const visibleSet = new Set(paginatedOrders.map(o => o.orderId || o._id))
                                  setSelectedOrderIds(selectedOrderIds.filter(id => !visibleSet.has(id)))
                                }
                              }}
                              title={selectedOrderIds.length > 0 ? "Deselect page" : "Select all visible"}
                            />
                          ) : (
                            <>
                              <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-semibold text-xs group-hover/header:opacity-0 transition-opacity select-none pointer-events-none">#</span>
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-opacity">
                                <CustomCheckbox
                                  checked={false}
                                  onChange={() => {
                                    const allVisibleKeys = paginatedOrders.map(o => o.orderId || o._id)
                                    setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...allVisibleKeys])))
                                  }}
                                  title="Select all visible orders"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </th>
                      <th className="pl-[3px] pr-[5px] py-[5px] whitespace-nowrap w-[86px] min-w-[86px] max-w-[86px]">Date & Time</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[120px] min-w-[120px] max-w-[120px]">Order ID</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[142px] min-w-[142px] max-w-[142px]">Invoice No.</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[127px] min-w-[127px] max-w-[127px]">Name</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[96px] min-w-[96px] max-w-[96px]">Phone No.</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[260px] min-w-[260px] max-w-[260px]">Product Name</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[165px] min-w-[165px] max-w-[165px]">Address</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap text-right w-[78px] min-w-[78px] max-w-[78px]">Amount</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[103px] min-w-[103px] max-w-[103px]">Payment</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[100px] min-w-[100px] max-w-[100px]">Fulfillment</th>
                      <th className="pl-[5px] pr-[8px] py-[5px] whitespace-nowrap text-right w-[65px] min-w-[65px] max-w-[65px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order, idx) => {
                        const orderKey = order.orderId || order._id
                        const isSelected = selectedOrderIds.includes(orderKey)
                        const statusBadge = getStatusBadge(order.orderStatus)
                        const isUpdating = updatingOrderId === orderKey
                        const isJustUpdated = updatedOrderId === orderKey
                        const ship = order.shippingAddress || order.shipping || {}
                        const serialNumber = (orderPage - 1) * ordersPerPage + idx + 1
                        const invoiceNum = order.invoiceNumber || `INV/EC/${(order.orderId || order._id)?.slice(-6).toUpperCase()}`

                        return (
                          <tr
                            key={orderKey}
                            className={`group/row transition-colors ${isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50/80'}`}
                          >
                            {/* Index and selection */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[32px] min-w-[32px] max-w-[32px]">
                              <div className="relative w-4 h-4 mx-auto flex items-center justify-center">
                                {isSelected || selectedOrderIds.length > 0 ? (
                                  <CustomCheckbox
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedOrderIds(prev =>
                                        prev.includes(orderKey) ? prev.filter(id => id !== orderKey) : [...prev, orderKey]
                                      )
                                    }}
                                    title={`Select order ${orderKey}`}
                                  />
                                ) : (
                                  <>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 font-medium group-hover/row:opacity-0 transition-opacity select-none pointer-events-none">
                                      {serialNumber}
                                    </span>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                                      <CustomCheckbox
                                        checked={false}
                                        onChange={() => {
                                          setSelectedOrderIds(prev => [...prev, orderKey])
                                        }}
                                        title={`Select order ${orderKey}`}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>

                            {/* Date and time */}
                            <td className="pl-[3px] pr-[5px] py-[5px] whitespace-nowrap w-[86px] min-w-[86px] max-w-[86px]">
                              <div className="text-xs font-semibold text-gray-900 leading-tight">
                                {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="text-[11px] text-gray-400 leading-tight mt-0.5">
                                {new Date(order.orderDate || order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                            </td>

                            {/* Order ID */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[120px] min-w-[120px] max-w-[120px]">
                              <CopyableCell
                                text={order.orderId || order._id}
                                displayText={order.orderId || `#${order._id?.slice(-8)}`}
                                className="font-semibold text-gray-900 text-xs"
                                copyLabel="Order ID"
                              />
                            </td>

                            {/* Invoice number */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[142px] min-w-[142px] max-w-[142px]">
                              <CopyableCell
                                text={invoiceNum}
                                displayText={invoiceNum}
                                className="text-xs text-gray-600 font-normal"
                                copyLabel="Invoice number"
                              />
                            </td>

                            {/* Customer name */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[127px] min-w-[127px] max-w-[127px]">
                              <div className="font-semibold text-gray-900 text-xs truncate max-w-[117px]" title={(ship.firstName || order.user?.name || 'Customer') + (ship.lastName ? ` ${ship.lastName}` : '')}>
                                {(ship.firstName || order.user?.name || 'Customer') + (ship.lastName ? ` ${ship.lastName}` : '')}
                              </div>
                            </td>

                            {/* Phone number */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[96px] min-w-[96px] max-w-[96px]">
                              <CopyableCell
                                text={ship.phone || order.phone}
                                displayText={ship.phone || order.phone || '-'}
                                className="text-xs text-gray-700 font-normal"
                                copyLabel="Phone number"
                              />
                            </td>

                            {/* Product details */}
                            <td className="px-[5px] py-[5px] w-[260px] min-w-[260px] max-w-[260px]">
                              {(() => {
                                const items = Array.isArray(order.items) ? order.items : []
                                if (items.length === 0) {
                                  return <span className="text-gray-400 italic text-xs">No items</span>
                                }
                                const firstItem = items[0]
                                const extraCount = items.length - 1
                                const totalUnits = items.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)

                                if (extraCount === 0) {
                                  return (
                                    <div className="min-w-0" title={firstItem.name || 'Product'}>
                                      <div className="truncate text-gray-900 text-xs font-semibold leading-tight">
                                        {firstItem.name || 'Product'}
                                      </div>
                                      <div className="text-[11px] text-gray-400 mt-0.5">
                                        Qty: {firstItem.quantity || 1}
                                      </div>
                                    </div>
                                  )
                                }

                                const previewTitle = items.map((it, idx) => `${idx + 1}. ${it.name || 'Product'} (×${it.quantity || 1})`).join('\n')

                                return (
                                  <div className="min-w-0">
                                    <div className="truncate text-gray-900 text-xs font-semibold leading-tight" title={firstItem.name || 'Product'}>
                                      {firstItem.name || 'Product'} <span className="text-gray-400 font-normal">×{firstItem.quantity || 1}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setInspectingOrder(order)
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-colors cursor-pointer mt-1 border border-gray-200/80 group/more"
                                      title={previewTitle}
                                    >
                                      <span>+{extraCount} more {extraCount === 1 ? 'item' : 'items'}</span>
                                      <span className="text-gray-400 font-normal text-[10px]">({totalUnits} units)</span>
                                      <svg className="w-2.5 h-2.5 text-gray-400 group-hover/more:text-black group-hover/more:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })()}
                            </td>

                            {/* Shipping address */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[165px] min-w-[165px] max-w-[165px]">
                              <div className="text-gray-600 leading-tight max-w-[155px]">
                                <div className="truncate text-gray-800 text-xs" title={ship.address || ''}>
                                  {ship.address || '-'}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate mt-0.5" title={[ship.city, ship.state, ship.zipCode].filter(Boolean).join(', ')}>
                                  {[ship.city, ship.state, ship.zipCode].filter(Boolean).join(', ')}
                                </div>
                              </div>
                            </td>

                            {/* Order total */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap text-right w-[78px] min-w-[78px] max-w-[78px]">
                              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                                {formatPrice(order.totalAmount || order.total)}
                              </span>
                            </td>

                            {/* Payment status */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[103px] min-w-[103px] max-w-[103px]">
                              <div className="text-xs font-semibold text-gray-900 leading-tight">
                                {getPaymentMethodDisplay(order)}
                              </div>
                              <div className={`text-[11px] font-medium leading-tight mt-0.5 ${
                                order.paymentStatus === 'completed' || order.paymentStatus === 'paid'
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                              }`}>
                                {order.paymentStatus === 'completed' || order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                              </div>
                            </td>

                            {/* Fulfillment status */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[100px] min-w-[100px] max-w-[100px]">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (activeStatusMenu?.orderKey === orderKey) {
                                      setActiveStatusMenu(null)
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setActiveStatusMenu({ orderKey, currentStatus: order.orderStatus || 'pending', rect })
                                    }
                                  }}
                                  className={`inline-flex items-center justify-between gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                                    statusBadge.bg
                                  } ${isUpdating ? 'opacity-40 cursor-wait' : ''}`}
                                  title="Click to update fulfillment status"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(order.orderStatus)}`} />
                                    <span className="capitalize">{order.orderStatus || 'pending'}</span>
                                  </span>
                                  <svg className="w-2.5 h-2.5 opacity-60 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {isUpdating && (
                                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                                )}
                                {isJustUpdated && (
                                  <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="pl-[5px] pr-[8px] py-[5px] whitespace-nowrap text-right w-[65px] min-w-[65px] max-w-[65px]">
                              <div className="inline-flex items-center justify-end gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setInspectingOrder(order)
                                  }}
                                  className="p-1 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Quick view order details"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <a
                                  href={getStorefrontUrl(`/order/${order.orderId || order._id}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Open full receipt in new tab"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={12} className="px-3 py-8 text-center text-gray-400">
                          <div className="max-w-xs mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm text-gray-800">No Orders Found</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {orderSearch || orderStatusFilter !== 'all' || orderPaymentFilter !== 'all'
                                ? 'No orders match your filter criteria.'
                                : 'There are currently no orders placed on the storefront.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar (Compact) */}
              {filteredOrders.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span>Showing</span>
                    <span className="font-bold text-gray-900">
                      {Math.min(filteredOrders.length, (orderPage - 1) * ordersPerPage + 1)} - {Math.min(filteredOrders.length, orderPage * ordersPerPage)}
                    </span>
                    <span>of {filteredOrders.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      value={ordersPerPage}
                      onChange={(val) => { setOrdersPerPage(Number(val)); setOrderPage(1) }}
                      options={[
                        { value: 10, label: '10 per page' },
                        { value: 15, label: '15 per page' },
                        { value: 25, label: '25 per page' },
                        { value: 50, label: '50 per page' },
                      ]}
                      size="xs"
                      align="right"
                      direction="up"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                        disabled={orderPage === 1}
                        className="px-2 py-0.5 bg-white border border-gray-200 rounded-md font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                      >
                        &larr; Prev
                      </button>
                      <span className="px-1.5 py-0.5 font-semibold text-[11px]">
                        {orderPage} / {totalOrderPages}
                      </span>
                      <button
                        onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                        disabled={orderPage === totalOrderPages}
                        className="px-2 py-0.5 bg-white border border-gray-200 rounded-md font-bold hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Products tab */}
        {activeTab === 'products' && (
          <section className="space-y-2.5 animate-in fade-in duration-150">
            {/* Search and filter toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-2 sm:p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by title, brand, category, SKU..."
                  className="w-full pl-9 pr-10 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 focus:bg-white transition-colors text-gray-900"
                />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Category Filter */}
                <CustomDropdown
                  value={productCategoryFilter}
                  onChange={(val) => setProductCategoryFilter(val)}
                  options={[
                    { value: 'all', label: `All Categories (${categoriesList.length})` },
                    ...categoriesList.map(cat => ({ value: cat, label: cat }))
                  ]}
                  align="right"
                />

                {/* Stock Level Filter */}
                <CustomDropdown
                  value={productStockFilter}
                  onChange={(val) => setProductStockFilter(val)}
                  options={[
                    { value: 'all', label: 'All Inventory' },
                    { value: 'in_stock', label: 'In Stock (> 5)', dot: 'bg-emerald-500' },
                    { value: 'low_stock', label: 'Low Stock (1 - 5)', dot: 'bg-amber-500' },
                    { value: 'out_of_stock', label: 'Out of Stock (0)', dot: 'bg-rose-500' },
                  ]}
                  align="right"
                />
              </div>
            </div>

            {/* Inventory table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <table className="w-[1371.61px] min-w-[1371.61px] text-left text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-[5px] py-[5px] w-[32px] min-w-[32px] max-w-[32px] text-center whitespace-nowrap">#</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[570px] min-w-[570px] max-w-[570px]">Product Name</th>
                      <th className="px-[5px] py-[5px] whitespace-nowrap w-[140px] min-w-[140px] max-w-[140px]">SKU</th>
                      <th className="px-[5px] py-[5px] text-center whitespace-nowrap w-[90px] min-w-[90px] max-w-[90px]">Category</th>
                      <th className="px-[5px] py-[5px] text-right whitespace-nowrap w-[85px] min-w-[85px] max-w-[85px]">Price</th>
                      <th className="px-[5px] py-[5px] text-center whitespace-nowrap w-[107px] min-w-[107px] max-w-[107px]">Stock</th>
                      <th className="px-[5px] py-[5px] text-center whitespace-nowrap w-[107.61px] min-w-[107.61px] max-w-[107.61px]" title="Toggle Home Page Top Spotlight Deal">Spotlight</th>
                      <th className="px-[5px] py-[5px] text-center whitespace-nowrap w-[140px] min-w-[140px] max-w-[140px]">Status</th>
                      <th className="px-[5px] py-[5px] text-center whitespace-nowrap w-[100px] min-w-[100px] max-w-[100px]">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product, idx) => {
                        const stock = Number(product.stock) || 0
                        const imageSrc = (product.images && product.images[0]) || '/placeholder.png'

                        return (
                          <tr key={product._id} className="hover:bg-gray-50/80 transition-colors">
                            {/* Index */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap text-gray-500 text-xs w-[32px] min-w-[32px] max-w-[32px]">
                              {idx + 1}
                            </td>

                            {/* Product name */}
                            <td className="px-[5px] py-[5px] w-[570px] min-w-[570px] max-w-[570px]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center relative">
                                  <Image
                                    src={imageSrc}
                                    alt={product.name}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 leading-snug break-words" title={product.name}>
                                    {product.name}
                                  </div>
                                  {product.brand && (
                                    <div className="text-[11px] text-gray-400 mt-0.5">
                                      {product.brand}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="px-[5px] py-[5px] whitespace-nowrap w-[140px] min-w-[140px] max-w-[140px]">
                              <span className="text-xs font-medium text-gray-700">
                                {product.sku || product._id?.slice(-8).toUpperCase()}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[90px] min-w-[90px] max-w-[90px]">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                                {product.category || 'General'}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="px-[5px] py-[5px] text-right whitespace-nowrap w-[85px] min-w-[85px] max-w-[85px]">
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight">
                                {formatPrice(product.price)}
                              </div>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <div className="text-[11px] text-gray-400 line-through leading-tight mt-0.5">
                                  {formatPrice(product.originalPrice)}
                                </div>
                              )}
                            </td>

                            {/* Stock */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[107px] min-w-[107px] max-w-[107px]">
                              {stock <= 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Out of Stock</span>
                                </span>
                              ) : (
                                <span className="font-semibold text-xs text-gray-900">
                                  {stock}
                                </span>
                              )}
                            </td>

                            {/* Spotlight toggle */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[107.61px] min-w-[107.61px] max-w-[107.61px]">
                              <button
                                type="button"
                                onClick={() => handleToggleProductSpotlight(product._id, !product.isSpotlight)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  product.isSpotlight
                                    ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs hover:bg-amber-200'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200 hover:text-gray-800 hover:border-gray-300'
                                }`}
                                title={
                                  product.isSpotlight
                                    ? 'Active Home Page Top Spotlight! (Click to remove)'
                                    : 'Make this the Home Page Top Spotlight Deal'
                                }
                              >
                                <svg className={`w-3 h-3 ${product.isSpotlight ? 'text-amber-600 fill-amber-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill={product.isSpotlight ? "currentColor" : "none"} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={product.isSpotlight ? 0 : 1.5} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span>{product.isSpotlight ? 'Spotlight' : 'Set Top'}</span>
                                {product.isSpotlight && (
                                  <svg className="w-3 h-3 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </td>

                            {/* Status */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[140px] min-w-[140px] max-w-[140px]">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(product._id, product.status || 'active')}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                    product.status === 'inactive'
                                      ? 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title={`Status: ${product.status || 'active'} (click to toggle)`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${product.status === 'inactive' ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                                  <span className="capitalize">{product.status || 'active'}</span>
                                </button>
                                {product.isFeatured && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300" title="Featured product">
                                    <svg className="w-2.5 h-2.5 text-amber-600 fill-amber-500" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>Featured</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-[5px] py-[5px] text-center whitespace-nowrap w-[100px] min-w-[100px] max-w-[100px]">
                              <div className="flex items-center justify-center gap-1">
                                <a
                                  href={getStorefrontUrl(`/product/${product._id}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="View on storefront"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(product)}
                                  className="p-1.5 rounded-md text-gray-500 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Edit product"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product._id, product.name)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-3 py-8 text-center text-gray-400">
                          <div className="max-w-xs mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-xs sm:text-sm text-gray-800">No Products Found</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {productSearch || productCategoryFilter !== 'all' || productStockFilter !== 'all'
                                ? 'No products match your filter criteria.'
                                : 'Catalog is empty. Click "+ Add Product" to populate items.'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Reports tab */}
        {activeTab === 'analytics' && (
          <section className="space-y-3 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Sales (Total)</span>
                <div className="text-xl font-black text-gray-900 mt-1">{formatPrice(metrics.totalRevenue)}</div>
                <div className="text-[11px] text-gray-500 mt-1">Inclusive of 18% Indian GST (CGST + SGST)</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Taxable Revenue</span>
                <div className="text-xl font-black text-gray-900 mt-1">{formatPrice(metrics.taxableSales)}</div>
                <div className="text-[11px] text-gray-500 mt-1">Base valuation before tax compliance</div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total GST Collected (18%)</span>
                <div className="text-xl font-black text-emerald-700 mt-1">{formatPrice(metrics.totalGst)}</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  CGST: {formatPrice(metrics.cgst)} &middot; SGST: {formatPrice(metrics.sgst)}
                </div>
              </div>
            </div>

            {/* Payment Method Split */}
            <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-xs space-y-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">Payment Gateway Reconciliation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Cash on Delivery (COD)</span>
                    </span>
                    <span>{metrics.codCount} Orders</span>
                  </div>
                  <div className="text-lg font-black text-gray-900">{formatPrice(metrics.codRevenue)}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Pending collection at destination doorstep</div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Online Payments (UPI, Cards, NetBanking)</span>
                    </span>
                    <span>{metrics.onlineCount} Orders</span>
                  </div>
                  <div className="text-lg font-black text-gray-900">{formatPrice(metrics.onlineRevenue)}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Direct bank settlements</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Order inspection modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-gray-200 flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-150">
            {/* Modal header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <div className="min-w-0 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                      {inspectingOrder.orderId || `#${inspectingOrder._id?.slice(-8)}`}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(inspectingOrder.orderStatus).bg} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(inspectingOrder.orderStatus)}`} />
                      <span className="capitalize">{inspectingOrder.orderStatus || 'pending'}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    Placed on {formatDate(inspectingOrder.orderDate || inspectingOrder.createdAt)} &middot; {(inspectingOrder.items || []).length} {((inspectingOrder.items || []).length === 1 ? 'item' : 'items')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* Status update actions */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-gray-700 text-xs">Update Status:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(st => {
                    const isActive = inspectingOrder.orderStatus === st
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateOrderStatus(inspectingOrder.orderId || inspectingOrder._id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-black text-white shadow-xs'
                            : 'bg-white text-gray-700 hover:bg-gray-200/80 border border-gray-200/80'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(st)}`} />
                        <span>{st}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Customer and shipping details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Customer Details</span>
                  <div className="font-bold text-gray-900 text-xs">
                    {inspectingOrder.shippingAddress?.firstName || 'Customer'} {inspectingOrder.shippingAddress?.lastName || ''}
                  </div>
                  <div className="text-gray-600 text-[11px] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{inspectingOrder.shippingAddress?.email || 'No email provided'}</span>
                  </div>
                  <div className="text-gray-700 text-[11px] flex items-center gap-1.5 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{inspectingOrder.shippingAddress?.phone || inspectingOrder.phone || '-'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Shipping Destination</span>
                  <div className="text-gray-800 text-xs leading-relaxed font-medium">
                    {inspectingOrder.shippingAddress?.address || 'Standard Address'}<br />
                    {[inspectingOrder.shippingAddress?.city, inspectingOrder.shippingAddress?.state, inspectingOrder.shippingAddress?.zipCode].filter(Boolean).join(', ')}
                  </div>
                  <div className="pt-1 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-semibold text-gray-900">{getPaymentMethodDisplay(inspectingOrder)}</span>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                    Order Items ({(inspectingOrder.items || []).length})
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {(inspectingOrder.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)} units total
                  </span>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[260px] overflow-y-auto bg-white shadow-2xs">
                  {(Array.isArray(inspectingOrder.items) ? inspectingOrder.items : []).map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/70 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                          <Image
                            src={it.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                            alt={it.name || 'Item'}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-900 text-xs truncate" title={it.name}>{it.name}</div>
                          <div className="text-gray-500 text-[11px] flex items-center gap-1.5 flex-wrap mt-0.5">
                            {it.brand && <span className="text-gray-400">{it.brand} &middot;</span>}
                            <span className="font-semibold text-gray-700">Qty: {it.quantity || 1}</span>
                            <span className="text-gray-400">&times; {formatPrice(it.price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-gray-900 text-xs font-tabular shrink-0 text-right">
                        {formatPrice((it.price || 0) * (it.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatPrice(inspectingOrder.subtotal || inspectingOrder.totalAmount || inspectingOrder.total)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span>Indian GST (18% inclusive)</span>
                  <span className="font-medium text-gray-700">{formatPrice(Math.round(((inspectingOrder.totalAmount || inspectingOrder.total) - ((inspectingOrder.totalAmount || inspectingOrder.total) / 1.18)) * 100) / 100)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span>Shipping & Logistics</span>
                  <span className="font-bold text-emerald-700">FREE</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex items-center justify-between font-black text-sm text-gray-900">
                  <span>Grand Total</span>
                  <span>{formatPrice(inspectingOrder.totalAmount || inspectingOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-3 shrink-0">
              <a
                href={getStorefrontUrl(`/order/${inspectingOrder.orderId || inspectingOrder._id}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:text-black hover:bg-gray-100 border border-gray-200 transition-colors"
              >
                <span>Open Full Customer Receipt</span>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] shadow-2xl border border-gray-200 flex flex-col overflow-hidden my-auto">
            {/* Modal header */}
            <div className="px-5 sm:px-6 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    {editingProduct && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        productForm.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}>
                        {productForm.status === 'active' ? 'Live' : 'Inactive'}
                      </span>
                    )}
                    {productForm.isSpotlight && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                        <span>★</span>
                        <span>Top Spotlight</span>
                      </span>
                    )}
                    {productForm.isFeatured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">
                    {editingProduct
                      ? (editingProduct.name || 'Manage catalog attributes and storefront placement')
                      : 'Configure specifications, media, and homepage merchandising.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-black flex items-center justify-center cursor-pointer transition-colors"
                  title="Close (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form content */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto flex flex-col justify-between">
              <div className="p-4 sm:p-6 bg-gray-50/50 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Core product details */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* General details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          General Information
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium">Required fields marked with *</span>
                      </div>

                      {/* Product Name */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Product Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="e.g., Apple MacBook Air M2 (13.6-inch, 8GB RAM, 256GB SSD)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-black focus:border-black focus:outline-none transition-all"
                        />
                      </div>

                      {/* Brand & SKU */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-gray-800 mb-1 text-xs">
                            Brand <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={productForm.brand}
                            onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                            placeholder="e.g., Apple, Sony, Samsung"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-black focus:border-black focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-gray-800 mb-1 text-xs">
                            SKU / Barcode
                          </label>
                          <input
                            type="text"
                            value={productForm.sku}
                            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                            placeholder="e.g., MBAIRM2-256-SLV"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-black focus:border-black focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Product Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          placeholder="Provide a compelling overview of the product, its key specs, build quality, and intended user..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-black focus:border-black focus:outline-none transition-all leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Product images */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Product Images
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            First image is used as the primary storefront card thumbnail.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {productForm.images.filter(Boolean).length} / 10
                        </span>
                      </div>

                      {/* Image gallery */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {productForm.images.map((imgUrl, imgIndex) => (
                          <div
                            key={imgIndex}
                            className={`p-2 rounded-lg border transition-all flex items-center gap-2.5 ${
                              imgIndex === 0
                                ? 'border-gray-900/40 bg-gray-50/70'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            {/* Thumbnail preview */}
                            <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={`Preview ${imgIndex + 1}`}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                              {imgIndex === 0 && (
                                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-bold text-white text-center py-0.2 tracking-wider uppercase">
                                  Cover
                                </span>
                              )}
                            </div>

                            {/* Image URL input */}
                            <div className="flex-1 min-w-0">
                              <input
                                type="url"
                                value={imgUrl}
                                onChange={(e) => {
                                  const newImages = [...productForm.images]
                                  newImages[imgIndex] = e.target.value
                                  setProductForm({ ...productForm, images: newImages })
                                }}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-md text-[11px] font-mono focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                              />
                            </div>

                            {/* Remove image */}
                            {productForm.images.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = productForm.images.filter((_, idx) => idx !== imgIndex)
                                  setProductForm({ ...productForm, images: newImages })
                                }}
                                className="w-7 h-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="Remove photo"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {productForm.images.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, images: [...productForm.images, ''] })}
                          className="w-full py-2 border border-dashed border-gray-300 hover:border-black rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Image URL</span>
                        </button>
                      )}
                    </div>

                    {/* Key features */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Key Highlights & Features
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Bullet points shown to buyers on the storefront detail page.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {productForm.features.filter(Boolean).length} / 10
                        </span>
                      </div>

                      <div className="space-y-2">
                        {productForm.features.map((feature, featIndex) => (
                          <div key={featIndex} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {featIndex + 1}
                            </span>
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => {
                                const newFeatures = [...productForm.features]
                                newFeatures[featIndex] = e.target.value
                                setProductForm({ ...productForm, features: newFeatures })
                              }}
                              placeholder="e.g., Up to 18 hours of battery life with all-day efficiency"
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                            />
                            {productForm.features.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newFeatures = productForm.features.filter((_, idx) => idx !== featIndex)
                                  setProductForm({ ...productForm, features: newFeatures })
                                }}
                                className="w-7 h-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="Remove feature"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {productForm.features.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, features: [...productForm.features, ''] })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Feature Bullet</span>
                        </button>
                      )}
                    </div>

                    {/* Technical specifications */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Technical Specifications
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Attribute name and value pairs (e.g. Display, Battery, Connectivity).
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {productForm.specifications.filter(s => s.key && s.value).length} / 15
                        </span>
                      </div>

                      <div className="space-y-2">
                        {productForm.specifications.map((spec, specIndex) => (
                          <div key={specIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={spec.key}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications]
                                newSpecs[specIndex] = { ...newSpecs[specIndex], key: e.target.value }
                                setProductForm({ ...productForm, specifications: newSpecs })
                              }}
                              placeholder="Attribute (e.g., Display)"
                              className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                            />
                            <input
                              type="text"
                              value={spec.value}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications]
                                newSpecs[specIndex] = { ...newSpecs[specIndex], value: e.target.value }
                                setProductForm({ ...productForm, specifications: newSpecs })
                              }}
                              placeholder="Value (e.g., 13.6-inch Liquid Retina, 500 nits)"
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                            />
                            {productForm.specifications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newSpecs = productForm.specifications.filter((_, idx) => idx !== specIndex)
                                  setProductForm({ ...productForm, specifications: newSpecs })
                                }}
                                className="w-7 h-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                title="Remove specification"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {productForm.specifications.length < 15 && (
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, specifications: [...productForm.specifications, { key: '', value: '' }] })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Add Specification</span>
                        </button>
                      )}
                    </div>

                    {/* Search tags */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                            Search Tags & Keywords
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Tags improve search discoverability in the storefront search bar.
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {productForm.tags.filter(Boolean).length} / 10
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {productForm.tags.map((tag, tagIndex) => (
                          <div key={tagIndex} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-md pl-2 pr-1 py-1">
                            <input
                              type="text"
                              value={tag}
                              onChange={(e) => {
                                const newTags = [...productForm.tags]
                                newTags[tagIndex] = e.target.value
                                setProductForm({ ...productForm, tags: newTags })
                              }}
                              placeholder="e.g., ultrabook"
                              className="w-28 text-xs bg-transparent border-0 focus:outline-none text-gray-800 font-medium"
                            />
                            {productForm.tags.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = productForm.tags.filter((_, idx) => idx !== tagIndex)
                                  setProductForm({ ...productForm, tags: newTags })
                                }}
                                className="w-4 h-4 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center cursor-pointer"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}

                        {productForm.tags.length < 10 && (
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, tags: [...productForm.tags, ''] })}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                          >
                            + Add Tag
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Merchandising and pricing */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Storefront Merchandising
                        </h4>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>

                      {/* Top spotlight toggle */}
                      <div
                        role="checkbox"
                        aria-checked={productForm.isSpotlight}
                        tabIndex={0}
                        onClick={() => setProductForm(prev => ({ ...prev, isSpotlight: !prev.isSpotlight }))}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            setProductForm(prev => ({ ...prev, isSpotlight: !prev.isSpotlight }))
                          }
                        }}
                        className={`rounded-xl p-3 border-2 transition-all cursor-pointer select-none ${
                          productForm.isSpotlight
                            ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20'
                            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox indicator */}
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                            productForm.isSpotlight
                              ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}>
                            {productForm.isSpotlight && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold text-xs text-gray-900">Homepage Top Spotlight</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black flex items-center gap-1 ${
                                productForm.isSpotlight
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}>
                                <span>★</span>
                                <span>{productForm.isSpotlight ? 'Spotlight Active' : 'Off'}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                              Sets this item as the primary hero spotlight deal at the top of the storefront homepage.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Featured product toggle */}
                      <div
                        role="checkbox"
                        aria-checked={productForm.isFeatured}
                        tabIndex={0}
                        onClick={() => setProductForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault()
                            setProductForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))
                          }
                        }}
                        className={`rounded-xl p-3 border transition-all cursor-pointer select-none ${
                          productForm.isFeatured
                            ? 'border-gray-900 bg-gray-50 shadow-xs ring-2 ring-gray-900/10'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox indicator */}
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                            productForm.isFeatured
                              ? 'bg-black border-black text-white shadow-2xs'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}>
                            {productForm.isFeatured && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <span className="font-bold text-xs text-gray-900">Featured Collection</span>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                productForm.isFeatured
                                  ? 'bg-black text-white'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {productForm.isFeatured ? 'Included in Grid' : 'Standard'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1 leading-snug">
                              Displays this item in the curated 8-product Featured Deals grid on the homepage.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Pricing & Margin
                        </h4>
                      </div>

                      {/* Selling price */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Selling Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            required
                            min="0"
                            step="any"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="0"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-bold font-tabular text-gray-900 focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Original price */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Original Price / MRP (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={productForm.originalPrice}
                            onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                            placeholder="Leave blank if no discount"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600 font-tabular focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Discount preview */}
                      {Number(productForm.originalPrice) > Number(productForm.price) && Number(productForm.price) > 0 && (
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span>Customer Discount:</span>
                            <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-black">
                              {Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)}% OFF
                            </span>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center justify-between pt-1 border-t border-emerald-200/60">
                            <span>You save customer:</span>
                            <span className="font-bold">{formatPrice(productForm.originalPrice - productForm.price)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Inventory */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Inventory & Stock
                        </h4>
                        {/* Stock indicator */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          Number(productForm.stock) > 5
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : Number(productForm.stock) > 0
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {Number(productForm.stock) > 5 ? 'In Stock' : Number(productForm.stock) > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Units in Stock <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          placeholder="e.g., 25"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold font-tabular text-gray-900 focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Classification and status */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3.5">
                      <div className="pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                          Classification & Status
                        </h4>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          required
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium text-gray-900 focus:ring-1 focus:ring-black focus:border-black focus:outline-none cursor-pointer"
                        >
                          <option value="">Select Category</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Laptops">Laptops</option>
                          <option value="Gaming">Gaming</option>
                          <option value="Audio">Audio</option>
                          <option value="Cameras">Cameras</option>
                          <option value="Accessories">Accessories</option>
                          <option value="Smartphones">Smartphones</option>
                          <option value="Wearables">Wearables</option>
                          {categoriesList.filter(c => !['Electronics','Laptops','Gaming','Audio','Cameras','Accessories','Smartphones','Wearables'].includes(c)).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Visibility Status
                        </label>
                        <select
                          value={productForm.status}
                          onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white font-medium text-gray-900 focus:ring-1 focus:ring-black focus:border-black focus:outline-none cursor-pointer"
                        >
                          <option value="active">Active (Visible to Shoppers)</option>
                          <option value="inactive">Inactive (Hidden from Catalog)</option>
                        </select>
                      </div>

                      {/* Rating */}
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1 text-xs">
                          Storefront Star Rating (0 - 5.0)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={productForm.rating}
                            onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                            placeholder="4.8"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-1 focus:ring-black focus:border-black focus:outline-none"
                          />
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            <span>★</span>
                            <span className="font-bold text-gray-700 text-xs">{productForm.rating || '4.8'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-5 sm:px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between sticky bottom-0 z-30">
                <div className="flex items-center gap-2">
                  {editingProduct && (
                    <a
                      href={getStorefrontUrl(`/product/${editingProduct._id}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span>Preview on Storefront</span>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={productFormSaving}
                    className="px-5 py-2 rounded-lg text-xs bg-black text-white font-bold hover:bg-gray-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {productFormSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Catalog...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{editingProduct ? 'Save Changes' : 'Publish Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status selector popover */}
      {activeStatusMenu && (
        <div
          className="fixed z-50 min-w-[145px] bg-white rounded-lg border border-gray-200 shadow-xl py-1 text-xs animate-in fade-in duration-75"
          style={{
            top: typeof window !== 'undefined'
              ? Math.min(window.innerHeight - 205, activeStatusMenu.rect.bottom + 4)
              : activeStatusMenu.rect.bottom + 4,
            left: typeof window !== 'undefined'
              ? Math.max(8, Math.min(window.innerWidth - 160, activeStatusMenu.rect.right - 145))
              : activeStatusMenu.rect.left
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-0.5">
            Fulfillment Status
          </div>
          {[
            { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
            { value: 'confirmed', label: 'Confirmed', dot: 'bg-blue-500' },
            { value: 'processing', label: 'Processing', dot: 'bg-indigo-500' },
            { value: 'shipped', label: 'Shipped', dot: 'bg-purple-500' },
            { value: 'delivered', label: 'Delivered', dot: 'bg-emerald-500' },
            { value: 'cancelled', label: 'Cancelled', dot: 'bg-rose-500' },
          ].map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => {
                updateOrderStatus(activeStatusMenu.orderKey, st.value)
                setActiveStatusMenu(null)
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-left font-medium transition-colors cursor-pointer outline-none focus:outline-none ${
                activeStatusMenu.currentStatus === st.value
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                <span>{st.label}</span>
              </span>
              {activeStatusMenu.currentStatus === st.value && (
                <svg className="w-3.5 h-3.5 text-gray-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}