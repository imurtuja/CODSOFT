'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from '../../components/Toast'
import ConfirmLoader from '../../components/ConfirmLoader'
import NotFoundView from '../../components/NotFoundView'

// Helper for Indian Rupees number to words (for Tax Invoice)
function numberToIndianWords(num) {
  const n = Math.floor(Number(num) || 0)
  if (n === 0) return 'Zero Rupees Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function convertGroup(val) {
    let str = ''
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + ' Hundred '
      val %= 100
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + ' '
      val %= 10
    }
    if (val > 0) {
      str += ones[val] + ' '
    }
    return str.trim()
  }

  let words = ''
  const crore = Math.floor(n / 10000000)
  let rem = n % 10000000
  const lakh = Math.floor(rem / 100000)
  rem %= 100000
  const thousand = Math.floor(rem / 1000)
  rem %= 1000
  const hundredAndRest = rem

  if (crore > 0) words += convertGroup(crore) + ' Crore '
  if (lakh > 0) words += convertGroup(lakh) + ' Lakh '
  if (thousand > 0) words += convertGroup(thousand) + ' Thousand '
  if (hundredAndRest > 0) words += convertGroup(hundredAndRest) + ' '

  return (words.trim() + ' Rupees Only')
}

export default function OrderSuccessContent({ initialOrderId = '', isFreshCheckout = false }) {
  const [orderId, setOrderId] = useState(initialOrderId)
  const [orderData, setOrderData] = useState(null)
  const [copied, setCopied] = useState(false)

  // Determine synchronously if this is a fresh order transition from checkout:
  // Must be authenticated to qualify as fresh!
  const [isFresh] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) return false // Unauthenticated visitors are NEVER treated as fresh checkout

      if (isFreshCheckout) return true
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('fresh') === '1' || urlParams.get('fresh') === 'true') return true
      const id = initialOrderId || urlParams.get('orderId') || ''
      if (id && sessionStorage.getItem(`evercart_fresh_order_${id}`) === '1') return true
    }
    return false
  })

  // Initial fetch status:
  // - If fresh checkout by authenticated user: start directly as 'loading' (ConfirmLoader displays immediately with ZERO blank screen!)
  // - Otherwise: start as 'idle' (so unauthenticated visitors or direct link visitors NEVER flash ConfirmLoader)
  const [fetchStatus, setFetchStatus] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) return 'idle'

      if (isFreshCheckout) return 'loading'
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('fresh') === '1' || urlParams.get('fresh') === 'true') return 'loading'
      const id = initialOrderId || urlParams.get('orderId') || ''
      if (id && sessionStorage.getItem(`evercart_fresh_order_${id}`) === '1') return 'loading'
    }
    return 'idle'
  })

  useEffect(() => {
    let id = initialOrderId
    if (!id && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      id = urlParams.get('orderId') || ''
    }

    if (!id) {
      setFetchStatus('not_found')
      return
    }

    setOrderId(id)

    // Security check 1: Non-logged in / unauthenticated user gets 404 immediately with ZERO loader flash
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setFetchStatus('not_found')
      return
    }

    // Professional URL normalization: clean URL in browser history and consume fresh session flag
    if (typeof window !== 'undefined') {
      if (window.location.search.includes('orderId') || window.location.search.includes('fresh')) {
        window.history.replaceState(null, '', `/order-success/${encodeURIComponent(id)}`)
      }
      sessionStorage.removeItem(`evercart_fresh_order_${id}`)
    }

    let expiryTimer = null
    let confirmTimer = null

    fetch(`/api/orders/${encodeURIComponent(id)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          // Unauthorized, forbidden, or non-existent order: return 404
          setFetchStatus('not_found')
          return
        }
        const data = await res.json()

        // Server-sided 30-minute confirmation link expiry:
        if (data.isConfirmationExpired) {
          window.location.replace(`/order/${encodeURIComponent(data.orderId || id)}`)
          return
        }

        setOrderData(data)

        if (isFresh) {
          // NORMAL CHECKOUT PROCESS:
          // User arrived from checkout -> ConfirmLoader started immediately (zero blank screen).
          // Allow the cipher animation to run for ~1.4s, then smoothly transition to confirmation dashboard.
          setFetchStatus('loading')
          confirmTimer = setTimeout(() => {
            setFetchStatus('success')
          }, 1400)
        } else {
          // RELOAD OR DIRECT LINK PASTE WITHIN 30 MINUTES:
          // "when reload or direct link paste no need to show the confirming thing and show the page directly to auth user"
          setFetchStatus('success')
        }

        // Live timer for remaining time until 30-min confirmation window expires:
        const orderTimestamp = new Date(data.orderDate || data.createdAt || Date.now()).getTime()
        const ageMs = Date.now() - orderTimestamp
        const remainingMs = Math.max(0, 30 * 60 * 1000 - ageMs)
        expiryTimer = setTimeout(() => {
          window.location.replace(`/order/${encodeURIComponent(data.orderId || id)}`)
        }, remainingMs)
      })
      .catch((err) => {
        console.warn('Order verification notice:', err.message)
        setFetchStatus('not_found')
      })

    return () => {
      if (confirmTimer) clearTimeout(confirmTimer)
      if (expiryTimer) clearTimeout(expiryTimer)
    }
  }, [initialOrderId, isFresh])

  const copyOrderId = () => {
    const idToCopy = orderData?.orderId || orderId
    if (!idToCopy) return
    navigator.clipboard.writeText(idToCopy)
    setCopied(true)
    toast.success('Order Number copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Format currency in Indian Rupees
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '₹0'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPriceWithDecimals = (price) => {
    if (!price || isNaN(price)) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Date not available'
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return 'Date not available'
    }
  }

  // Order Details
  const isCod = orderData?.paymentMethod === 'cod' || orderData?.payment?.method === 'cod'
  const isPaid = orderData?.paymentStatus === 'completed' || orderData?.paymentStatus === 'paid' || orderData?.payment?.status === 'completed'
  const totalAmount = orderData?.totalAmount || orderData?.total || 0
  const items = Array.isArray(orderData?.items) ? orderData.items : []
  const shippingAddress = orderData?.shippingAddress || {}
  const recipientName = [shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(' ') || 'Customer'
  const displayId = orderData?.orderId || orderId || ''
  const invoiceNumber = orderData?.invoiceNumber || `INV/EC/2026-27/${(displayId || '223355').slice(-6)}`
  const paymentMethodLabel = isCod ? 'Pay on Delivery' : 'Prepaid Online'
  const formattedOrderDate = formatDate(orderData?.orderDate || orderData?.createdAt)
  const paymentTransactionId = orderData?.payment?.transactionId || orderData?.payment?.razorpayPaymentId || orderData?.paymentId || ''

  // Indian GST 18% inclusive inside price:
  // Taxable Value = total / 1.18
  // Total GST = total - Taxable Value
  const taxDetails = orderData?.taxDetails || {
    taxableAmount: Math.round((totalAmount / 1.18) * 100) / 100,
    totalGst: Math.round((totalAmount - (totalAmount / 1.18)) * 100) / 100,
    cgst: Math.round(((totalAmount - (totalAmount / 1.18)) / 2) * 100) / 100,
    sgst: Math.round(((totalAmount - (totalAmount / 1.18)) / 2) * 100) / 100,
    rate: 18
  }

  const taxableAmount = taxDetails.taxableAmount || Math.round((totalAmount / 1.18) * 100) / 100
  const totalGst = taxDetails.totalGst || Math.round((totalAmount - taxableAmount) * 100) / 100
  const cgst = taxDetails.cgst || Math.round((totalGst / 2) * 100) / 100
  const sgst = taxDetails.sgst || Math.round((totalGst - cgst) * 100) / 100

  // Zero-flash privacy screen: neutral pure white background while initial verification takes place
  if (fetchStatus === 'idle') {
    return <div className="min-h-[calc(100vh-64px)] bg-white" />
  }

  // If order is not found, unauthorized, or does not belong to user: render 404 page directly
  if (fetchStatus === 'not_found') {
    return <NotFoundView />
  }

  return (
    <>
      {/* 
        ============================================================
        1. SCREEN VIEW: PURE WHITE BACKGROUND & CLEAN RECEIPT BILL
        Matches website look (bg-white, clean borders, black accents)
        Zero border lines on cutouts and spikes
        Hidden on print
        ============================================================
      */}
      <div className="print:hidden min-h-[calc(100vh-64px)] bg-white py-8 sm:py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-5xl w-full">

          {/* STATE 2: CONFIRMING ORDER STATE */}
          {fetchStatus === 'loading' && (
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-8 sm:p-12 text-center max-w-md mx-auto">
              <ConfirmLoader subtext="Verifying payment & securing order..." />
            </div>
          )}

          {/* STATE 3: CREATIVE 2-COLUMN ORDER CONFIRMATION DASHBOARD */}
          {fetchStatus === 'success' && orderData && (
            <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-10 lg:p-12 relative">
              
              {/* Main 2-Column Creative Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                {/* ================= LEFT COLUMN: Thank You & Delivery Address ================= */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Title & Subtitle */}
                  <div className="space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Order Confirmed
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight leading-tight">
                      Thank you for your purchase!
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      Your order has been confirmed and is being processed by our fulfillment team. You will receive real-time dispatch and delivery updates via SMS & email.
                    </p>
                  </div>

                  {/* Delivery & Billing Address Showcase Card */}
                  <div className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-200/60">
                      <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-2xs">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xs font-bold text-gray-900 tracking-tight uppercase">
                        Delivery & Billing Address
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs sm:text-[13px]">
                      <div>
                        <h4 className="text-sm font-bold text-gray-950">
                          {recipientName}
                        </h4>
                        <p className="text-gray-600 font-medium leading-relaxed mt-0.5">
                          {shippingAddress.address || 'Address on file'}
                          {shippingAddress.city ? `, ${shippingAddress.city}` : ''}
                          {shippingAddress.state ? `, ${shippingAddress.state}` : ''}
                          {shippingAddress.zipCode ? ` — ${shippingAddress.zipCode}` : ''}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-400 font-medium">Phone:</span>
                          <span className="font-semibold text-gray-900">{shippingAddress.phone || 'On file'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-gray-400 font-medium">Email:</span>
                          <span className="font-semibold text-gray-900 break-all">{shippingAddress.email || 'On file'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Navigation Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/order/${encodeURIComponent(displayId)}`}
                      className="h-11 px-7 bg-black hover:bg-neutral-800 text-white rounded-full text-xs sm:text-sm font-bold inline-flex items-center justify-center transition-all shadow-sm active:scale-95 gap-2"
                    >
                      <span>Track Your Order</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <Link
                      href="/"
                      className="h-11 px-6 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center justify-center transition-all active:scale-95"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>

                {/* ================= RIGHT COLUMN: Exact Bill Receipt Ticket Design ================= */}
                <div className="lg:col-span-6 lg:pt-6">
                  {/* Ticket wrapper with drop-shadow so the paper slip and spikes have realistic depth */}
                  <div className="relative filter drop-shadow-xs">
                    {/* Main Ticket Paper Body */}
                    <div className="relative bg-[#f4f5f7] rounded-t-2xl">
                      
                      {/* Top Header: Order Summary + Print Invoice Button */}
                      <div className="flex items-center justify-between px-6 pt-5 pb-3">
                        <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                          Order Summary
                        </h2>

                        <button
                          type="button"
                          onClick={handlePrint}
                          className="h-8 px-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200/90 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
                          title="Print Official Tax Invoice"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Print Invoice</span>
                        </button>
                      </div>

                      {/* Meta Row: Date | Order Number | Payment Method */}
                      <div className="px-6 flex flex-wrap items-start justify-between gap-y-3 pt-1">
                        <div className="flex items-start gap-x-6 sm:gap-x-7">
                          {/* Date */}
                          <div>
                            <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Date</span>
                            <span className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                              {formattedOrderDate}
                            </span>
                          </div>

                          {/* Order Number: starts directly after Date with standard gap & hover tooltip */}
                          <div>
                            <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Order Number</span>
                            <div className="relative group inline-flex items-center">
                              <button
                                type="button"
                                onClick={copyOrderId}
                                className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap text-left hover:text-neutral-700 transition-colors cursor-pointer select-all focus:outline-none"
                                title="Click to copy order reference"
                              >
                                {displayId}
                              </button>

                              {/* Floating Tooltip Tag on Cursor Hover - Bottom Side */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-y-0.5 group-hover:translate-y-0 z-30">
                                <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 mx-auto -mb-1" />
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
                          </div>
                        </div>

                        {/* Payment Method */}
                        <div className="text-left sm:text-right">
                          <span className="text-gray-400 block text-[10px] font-semibold uppercase tracking-wider">Payment Method</span>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                            {paymentMethodLabel}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Notches at the Dashed Fold Line (Pure White, Borderless for Seamless Cutout) */}
                      <div className="relative my-4">
                        {/* Left Semicircle Cutout */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white pointer-events-none" />
                        {/* Right Semicircle Cutout */}
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white pointer-events-none" />
                        {/* Dashed Perforated Fold Line */}
                        <div className="border-b border-dashed border-gray-300 mx-5" />
                      </div>

                      {/* Purchased Items List */}
                      <div className="px-6 space-y-3 max-h-72 overflow-y-auto pr-3">
                        {items.map((item, index) => {
                          const productId = item.product?._id || item.product?.id || (typeof item.product === 'string' ? item.product : '')
                          const itemSubtotal = (item.price || 0) * (item.quantity || 1)
                          const hasImage = item.image && item.image.trim().length > 0

                          return (
                            <div key={item._id || index} className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200/80 shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                                  {hasImage ? (
                                    <Image
                                      src={item.image}
                                      alt={item.name || 'Product'}
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  {productId ? (
                                    <Link
                                      href={`/product/${productId}`}
                                      className="font-bold text-gray-900 hover:underline line-clamp-1 block text-xs sm:text-sm"
                                    >
                                      {item.name || 'Product'}
                                    </Link>
                                  ) : (
                                    <h4 className="font-bold text-gray-900 line-clamp-1 text-xs sm:text-sm">
                                      {item.name || 'Product'}
                                    </h4>
                                  )}
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {item.brand ? `${item.brand} • ` : ''}Qty: {item.quantity || 1}
                                  </p>
                                </div>
                              </div>

                              <span className="font-bold text-gray-900 text-xs sm:text-sm shrink-0">
                                {formatPrice(itemSubtotal)}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Solid Separator */}
                      <div className="border-b border-gray-200 mx-6 my-4" />

                      {/* Price Breakdown with Indian GST Laws */}
                      <div className="px-6 space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Sub Total (Taxable Value)</span>
                          <span className="font-medium text-gray-900">{formatPrice(taxableAmount)}</span>
                        </div>

                        {/* GST Split (Inside Price, as per Indian Law) */}
                        <div className="flex justify-between text-gray-500 text-[11px]">
                          <span>CGST (9%) + SGST (9%)</span>
                          <span className="font-medium text-gray-700">₹{cgst.toLocaleString('en-IN')} + ₹{sgst.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Total GST (18% Included)</span>
                          <span className="font-medium text-gray-900">{formatPrice(totalGst)}</span>
                        </div>

                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span className="font-semibold text-emerald-700">Free</span>
                        </div>
                      </div>

                      {/* Solid Separator */}
                      <div className="border-b border-gray-200 mx-6 my-4" />

                      {/* Order Total */}
                      <div className="px-6 pb-6">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-black text-gray-900 text-sm sm:text-base block">
                              Order Total
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Inclusive of all taxes (GST 18%)
                            </span>
                          </div>
                          <span className="font-black text-gray-950 text-base sm:text-xl">
                            {formatPrice(totalAmount)}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Sawtooth Serrated Spikes Bottom Edge - rendered cleanly on white card */}
                    <div className="w-full overflow-hidden leading-none select-none -mt-px">
                      <svg
                        className="w-full h-3.5 text-[#f4f5f7] fill-current block"
                        viewBox="0 0 480 12"
                        preserveAspectRatio="none"
                      >
                        <path d="M0,0 L8,12 L16,0 L24,12 L32,0 L40,12 L48,0 L56,12 L64,0 L72,12 L80,0 L88,12 L96,0 L104,12 L112,0 L120,12 L128,0 L136,12 L144,0 L152,12 L160,0 L168,12 L176,0 L184,12 L192,0 L200,12 L208,0 L216,12 L224,0 L232,12 L240,0 L248,12 L256,0 L264,12 L272,0 L280,12 L288,0 L296,12 L304,0 L312,12 L320,0 L328,12 L336,0 L344,12 L352,0 L360,12 L368,0 L376,12 L384,0 L392,12 L400,0 L408,12 L416,0 L424,12 L432,0 L440,12 L448,0 L456,12 L464,0 L472,12 L480,0 Z" />
                      </svg>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* 
        ============================================================
        2. PRINT VIEW: DEDICATED OFFICIAL 1-PAGE TAX INVOICE
        Strictly fits on 1 single sheet of A4 paper (no 2nd blank page)
        E-Commerce retail platform corporate details
        ============================================================
      */}
      <div className="hidden print:block bg-white text-black text-[10px] leading-tight p-0 m-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}} />

        <div className="max-w-[100%] mx-auto space-y-2.5">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b-2 border-black pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-black">EverCart</span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-gray-700 border border-gray-400 px-1 py-0.5 rounded">
                  TAX INVOICE
                </span>
              </div>
              <p className="text-[9px] text-gray-700 mt-0.5 font-bold">EverCart Commerce India Private Limited</p>
              <p className="text-[9px] text-gray-600">GSTIN: 19AABCE1234F1Z5 • State Code: 19 (West Bengal)</p>
              <p className="text-[9px] text-gray-600">Reg. Office: EverCart Campus, Salt Lake Sector V, Kolkata - 700091</p>
              <p className="text-[8.5px] text-gray-500">Official E-Commerce Marketplace & Retail Platform</p>
            </div>

            <div className="text-right">
              <h2 className="text-sm font-black uppercase text-black">Original For Recipient</h2>
              <p className="text-[11px] font-mono font-black mt-0.5">Invoice No: {invoiceNumber}</p>
              <p className="text-[9px] text-gray-600">Invoice Date: {formattedOrderDate}</p>
              <p className="text-[9px] text-gray-600">Order Ref: {displayId}</p>
            </div>
          </div>

          {/* Customer & Fulfillment Info Box */}
          <div className="grid grid-cols-2 gap-3 border border-gray-300 rounded p-2 bg-gray-50/30 text-[9.5px]">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[9px] text-gray-500 mb-0.5">
                Billed To & Shipped To:
              </h4>
              <p className="font-bold text-black text-[10.5px]">{recipientName}</p>
              <p className="text-gray-800 leading-snug">
                {shippingAddress.address || 'Address on file'}
                {shippingAddress.city ? `, ${shippingAddress.city}` : ''}
                {shippingAddress.state ? `, ${shippingAddress.state}` : ''}
                {shippingAddress.zipCode ? ` - ${shippingAddress.zipCode}` : ''}
              </p>
              <p className="text-gray-700 mt-0.5">Phone: {shippingAddress.phone || 'On file'} | Email: {shippingAddress.email || 'On file'}</p>
              <p className="text-gray-600">Place of Supply: {shippingAddress.state || 'West Bengal'} (State Code: 19)</p>
            </div>

            <div className="space-y-0.5 text-gray-700">
              <h4 className="font-bold uppercase tracking-wider text-[9px] text-gray-500 mb-0.5">
                Payment & Fulfillment Particulars:
              </h4>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-black">{paymentMethodLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-bold text-black">{isPaid ? 'PAID IN FULL' : 'PAY ON DELIVERY'}</span>
              </div>
              {paymentTransactionId && (
                <div className="flex justify-between font-mono">
                  <span>Transaction Ref:</span>
                  <span className="text-black">{paymentTransactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Partner:</span>
                <span className="font-medium text-black">EverCart Express Delivery</span>
              </div>
            </div>
          </div>

          {/* Indian GST Compliant Itemized Table */}
          <table className="w-full border-collapse border border-gray-400 text-[9px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400 text-left">
                <th className="p-1.5 border-r border-gray-400 w-6 text-center">#</th>
                <th className="p-1.5 border-r border-gray-400">Description of Goods</th>
                <th className="p-1.5 border-r border-gray-400 w-16">HSN Code</th>
                <th className="p-1.5 border-r border-gray-400 w-10 text-center">Qty</th>
                <th className="p-1.5 border-r border-gray-400 w-16 text-right">Unit Price</th>
                <th className="p-1.5 border-r border-gray-400 w-20 text-right">Taxable Amt</th>
                <th className="p-1.5 border-r border-gray-400 w-16 text-right">CGST (9%)</th>
                <th className="p-1.5 border-r border-gray-400 w-16 text-right">SGST (9%)</th>
                <th className="p-1.5 w-20 text-right">Total (Incl. Tax)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const itemGross = (item.price || 0) * (item.quantity || 1)
                const itemTaxable = Math.round((itemGross / 1.18) * 100) / 100
                const itemGst = Math.round((itemGross - itemTaxable) * 100) / 100
                const itemCgst = Math.round((itemGst / 2) * 100) / 100
                const itemSgst = Math.round((itemGst - itemCgst) * 100) / 100

                return (
                  <tr key={item._id || index} className="border-b border-gray-300">
                    <td className="p-1.5 border-r border-gray-400 text-center font-mono">{index + 1}</td>
                    <td className="p-1.5 border-r border-gray-400 font-medium">
                      {item.name || 'Product'}
                      <div className="text-[8px] text-gray-500">Brand: {item.brand || 'EverCart'} • 1 Year Warranty Included</div>
                    </td>
                    <td className="p-1.5 border-r border-gray-400 font-mono">85171300</td>
                    <td className="p-1.5 border-r border-gray-400 text-center font-bold">{item.quantity || 1}</td>
                    <td className="p-1.5 border-r border-gray-400 text-right">{formatPrice(item.price || 0)}</td>
                    <td className="p-1.5 border-r border-gray-400 text-right font-mono">{formatPriceWithDecimals(itemTaxable)}</td>
                    <td className="p-1.5 border-r border-gray-400 text-right font-mono">{formatPriceWithDecimals(itemCgst)}</td>
                    <td className="p-1.5 border-r border-gray-400 text-right font-mono">{formatPriceWithDecimals(itemSgst)}</td>
                    <td className="p-1.5 text-right font-bold font-mono">{formatPrice(itemGross)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Tax Breakdown & Invoice Totals */}
          <div className="grid grid-cols-12 gap-2 pt-0.5">
            {/* Amount in words */}
            <div className="col-span-7 border border-gray-300 rounded p-2 text-[9px] space-y-1">
              <span className="font-bold uppercase text-[8.5px] text-gray-500 block">Total Amount in Words:</span>
              <p className="font-bold text-black italic">{numberToIndianWords(totalAmount)}</p>
              
              <div className="pt-1 mt-1 border-t border-gray-200 text-[8px] text-gray-500">
                <p>Tax Note: GST is collected as per Indian GST Rules 2017. All product rates are inclusive of 18% GST (9% CGST + 9% SGST).</p>
              </div>
            </div>

            {/* Financial Totals */}
            <div className="col-span-5 border border-gray-300 rounded p-2 space-y-1 text-[9px] bg-gray-50/30">
              <div className="flex justify-between text-gray-700">
                <span>Taxable Value (Excl. Tax):</span>
                <span className="font-mono font-medium text-black">{formatPriceWithDecimals(taxableAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Central GST (CGST 9%):</span>
                <span className="font-mono font-medium text-black">{formatPriceWithDecimals(cgst)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>State GST (SGST 9%):</span>
                <span className="font-mono font-medium text-black">{formatPriceWithDecimals(sgst)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Total Tax Amount (18%):</span>
                <span className="font-mono font-medium text-black">{formatPriceWithDecimals(totalGst)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping & Delivery Fee:</span>
                <span className="font-medium text-black">₹0.00 (Free)</span>
              </div>
              <div className="border-t-2 border-black pt-1 flex justify-between font-black text-[11px] text-black">
                <span>Grand Total (Incl. Taxes):</span>
                <span className="font-mono">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Legal Declarations & Digital Signature */}
          <div className="border-t border-gray-300 pt-2 flex justify-between items-end text-[8.5px] text-gray-600">
            <div className="space-y-0.5 max-w-sm">
              <p className="font-bold text-black">Declaration & Terms:</p>
              <p>1. Certified that the particulars given above are true and correct.</p>
              <p>2. This is a computer-generated Tax Invoice and requires no physical signature.</p>
              <p>Support: support@evercart.in | Customer Care: 1800-202-3000</p>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block border border-gray-400 rounded px-2 py-0.5 bg-gray-100 font-mono text-[8px] font-bold text-gray-800">
                DIGITALLY CERTIFIED & VERIFIED
              </div>
              <p className="font-bold text-black text-[9px]">For EverCart Commerce India Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
