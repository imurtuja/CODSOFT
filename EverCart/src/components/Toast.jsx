'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

/**
 * Global toast dispatcher callable from anywhere
 */
export const toast = {
  success: (message, duration = 3200) => emitToast(message, 'success', duration),
  error: (message, duration = 4000) => emitToast(message, 'error', duration),
  warning: (message, duration = 3500) => emitToast(message, 'warning', duration),
  info: (message, duration = 3200) => emitToast(message, 'info', duration),
}

function emitToast(message, type = 'info', duration = 3200) {
  if (typeof window === 'undefined') return
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  window.dispatchEvent(
    new CustomEvent('app:toast', {
      detail: { id, message, type, duration },
    })
  )
}

function ToastItem({ item, onRemove }) {
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)

  const triggerClose = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      onRemove(item.id)
    }, 180)
  }, [onRemove, item.id])

  useEffect(() => {
    const mountTimer = requestAnimationFrame(() => {
      setMounted(true)
    })

    if (item.duration > 0) {
      timerRef.current = setTimeout(() => {
        triggerClose()
      }, item.duration)
    }

    return () => {
      cancelAnimationFrame(mountTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [item.duration, triggerClose])

  const isCart = typeof item.message === 'string' && item.message.toLowerCase().includes('cart')

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-neutral-900/95 text-white shadow-xl border border-neutral-800/80 backdrop-blur-md transition-all duration-200 ease-out select-none whitespace-nowrap max-w-[92vw] ${
        mounted && !exiting
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-4 scale-95'
      }`}
    >
      {/* Icon Indicator */}
      <div className="flex-shrink-0">
        {item.type === 'success' && (
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {item.type === 'error' && (
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        {item.type === 'warning' && (
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </div>
        )}
        {item.type === 'info' && (
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Message text */}
      <span className="text-xs sm:text-sm font-medium text-neutral-100 whitespace-nowrap truncate max-w-[220px] sm:max-w-[320px]">
        {item.message}
      </span>

      {/* Cart action link */}
      {isCart && item.type === 'success' && (
        <Link
          href="/cart"
          onClick={triggerClose}
          className="flex-shrink-0 whitespace-nowrap text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors ml-0.5"
        >
          View Cart
        </Link>
      )}

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={triggerClose}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-neutral-400 hover:text-white p-0.5 rounded-full transition-colors ml-0.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handleToast = (e) => {
      const { id, message, type, duration } = e.detail || {}
      if (!message) return

      // Limit to 3 active toasts
      setToasts((prev) => [...prev.slice(-2), { id, message, type, duration }])
    }

    window.addEventListener('app:toast', handleToast)
    return () => window.removeEventListener('app:toast', handleToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col items-end space-y-2 pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} onRemove={removeToast} />
      ))}
    </div>
  )
}
