"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [cartItems, setCartItems] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
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
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    // Suppress all development console errors and warnings
    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log

    // Override console methods to filter out unwanted messages
    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      if (
        message.includes('otp-credentials') ||
        message.includes('lumberjack.razorpay.com') ||
        message.includes('browser.sentry-cdn.com') ||
        message.includes('svg') ||
        message.includes('Expected length') ||
        message.includes('ERR_BLOCKED_BY_CLIENT') ||
        message.includes('Unrecognized feature') ||
        message.includes('Failed to load resource') ||
        message.includes('placeholder-product.jpg') ||
        message.includes('sony.co.in') ||
        message.includes('React DevTools') ||
        message.includes('Fast Refresh') ||
        message.includes('hot-reloader') ||
        message.includes('report-hmr') ||
        message.includes('webpack') ||
        message.includes('react-dom') ||
        message.includes('react-server-dom') ||
        message.includes('app-index') ||
        message.includes('app-next-dev') ||
        message.includes('app-bootstrap') ||
        message.includes('main-app') ||
        message.includes('v2-entry') ||
        message.includes('checkout.js') ||
        message.includes('checkout-static')
      ) {
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args[0]?.toString() || ''
      if (
        message.includes('otp-credentials') ||
        message.includes('lumberjack.razorpay.com') ||
        message.includes('browser.sentry-cdn.com') ||
        message.includes('svg') ||
        message.includes('Expected length') ||
        message.includes('ERR_BLOCKED_BY_CLIENT') ||
        message.includes('Unrecognized feature') ||
        message.includes('Failed to load resource') ||
        message.includes('placeholder-product.jpg') ||
        message.includes('sony.co.in') ||
        message.includes('React DevTools') ||
        message.includes('Fast Refresh') ||
        message.includes('hot-reloader') ||
        message.includes('report-hmr') ||
        message.includes('webpack') ||
        message.includes('react-dom') ||
        message.includes('react-server-dom') ||
        message.includes('app-index') ||
        message.includes('app-next-dev') ||
        message.includes('app-bootstrap') ||
        message.includes('main-app') ||
        message.includes('v2-entry') ||
        message.includes('checkout.js') ||
        message.includes('checkout-static')
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    // Global error handler
    const handleError = (event) => {
      if (
        event.message?.includes('otp-credentials') ||
        event.message?.includes('lumberjack.razorpay.com') ||
        event.message?.includes('browser.sentry-cdn.com') ||
        event.message?.includes('svg') ||
        event.message?.includes('Expected length') ||
        event.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        event.message?.includes('Unrecognized feature') ||
        event.message?.includes('Failed to load resource') ||
        event.message?.includes('placeholder-product.jpg') ||
        event.message?.includes('sony.co.in') ||
        event.message?.includes('React DevTools') ||
        event.message?.includes('Fast Refresh') ||
        event.message?.includes('hot-reloader') ||
        event.message?.includes('report-hmr') ||
        event.message?.includes('webpack') ||
        event.message?.includes('react-dom') ||
        event.message?.includes('react-server-dom') ||
        event.message?.includes('app-index') ||
        event.message?.includes('app-next-dev') ||
        event.message?.includes('app-bootstrap') ||
        event.message?.includes('main-app') ||
        event.message?.includes('v2-entry') ||
        event.message?.includes('checkout.js') ||
        event.message?.includes('checkout-static')
      ) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    loadCart()
    checkAuth()

    return () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && userData) {
      loadAddresses()
    }
  }, [isLoggedIn, userData, loadAddresses])


  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(cart)
    } catch (error) {
      console.error('Error loading cart:', error)
      setCartItems([])
    }
  }

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const currentUser = localStorage.getItem('currentUser')
    
    if ((token && user) || currentUser) {
      setIsLoggedIn(true)
      if (user) {
        const userData = JSON.parse(user)
        setUserData(userData)
      } else if (currentUser) {
        const userData = JSON.parse(currentUser)
        setUserData(userData)
      }
    } else {
      setIsLoggedIn(false)
      setUserData(null)
    }
  }

  const loadAddresses = async () => {
    if (!isLoggedIn || !userData) {
      return
    }
    
    try {
      const response = await fetch(`/api/addresses?userId=${userData._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSavedAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }

  const saveAddress = async () => {
    if (!isLoggedIn || !userData) {
      return
    }

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAddress,
          userId: userData._id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSavedAddresses([...savedAddresses, data.address])
        setSelectedAddress(data.address)
        setNewAddress({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: ''
        })
        alert('Address saved successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to save address: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving address:', error)
      alert('Error saving address')
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handlePayment = async () => {
    if (!selectedAddress) {
      alert('Please select an address')
      return
    }

    if (!isLoggedIn || !userData) {
      alert('Please login to continue')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')
    setPaymentMessage('Creating order...')

    try {
      // Create order
      const orderData = {
        items: cartItems,
        totalAmount: calculateTotal(),
        subtotal: calculateTotal(),
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        user: userData._id,
        userId: userData._id
      }


      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(`Failed to create order: ${errorData.error || 'Unknown error'}`)
      }

      const orderResult = await orderResponse.json()
      const orderId = orderResult.order._id

      // Handle different payment methods
      if (paymentMethod === 'cod') {
        // Cash on Delivery - no payment gateway needed
        setPaymentStatus('success')
        setPaymentMessage('Order placed successfully! Cash on Delivery confirmed.')
        localStorage.removeItem('cart')
        setTimeout(() => {
          window.location.href = '/order-success'
        }, 2000)
        return
      }

      // Online payment (Razorpay)
      const paymentResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: orderId,
          amount: calculateTotal(),
          userId: userData._id
        })
      })

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment')
      }

      const paymentData = await paymentResponse.json()

      // Handle demo mode
      if (paymentData.demo) {
        setPaymentStatus('success')
        setPaymentMessage('Demo payment successful! Order placed.')
        setTimeout(() => {
          localStorage.removeItem('cart')
          router.push('/order-success')
        }, 2000)
        return
      }

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const razorpayInstance = new window.Razorpay({
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: paymentData.name,
          description: paymentData.description,
          order_id: paymentData.razorpayOrderId,
          handler: async (response) => {
            try {
              setPaymentStatus('verifying')
              setPaymentMessage('Verifying payment...')

              const verifyResponse = await fetch('/api/payment/verify', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: orderId,
                  userId: userData._id
                })
              })

              const verifyData = await verifyResponse.json()

              if (verifyResponse.ok && verifyData.success) {
                setPaymentStatus('success')
                setPaymentMessage('Payment successful! Order placed.')
                setTimeout(() => {
                  localStorage.removeItem('cart')
                  router.push('/order-success')
                }, 2000)
              } else {
                throw new Error(verifyData.error || 'Payment verification failed')
              }
            } catch (error) {
              console.error('Payment error:', error)
              setPaymentStatus('error')
              setPaymentMessage(`Payment failed: ${error.message}`)
            }
          },
          modal: {
            ondismiss: () => {
              setPaymentStatus('error')
              setPaymentMessage('Payment cancelled by user')
              setLoading(false)
            }
          }
        })

        razorpayInstance.open()
      }

      document.head.appendChild(script)

    } catch (error) {
      console.error('Payment error:', error)
      setPaymentStatus('error')
      setPaymentMessage(error.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to checkout</p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to checkout</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <div className="flex items-center mt-4 space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Address</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address Selection */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Select Delivery Address</h2>
                
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Saved Addresses</h3>
                    <div className="space-y-3">
                      {savedAddresses.map((address, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-4 cursor-pointer ${
                            selectedAddress?._id === address._id ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                          }`}
                          onClick={() => setSelectedAddress(address)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{address.firstName} {address.lastName}</p>
                              <p className="text-gray-600">{address.address}</p>
                              <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                              <p className="text-gray-600">{address.phone}</p>
                            </div>
                            {selectedAddress?._id === address._id && (
                              <div className="text-blue-600">✓</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Address */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {savedAddresses.length > 0 ? 'Add New Address' : 'Add Address'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={newAddress.firstName}
                      onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={newAddress.lastName}
                      onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newAddress.email}
                      onChange={(e) => setNewAddress({...newAddress, email: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={newAddress.address}
                      onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                      className="border rounded-lg px-3 py-2 md:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({...newAddress, zipCode: e.target.value})}
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>
                  <button
                    onClick={saveAddress}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Save Address
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!selectedAddress}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Select Payment Method</h2>
                
                <div className="space-y-4">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">Online Payment (Razorpay)</p>
                        <p className="text-sm text-gray-600">Pay with UPI, Cards, Net Banking</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when your order is delivered</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Order Confirmation */}
            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Review Your Order</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Delivery Address</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p>{selectedAddress.firstName} {selectedAddress.lastName}</p>
                      <p>{selectedAddress.address}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                      <p>{selectedAddress.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Payment Method</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <p>{paymentMethod === 'razorpay' ? 'Online Payment (Razorpay)' : 'Cash on Delivery'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Back
                  </button>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Selected: {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <Image
                      src={item.image || '/placeholder-product.jpg'}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status Modal */}
        {paymentStatus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
              <div className="mb-4">
                {paymentStatus === 'processing' && (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                )}
                {paymentStatus === 'verifying' && (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
                )}
                {paymentStatus === 'success' && (
                  <div className="text-green-600 text-6xl">✓</div>
                )}
                {paymentStatus === 'error' && (
                  <div className="text-red-600 text-6xl">✗</div>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {paymentStatus === 'processing' && 'Processing Payment...'}
                {paymentStatus === 'verifying' && 'Verifying Payment...'}
                {paymentStatus === 'success' && 'Payment Successful!'}
                {paymentStatus === 'error' && 'Payment Failed'}
              </h3>
              <p className="text-gray-600">{paymentMessage}</p>
              
              {paymentStatus === 'error' && (
                <div className="mt-6 space-x-4">
                  <button
                    onClick={() => {
                      setPaymentStatus(null)
                      setPaymentMessage('')
                      setLoading(false)
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setPaymentStatus(null)
                      setPaymentMessage('')
                      setLoading(false)
                      handlePayment()
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}