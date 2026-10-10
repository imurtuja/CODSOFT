"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from '../../components/Toast'
import { clearCart, getLocalCart } from '../../utils/cartManager'
import { ChevronRightIcon, ChevronLeftIcon } from '../../components/CategoryIcons'
import CheckoutSkeleton from '../../components/skeletons/CheckoutSkeleton'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      if (window.Razorpay) return resolve(true)
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      setTimeout(() => resolve(!!window.Razorpay), 1200)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [cartItems, setCartItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [loading, setLoading] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null) // 'processing' | 'verifying' | 'success' | 'failed' | null
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('')
  const [isDirectMode, setIsDirectMode] = useState(false)
  const [savedCartCount, setSavedCartCount] = useState(0)
  const [authChecking, setAuthChecking] = useState(true)
  const [canPlaceOrder, setCanPlaceOrder] = useState(false)

  useEffect(() => {
    if (currentStep === 3) {
      const timer = setTimeout(() => {
        setCanPlaceOrder(true)
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setCanPlaceOrder(false)
    }
  }, [currentStep])

  const loadCart = useCallback(() => {
    try {
      const savedCart = getLocalCart()
      const savedCount = Array.isArray(savedCart)
        ? savedCart.reduce((acc, item) => acc + (item.quantity || 1), 0)
        : 0
      setSavedCartCount(savedCount)

      if (typeof window !== 'undefined') {
        // Strip any query parameter immediately so the checkout URL is always 100% clean: /checkout
        if (window.location.search) {
          window.history.replaceState(null, '', '/checkout')
        }

        const isDirect = sessionStorage.getItem('isDirectCheckout') === 'true'
        const directItemStr = sessionStorage.getItem('buyNowItem')
        if (isDirect && directItemStr) {
          const directItem = JSON.parse(directItemStr)
          setCartItems([directItem])
          setIsDirectMode(true)
          return
        }
      }
      setIsDirectMode(false)
      setCartItems(savedCart)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
    }
  }, [])

  const checkAuth = useCallback(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const user = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const currentUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
      
      if ((token && user) || currentUser) {
        setIsLoggedIn(true)
        if (user) {
          const parsed = JSON.parse(user)
          setUserData(parsed)
          if (parsed.email) {
            setNewAddress(prev => (prev.email ? prev : { ...prev, email: parsed.email }))
          }
        } else if (currentUser) {
          const parsed = JSON.parse(currentUser)
          setUserData(parsed)
          if (parsed.email) {
            setNewAddress(prev => (prev.email ? prev : { ...prev, email: parsed.email }))
          }
        }
      } else {
        setIsLoggedIn(false)
        setUserData(null)
      }
    } catch (e) {
      console.error('Auth check error:', e)
      setIsLoggedIn(false)
    }
  }, [])

  useEffect(() => {
    // Suppress external noise
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      const msg = args[0]?.toString() || ''
      if (msg.includes('lumberjack.razorpay.com') || msg.includes('sentry') || msg.includes('otp-credentials')) return
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const msg = args[0]?.toString() || ''
      if (msg.includes('lumberjack.razorpay.com') || msg.includes('sentry') || msg.includes('otp-credentials')) return
      originalWarn.apply(console, args)
    }

    loadCart()
    checkAuth()
    loadRazorpayScript()
    setAuthChecking(false)

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [checkAuth, loadCart])

  const loadAddresses = useCallback(async () => {
    if (!isLoggedIn || !userData) return

    try {
      const userId = userData._id || userData.id
      const response = await fetch(`/api/addresses?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        const addresses = data.addresses || []
        setSavedAddresses(addresses)
        if (addresses.length > 0 && !selectedAddress) {
          setSelectedAddress(addresses[0])
        } else if (addresses.length === 0) {
          setShowNewAddressForm(true)
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [isLoggedIn, userData, selectedAddress])

  useEffect(() => {
    if (isLoggedIn && userData) {
      loadAddresses()
    }
  }, [isLoggedIn, userData, loadAddresses])

  const saveAddress = async (e) => {
    if (e) e.preventDefault()
    if (!isLoggedIn || !userData) {
      toast.warning('Please sign in to save an address')
      return
    }

    if (!newAddress.firstName?.trim() || !newAddress.address?.trim() || !newAddress.city?.trim() || !newAddress.zipCode?.trim()) {
      toast.warning('Please fill in your name, street address, city, and ZIP code')
      return
    }

    setSavingAddress(true)
    try {
      const userId = userData._id || userData.id
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAddress,
          userId
        })
      })

      if (response.ok) {
        const data = await response.json()
        const added = data.address
        setSavedAddresses(prev => [...prev, added])
        setSelectedAddress(added)
        setShowNewAddressForm(false)
        setNewAddress({
          firstName: '',
          lastName: '',
          email: userData.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        })
        toast.success('Address saved successfully!')
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(`Failed to save address: ${errorData.error || 'Please check the details'}`)
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Error saving address. Please try again.')
    } finally {
      setSavingAddress(false)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0)
  }

  const handlePayment = async () => {
    if (currentStep !== 3 || !canPlaceOrder || loading) {
      return
    }

    if (!selectedAddress) {
      toast.warning('Please select or add a delivery address')
      setCurrentStep(1)
      return
    }

    if (!isLoggedIn || !userData) {
      toast.warning('Please sign in to proceed with checkout')
      router.push('/login?redirect=/checkout')
      return
    }

    if (cartItems.length === 0) {
      toast.warning('Your cart is empty')
      router.push('/cart')
      return
    }

    setLoading(true)
    setPaymentErrorMessage('')
    setPaymentStatus('processing')

    try {
      const userId = userData._id || userData.id || 'user_' + Date.now()
      const orderPayload = {
        items: cartItems.map(item => ({
          product: item.id || item._id,
          name: item.name,
          brand: item.brand || '',
          price: item.price,
          quantity: item.quantity,
          image: item.image || ''
        })),
        totalAmount: calculateTotal(),
        subtotal: calculateTotal(),
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        user: userId,
        userId: userId
      }

      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // 1. Create order in Database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      })

      if (!orderResponse.ok) {
        const errData = await orderResponse.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || 'Failed to initialize order')
      }

      const orderResult = await orderResponse.json()
      const dbOrderId = orderResult.order?._id
      const displayOrderId = orderResult.order?.orderId || orderResult.orderId || 'EVR-' + Date.now()

      // 2. Handle Cash on Delivery: Show confirmation state, clear direct item / cart, then redirect
      if (paymentMethod === 'cod') {
        setPaymentStatus('success')
        if (isDirectMode) {
          sessionStorage.removeItem('buyNowItem')
          sessionStorage.removeItem('isDirectCheckout')
        } else {
          clearCart()
        }
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`evercart_fresh_order_${displayOrderId}`, '1')
          }
          router.push(`/order-success/${encodeURIComponent(displayOrderId)}?fresh=1`)
        }, 800)
        return
      }

      // 3. Online Payment: Request live Razorpay order from API
      const paymentResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: dbOrderId,
          amount: calculateTotal(),
          userId: userId
        })
      })

      const paymentData = await paymentResponse.json().catch(() => ({}))

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || paymentData.details || 'Failed to initiate payment')
      }

      // 4. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Failed to load secure Razorpay payment gateway script. Please check your network.')
      }

      try {
        const razorpayInstance = new window.Razorpay({
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency || 'INR',
          name: paymentData.name || 'EverCart',
          description: paymentData.description || `Order #${displayOrderId}`,
          order_id: paymentData.razorpayOrderId,
          prefill: {
            name: `${selectedAddress.firstName || ''} ${selectedAddress.lastName || ''}`.trim(),
            email: selectedAddress.email || userData.email || '',
            contact: selectedAddress.phone || ''
          },
          theme: {
            color: '#000000'
          },
          handler: async (response) => {
            try {
              setPaymentStatus('verifying')

              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: dbOrderId,
                  userId: userId
                })
              })

              const verifyData = await verifyResponse.json().catch(() => ({}))

              if (verifyResponse.ok && verifyData.success) {
                if (isDirectMode) {
                  sessionStorage.removeItem('buyNowItem')
                  sessionStorage.removeItem('isDirectCheckout')
                } else {
                  clearCart()
                }
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(`evercart_fresh_order_${displayOrderId}`, '1')
                }
                router.push(`/order-success/${encodeURIComponent(displayOrderId)}?fresh=1`)
              } else {
                throw new Error(verifyData.error || 'Payment signature verification failed')
              }
            } catch (verifyErr) {
              console.error('Payment verification error:', verifyErr)
              setPaymentStatus('failed')
              setPaymentErrorMessage(verifyErr.message || 'Payment verification could not be confirmed.')
              setLoading(false)
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false)
              setPaymentStatus('failed')
              setPaymentErrorMessage('Payment window was closed before completion. No funds were debited.')
            }
          }
        })

        // Dismiss internal overlay right as the Razorpay modal opens
        setPaymentStatus(null)
        setLoading(false)
        razorpayInstance.open()
      } catch (rzpErr) {
        console.error('Razorpay popup open error:', rzpErr)
        setPaymentStatus('failed')
        setPaymentErrorMessage('Unable to initialize the Razorpay popup. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Payment flow error:', err)
      setPaymentStatus('failed')
      setPaymentErrorMessage(err.message || 'Payment initiation failed. Please try again.')
      setLoading(false)
    }
  }

  if (authChecking) {
    return <CheckoutSkeleton />
  }

  // Auth gate
  if (!isLoggedIn) {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8 text-center transition-all animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-black text-white flex items-center justify-center shadow-xs">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
            Secure Checkout
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Sign In to Continue
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Log in to access your saved addresses, track order progress, and complete checkout securely.
          </p>

          <div className="space-y-3">
            <Link 
              href="/login?redirect=/checkout" 
              className="w-full h-11 bg-black text-white rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Log In to Continue</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>

            <Link 
              href="/signup?redirect=/checkout" 
              className="w-full h-11 bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl font-semibold text-sm inline-flex items-center justify-center transition-colors"
            >
              New customer? Create an account
            </Link>
          </div>

          <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <Link href="/cart" className="hover:text-black font-medium inline-flex items-center gap-1.5 transition-colors">
              <ChevronLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Cart</span>
            </Link>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>256-bit Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart gate
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[85vh] bg-gray-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8 text-center transition-all animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            Your Cart is Empty
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            You don&apos;t have any items ready for checkout. Explore our catalog for top-rated gear and best deals.
          </p>
          <Link 
            href="/products" 
            className="w-full h-11 bg-black text-white rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <span>Explore Products</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  const STEPS = [
    { id: 1, label: 'Delivery Address', caption: 'Shipping destination' },
    { id: 2, label: 'Payment Method', caption: 'UPI, Cards, or COD' },
    { id: 3, label: 'Review & Confirm', caption: 'Final verification' }
  ]

  const totalItemsCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0)

  return (
    <div className="min-h-screen bg-gray-50/50 py-5 sm:py-6">
      {/* Container aligned with Navbar logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Trail */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-3.5">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/cart" className="hover:text-black transition-colors">
            Cart
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>

        {/* Header with Modern Stepper */}
        <div className="mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Secure Checkout
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Step {currentStep} of 3 &middot; {STEPS[currentStep - 1]?.label}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-semibold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>256-Bit SSL Encrypted Session</span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-4 max-w-3xl">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={!isCompleted && !isCurrent}
                    onClick={() => {
                      if (isCompleted) setCurrentStep(step.id)
                    }}
                    className={`text-left group relative p-3 rounded-xl border transition-all duration-300 ${
                      isCurrent
                        ? 'bg-white border-black shadow-xs ring-1 ring-black'
                        : isCompleted
                        ? 'bg-white border-gray-200 hover:border-gray-400 cursor-pointer'
                        : 'bg-transparent border-gray-200/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>
                          {step.label}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate hidden sm:block">
                          {step.caption}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Checkout Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Multi-step interactive flow */}
          <div className="lg:col-span-8 space-y-4">
            {/* Contextual Notice: Only shown if customer has other items waiting in their shopping cart */}
            {isDirectMode && currentStep < 3 && savedCartCount > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-100/90 border border-gray-200/80 text-xs text-gray-700 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                  <span className="truncate">
                    Buying this item directly &middot;{' '}
                    <span className="text-gray-500">
                      You have {savedCartCount} {savedCartCount === 1 ? 'item' : 'items'} saved in your cart
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.removeItem('buyNowItem')
                      sessionStorage.removeItem('isDirectCheckout')
                    }
                    setIsDirectMode(false)
                    const cart = getLocalCart()
                    setCartItems(cart)
                  }}
                  className="text-xs font-semibold text-gray-950 hover:text-black underline underline-offset-2 ml-3 shrink-0 transition-colors cursor-pointer"
                >
                  Checkout Full Cart ({savedCartCount})
                </button>
              </div>
            )}

            {/* Step 1: Delivery Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 transition-all duration-300 animate-in fade-in slide-in-from-right-3">
                <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      1. Delivery Address
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      Choose where you would like your order delivered.
                    </p>
                  </div>
                  {savedAddresses.length > 0 && !showNewAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs font-bold text-black hover:underline underline-offset-4 inline-flex items-center gap-1"
                    >
                      <span>+ Add New Address</span>
                    </button>
                  )}
                </div>

                {/* Saved Address Cards */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Saved Delivery Addresses
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((address, index) => {
                        const isSelected = selectedAddress?._id === address._id

                        return (
                          <div
                            key={address._id || index}
                            onClick={() => {
                              setSelectedAddress(address)
                              setShowNewAddressForm(false)
                            }}
                            className={`relative p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'border-black ring-1 ring-black bg-gray-50/60 shadow-xs'
                                : 'border-gray-200 bg-white hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900">
                                    {address.firstName} {address.lastName}
                                  </span>
                                  {index === 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                  {address.address}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {address.city}, {address.state} {address.zipCode}
                                </p>
                                {address.phone && (
                                  <p className="text-xs font-medium text-gray-500 mt-2 flex items-center gap-1">
                                    <span>📞</span>
                                    <span>{address.phone}</span>
                                  </p>
                                )}
                              </div>

                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'bg-black text-white'
                                    : 'border border-gray-300'
                                }`}
                              >
                                {isSelected && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* New Address Form (Collapsible or if no addresses exist) */}
                {showNewAddressForm && (
                  <form
                    onSubmit={saveAddress}
                    className="p-4 sm:p-4.5 rounded-xl border border-gray-200 bg-gray-50/60 mb-4 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/80">
                      <h3 className="text-sm font-bold text-gray-900">
                        Enter Delivery Address Details
                      </h3>
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-xs text-gray-500 hover:text-black font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. John"
                          value={newAddress.firstName}
                          onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Doe"
                          value={newAddress.lastName}
                          onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={newAddress.email}
                          onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Flat / House No., Building, Street area"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Mumbai"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">State / Province</label>
                        <input
                          type="text"
                          placeholder="e.g. Maharashtra"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">PIN / ZIP Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="6-digit PIN code"
                          value={newAddress.zipCode}
                          onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                          className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-gray-200/80 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {savingAddress ? 'Saving...' : 'Save & Select Address'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Bottom Step Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black transition-colors"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                    <span>Return to Cart</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedAddress) {
                        toast.warning('Please select or save a delivery address first')
                        return
                      }
                      setCurrentStep(2)
                    }}
                    disabled={!selectedAddress}
                    className="h-10.5 sm:h-11 px-5 sm:px-6 bg-black text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 transition-all duration-300 animate-in fade-in slide-in-from-right-3">
                <div className="pb-3.5 border-b border-gray-100 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    2. Payment Method
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Select your preferred secure payment method.
                  </p>
                </div>

                <div className="space-y-2.5 mb-4">
                  {/* Option 1: Razorpay Online Payment */}
                  <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'razorpay'
                        ? 'border-black ring-1 ring-black bg-gray-50/60 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                            paymentMethod === 'razorpay'
                              ? 'bg-black text-white'
                              : 'border border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'razorpay' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-gray-900">
                              Instant Online Payment
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Recommended
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            Pay via UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, or NetBanking with instant confirmation.
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 font-semibold">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">UPI</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">Visa</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">Mastercard</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">RuPay</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[11px] text-gray-600">NetBanking</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xl shrink-0 hidden sm:block">💳</span>
                    </div>
                  </div>

                  {/* Option 2: Cash on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      paymentMethod === 'cod'
                        ? 'border-black ring-1 ring-black bg-gray-50/60 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                            paymentMethod === 'cod'
                              ? 'bg-black text-white'
                              : 'border border-gray-300'
                          }`}
                        >
                          {paymentMethod === 'cod' && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-gray-900">
                              Cash on Delivery (COD)
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              Pay at Doorstep
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            Pay in cash or UPI when your shipment is delivered. No advance payment required.
                          </p>
                        </div>
                      </div>

                      <span className="text-xl shrink-0 hidden sm:block">💵</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address Summary Pill */}
                {selectedAddress && (
                  <div className="px-3.5 py-2.5 bg-gray-50 rounded-xl border border-gray-200/80 mb-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-gray-600 min-w-0 truncate">
                      <span className="text-sm shrink-0">📍</span>
                      <span className="truncate">
                        Delivering to: <strong className="text-gray-900">{selectedAddress.firstName} {selectedAddress.lastName}</strong> ({selectedAddress.city}, {selectedAddress.zipCode})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="font-bold text-black hover:underline underline-offset-4 ml-2 shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Bottom Step Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                    <span>Back to Address</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="h-10.5 sm:h-11 px-5 sm:px-6 bg-black text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                  >
                    <span>Review Order</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Final Confirmation */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 transition-all duration-300 animate-in fade-in slide-in-from-right-3">
                <div className="pb-3.5 border-b border-gray-100 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    3. Review Your Order
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Verify delivery address, payment method, and cart items before finalizing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Delivery Address Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Delivery Address
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs font-bold text-black hover:underline underline-offset-4 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-bold text-sm text-gray-900">
                        {selectedAddress?.firstName} {selectedAddress?.lastName}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {selectedAddress?.address}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.zipCode}
                      </p>
                      {selectedAddress?.phone && (
                        <p className="text-xs font-medium text-gray-500 mt-1">
                          Phone: {selectedAddress.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200/90 bg-gray-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Payment Method
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs font-bold text-black hover:underline underline-offset-4 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span>{paymentMethod === 'razorpay' ? '💳' : '💵'}</span>
                        <span>
                          {paymentMethod === 'razorpay' ? 'Instant Online Payment' : 'Cash on Delivery (COD)'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {paymentMethod === 'razorpay'
                          ? 'Encrypted checkout via Razorpay (UPI, Cards, NetBanking).'
                          : 'Payment collected at your doorstep upon delivery.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                    Items in Order ({cartItems.length})
                  </h3>
                  <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-xl overflow-hidden bg-white">
                    {cartItems.map((item, idx) => (
                      <div key={item.id || idx} className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-11 h-11 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name || 'Product'}
                                width={44}
                                height={44}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">📦</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Qty: {item.quantity} &middot; {formatPrice(item.price)} each
                            </p>
                          </div>
                        </div>

                        <span className="text-xs sm:text-sm font-bold text-gray-900 shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Step Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-black active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                    <span>Back to Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={loading || !canPlaceOrder}
                    className="h-10.5 sm:h-11 px-6 sm:px-7 bg-black text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{paymentMethod === 'cod' ? 'Placing Order...' : 'Connecting Gateway...'}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {paymentMethod === 'cod' ? 'Place Cash on Delivery Order' : `Pay ${formatPrice(calculateTotal())}`}
                        </span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Clean Order Summary (NO products list, clean numbers) & Premium Trust Cards */}
          <div className="lg:col-span-4 sticky top-24 space-y-3.5">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Summary
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cost Breakdown (Clean & compact with no product names) */}
              <div className="space-y-2.5 py-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(calculateTotal())}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Standard Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Taxes & Duties</span>
                  <span className="text-gray-500 font-medium">Included</span>
                </div>
              </div>

              {/* Total Due */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-sm sm:text-base font-bold text-gray-900">Total Amount</span>
                    <p className="text-[11px] text-gray-400">All taxes included</p>
                  </div>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Trust Cards: 256-Bit SSL Encryption, Free Tracked Delivery, Genuine Warranty */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs divide-y divide-gray-100">
              {/* Item 1: 256-Bit SSL Encryption */}
              <div className="flex items-start gap-3 pb-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900">256-Bit SSL Encryption</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Industry-leading checkout security powered by Razorpay.
                  </p>
                </div>
              </div>

              {/* Item 2: Free Tracked Delivery */}
              <div className="flex items-start gap-3 py-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900">Free Tracked Delivery</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Shipped with premium national logistics partners.
                  </p>
                </div>
              </div>

              {/* Item 3: Genuine Warranty */}
              <div className="flex items-start gap-3 pt-3">
                <div className="w-8.5 h-8.5 rounded-lg bg-gray-100 border border-gray-200/80 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-gray-900">Genuine Warranty</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    100% manufacturer-backed authentic hardware.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-End Luxury Payment Loading / Verifying / Success Overlay */}
      {(paymentStatus === 'processing' || paymentStatus === 'verifying' || paymentStatus === 'success') && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="relative bg-white rounded-3xl p-7 sm:p-9 max-w-sm sm:max-w-md w-full text-center shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300">
            {/* Ambient Top Glow Aura */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-gray-200/50 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Top Security Status Pill */}
            <div className="relative z-10 mb-6 flex justify-center">
              {paymentStatus === 'success' ? (
                paymentMethod === 'cod' ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Cash on Delivery Confirmed</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Payment Verified • EverCart</span>
                  </div>
                )
              ) : paymentStatus === 'verifying' ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Verifying Signature</span>
                </div>
              ) : paymentMethod === 'cod' ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Confirming COD Booking</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gray-100/90 border border-gray-200/80 text-[11px] font-bold text-gray-700 tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>256-Bit SSL Encrypted Session</span>
                </div>
              )}
            </div>

            {/* Multi-Layer Animated Emblem / Ring */}
            <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              {paymentStatus === 'success' ? (
                <div className="relative w-20 h-20 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 flex items-center justify-center transform transition-all duration-500 scale-100">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <>
                  {/* Outer slow-spinning dashed ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-300/80 animate-[spin_10s_linear_infinite]" />
                  {/* Mid sleek rotating spinner arc */}
                  <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-t-black border-r-gray-600 animate-spin" />
                  {/* Ambient drop shadow badge */}
                  <div className="relative w-14 h-14 rounded-2xl bg-black text-white shadow-xl flex items-center justify-center">
                    {paymentStatus === 'verifying' ? (
                      <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Typography */}
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {paymentStatus === 'success'
                ? (paymentMethod === 'cod' ? 'Order Confirmed!' : 'Payment Confirmed!')
                : paymentStatus === 'verifying'
                ? 'Verifying Transaction'
                : (paymentMethod === 'cod' ? 'Confirming Your Order...' : 'Connecting Secure Gateway')}
            </h3>

            <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">
              {paymentStatus === 'success'
                ? (paymentMethod === 'cod'
                    ? 'Your Cash on Delivery order is confirmed. Redirecting to receipt...'
                    : 'Transaction authorized via Razorpay. Redirecting to receipt...')
                : paymentStatus === 'verifying'
                ? 'Authenticating transaction signature with Razorpay...'
                : (paymentMethod === 'cod'
                    ? 'Registering your delivery address and booking your order...'
                    : 'Establishing a PCI-compliant checkout channel with Razorpay...')}
            </p>

            {/* Total Amount Pill */}
            <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2 bg-gray-50 border border-gray-200/80 rounded-xl shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                {paymentMethod === 'cod' ? 'Pay on Delivery' : 'Total Paid'}
              </span>
              <span className="text-sm font-extrabold text-gray-900">{formatPrice(calculateTotal())}</span>
            </div>

            {/* Indeterminate Shimmer Progress Bar */}
            {paymentStatus !== 'success' && (
              <div className="mt-6 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-gray-900 via-black to-gray-700 rounded-full animate-shimmer-progress" />
              </div>
            )}

            {/* Security Badges Footer */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5 font-semibold text-gray-600">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
                PCI-DSS Level 1
              </span>
              <span className="font-bold text-gray-700 tracking-wide">
                {paymentMethod === 'cod' ? 'EverCart Guaranteed' : 'Razorpay Verified'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Unsuccessful Payment Animated Modal */}
      {paymentStatus === 'failed' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300">
          <div className="relative bg-white rounded-3xl p-7 sm:p-9 max-w-sm sm:max-w-md w-full text-center shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300">
            {/* Ambient Top Glow Aura */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-b from-red-100/60 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Top Status Pill */}
            <div className="relative z-10 mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-50 border border-red-200 text-[11px] font-bold text-red-700 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Transaction Incomplete</span>
              </div>
            </div>

            {/* Red Warning Badge */}
            <div className="relative w-20 h-20 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Payment Incomplete
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mt-2 mb-6 max-w-xs mx-auto">
              {paymentErrorMessage || 'The payment was not completed. No money was deducted from your account. You can retry anytime.'}
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handlePayment}
                className="w-full h-11 bg-black text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <span>Retry Payment</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus(null)
                  setPaymentErrorMessage('')
                  setCurrentStep(2)
                }}
                className="w-full h-11 bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                Choose Another Payment Method
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentStatus(null)
                  setPaymentErrorMessage('')
                }}
                className="text-xs text-gray-400 hover:text-black font-semibold pt-2"
              >
                Dismiss and Return to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}