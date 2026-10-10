'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import SearchBar from './SearchBar'
import AuthModal from './AuthModal'
import { initUserCart } from '../utils/cartManager'
import { getCategoryIcon, ChevronRightIcon } from './CategoryIcons'

const NAV_DEPARTMENTS = [
  { name: 'Electronics', slug: 'electronics', href: '/category/electronics', desc: 'Phones & Smart Wearables' },
  { name: 'Laptops', slug: 'laptops', href: '/category/laptops', desc: 'Ultrabooks & Workstations' },
  { name: 'Gaming', slug: 'gaming', href: '/category/gaming', desc: 'Consoles & Handheld Systems' },
  { name: 'Audio', slug: 'audio', href: '/category/audio', desc: 'Headphones & Home Speakers' },
  { name: 'Cameras', slug: 'cameras', href: '/category/cameras', desc: 'Mirrorless & 4K Gimbals' },
  { name: 'Accessories', slug: 'accessories', href: '/category/accessories', desc: 'Keyboards, Mice & Docks' },
]

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userData, setUserData] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState('login')

  useEffect(() => {
    checkAuth()
    loadCart()

    const handleOpenAuth = (e) => {
      const tab = e?.detail?.tab || 'login'
      setAuthModalTab(tab)
      setAuthModalOpen(true)
    }

    // Listen for authentication & cart changes
    window.addEventListener('cartUpdated', loadCart)
    window.addEventListener('userLoggedIn', checkAuth)
    window.addEventListener('userLoggedOut', checkAuth)
    window.addEventListener('openAuthModal', handleOpenAuth)

    return () => {
      window.removeEventListener('cartUpdated', loadCart)
      window.removeEventListener('userLoggedIn', checkAuth)
      window.removeEventListener('userLoggedOut', checkAuth)
      window.removeEventListener('openAuthModal', handleOpenAuth)
    }
  }, [])

  const checkAuth = () => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      try {
        const parsed = JSON.parse(user)
        setIsLoggedIn(true)
        setUserData(parsed)
        setIsAdmin(parsed.role === 'admin')
        initUserCart()
      } catch (err) {
        console.error(err)
      }
    } else {
      setIsLoggedIn(false)
      setUserData(null)
      setIsAdmin(false)
    }
  }

  const loadCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      const count = cart.reduce((total, item) => total + (item.quantity || 0), 0)
      setCartCount(count)
    } catch {
      setCartCount(0)
    }
  }


  const getAdminUrl = () => {
    if (typeof window === 'undefined') return 'https://admin.evercart.murtuja.in'
    const host = window.location.host
    const protocol = window.location.protocol

    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      const port = window.location.port ? `:${window.location.port}` : ''
      return `${protocol}//admin.localhost${port}`
    }

    if (host.startsWith('admin.')) {
      return `${protocol}//${host}`
    }

    return `${protocol}//admin.evercart.murtuja.in`
  }

  const handleAdminNavigate = async (e) => {
    e.preventDefault()
    if (typeof window === 'undefined') return

    const targetUrl = getAdminUrl()

    try {
      const rawToken = localStorage.getItem('token')
      const token = (rawToken && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null
      if (token) {
        // Request session transfer ticket
        const res = await fetch('/api/auth/admin-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => null)

        if (res && res.ok) {
          const data = await res.json().catch(() => ({}))
          if (data.ticket) {
            // Claim ticket on admin origin to sync session cookies and localStorage
            window.location.href = `${targetUrl}/api/auth/admin-session?claim=${encodeURIComponent(data.ticket)}`
            return
          }
        }
      }
    } catch (err) {
      console.error('Admin ticket transfer failed:', err)
    }

    // Direct navigation fallback
    window.location.href = targetUrl
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUserData(null)
    window.dispatchEvent(new CustomEvent('userLoggedOut'))
    router.push('/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/90 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Nav Links */}
          <div className="flex items-center space-x-6 sm:space-x-7">
            <Link href="/" prefetch={true} className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xs tracking-wider">EC</span>
              </div>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">EverCart</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link
                href="/products"
                prefetch={true}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                All Products
              </Link>

              {/* Categories Flyout Dropdown */}
              <div className="relative group">
                <Link
                  href="/categories"
                  prefetch={true}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span>Categories</span>
                  <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-black group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Dropdown Menu */}
                <div className="absolute left-0 top-full pt-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/90 p-2">
                    <div className="space-y-1">
                      {NAV_DEPARTMENTS.map((dept) => (
                        <Link
                          key={dept.name}
                          href={dept.href}
                          prefetch={true}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group/item"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-800 group-hover/item:bg-black group-hover/item:text-white transition-colors shrink-0">
                            {getCategoryIcon(dept.slug, 'w-4 h-4')}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover/item:text-black">
                              {dept.name}
                            </div>
                            <div className="text-[11px] text-gray-500 line-clamp-1">
                              {dept.desc}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 px-2 py-1">
                      <Link
                        href="/categories"
                        prefetch={true}
                        className="text-xs font-semibold text-gray-900 hover:underline flex items-center justify-between"
                      >
                        <span>View All Departments</span>
                        <ChevronRightIcon className="w-3.5 h-3.5 text-gray-500" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-6">
            <SearchBar />
          </div>

          {/* Right Navigation Actions */}
          <div className="hidden md:flex items-center space-x-2.5">
            {isLoggedIn && (
              <Link
                href="/orders"
                prefetch={true}
                className="text-xs sm:text-sm font-medium text-gray-700 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Orders
              </Link>
            )}

            {isLoggedIn ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-800">
                    {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{userData?.name || 'Account'}</span>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200/90 py-1 overflow-hidden">
                    <Link href="/profile" prefetch={true} className="block px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50">
                      My Profile
                    </Link>
                    <Link href="/orders" prefetch={true} className="block px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50">
                      My Orders
                    </Link>

                    {isAdmin && (
                      <a
                        href={typeof window !== 'undefined' ? getAdminUrl() : 'https://admin.evercart.murtuja.in'}
                        onClick={handleAdminNavigate}
                        className="block px-4 py-2 text-xs sm:text-sm font-medium text-black hover:bg-gray-50 border-t border-gray-100"
                      >
                        Admin Panel
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 border-t border-gray-100 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login')
                    setAuthModalOpen(true)
                  }}
                  className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('signup')
                    setAuthModalOpen(true)
                  }}
                  className="bg-black text-white hover:bg-gray-800 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Shopping Cart Button */}
            <Link
              href="/cart"
              prefetch={true}
              aria-label="Shopping Cart"
              className="relative p-2.5 text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              href="/cart"
              prefetch={true}
              aria-label="Shopping Cart"
              className="relative p-2 text-gray-700 hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white py-4 space-y-4">
            <div className="relative">
              <SearchBar
                onSearchSubmit={() => setIsMobileMenuOpen(false)}
              />
            </div>

            <div className="space-y-1">
              <Link
                href="/products"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                All Products
              </Link>
              <Link
                href="/categories"
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/orders"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  {isAdmin && (
                    <a
                      href={typeof window !== 'undefined' ? getAdminUrl() : 'https://admin.evercart.murtuja.in'}
                      onClick={(e) => {
                        setIsMobileMenuOpen(false)
                        handleAdminNavigate(e)
                      }}
                      className="block px-3 py-2 text-sm font-medium text-black hover:bg-gray-50 rounded-lg"
                    >
                      Admin Panel
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    className="flex-1 text-center py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setAuthModalTab('login')
                      setAuthModalOpen(true)
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className="flex-1 text-center py-2 text-sm font-semibold bg-black text-white rounded-xl hover:bg-gray-800"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setAuthModalTab('signup')
                      setAuthModalOpen(true)
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Auth Popup Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
        onAuthSuccess={() => checkAuth()}
      />
    </nav>
  )
}