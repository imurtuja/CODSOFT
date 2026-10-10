'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from './Toast'
import { syncCartOnLogin } from '../utils/cartManager'

export default function AuthModal({ isOpen, onClose, initialTab = 'login', onAuthSuccess }) {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab) // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    setActiveTab(initialTab)
    setErrorMessage('')
  }, [initialTab, isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Sync local cart items
        await syncCartOnLogin(data.user, data.token)

        // Dispatch session and cart events
        window.dispatchEvent(new CustomEvent('userLoggedIn'))
        window.dispatchEvent(new Event('cartUpdated'))

        toast.success(`Welcome back, ${data.user.firstName || 'User'}!`)
        if (onAuthSuccess) onAuthSuccess(data.user)
        onClose()
      } else {
        const msg = data.error || 'Invalid email or password'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (error) {
      console.error('Login error:', error)
      const msg = 'Unable to connect to server. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (signupData.password !== signupData.confirmPassword) {
      const msg = 'Passwords do not match. Please verify both fields.'
      setErrorMessage(msg)
      toast.warning(msg)
      return
    }

    if (signupData.password.length < 6) {
      const msg = 'Password must be at least 6 characters long.'
      setErrorMessage(msg)
      toast.warning(msg)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          phone: signupData.phone,
          password: signupData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        localStorage.setItem('user', JSON.stringify(data.user))
        if (data.token) {
          localStorage.setItem('token', data.token)
        }

        // Sync local cart items
        await syncCartOnLogin(data.user, data.token)

        window.dispatchEvent(new CustomEvent('userLoggedIn'))
        window.dispatchEvent(new Event('cartUpdated'))

        toast.success(`Welcome to EverCart, ${data.user.firstName}!`)
        if (onAuthSuccess) onAuthSuccess(data.user)
        onClose()
      } else {
        const msg = data.error || 'Signup failed. Please try again.'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (error) {
      console.error('Signup error:', error)
      const msg = 'Unable to connect to server. Please try again.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Positioning wrapper */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        {/* Modal dialog card */}
        <div
          className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 text-left z-10 my-8 transform transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors text-sm cursor-pointer active:scale-90"
            aria-label="Close modal"
          >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 bg-black rounded-xl mx-auto flex items-center justify-center mb-3 shadow-md">
            <span className="text-white font-extrabold text-base tracking-wider">EC</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'login'
              ? 'Access your orders, saved addresses and wishlist'
              : 'Join EverCart for fast checkout & exclusive offers'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setErrorMessage('')
            }}
            className={`flex-1 py-2 rounded-lg active:scale-95 transition-all ${
              activeTab === 'login'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup')
              setErrorMessage('')
            }}
            className={`flex-1 py-2 rounded-lg active:scale-95 transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
            <span className="text-red-500 font-bold shrink-0 mt-0.5">⚠️</span>
            <span className="leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Login form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* Signup form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={signupData.firstName}
                  onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                  placeholder="John"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={signupData.lastName}
                  onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={signupData.phone}
                onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  placeholder="Min 6 chars"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  placeholder="Confirm"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>
        )}

        {/* Terms notice */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            By continuing, you agree to EverCart&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
