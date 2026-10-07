'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [isOnAdmin, setIsOnAdmin] = useState(false)

  useEffect(() => {
    setIsOnAdmin(typeof window !== 'undefined' && window.location.host.startsWith('admin.'))
  }, [])

  const getMainUrl = (path = '') => {
    if (typeof window === 'undefined') return path
    const host = window.location.host
    if (host.startsWith('admin.')) {
      const protocol = window.location.protocol
      if (host.includes('localhost')) {
        return `${protocol}//${host.replace(/^admin\./, '')}${path}`
      }
      return `https://evercart.murtuja.in${path}`
    }
    return path
  }

  const renderLink = (href, label, className) => {
    if (isOnAdmin) {
      return (
        <a href={getMainUrl(href)} className={className}>
          {label}
        </a>
      )
    }
    return (
      <Link href={href} prefetch={false} className={className}>
        {label}
      </Link>
    )
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row lg:justify-between items-start gap-10 lg:gap-16">
          
          {/* Shop and Support Links (Order 1 on mobile, Order 2 on desktop) */}
          <div className="order-1 lg:order-2 w-full lg:w-auto">
            <div className="grid grid-cols-2 gap-8 sm:gap-16 lg:gap-24">
              {/* Shop */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Shop</h3>
                <ul className="space-y-3">
                  <li>{renderLink('/categories', 'Categories', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/products', 'All Products', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/cart', 'Shopping Cart', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/orders', 'My Orders', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-white">Support</h3>
                <ul className="space-y-3">
                  <li>{renderLink('/contact', 'Contact Us', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/help', 'Help Center', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/shipping', 'Shipping Info', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                  <li>{renderLink('/returns', 'Returns & Refunds', 'text-gray-400 hover:text-white transition-colors text-sm sm:text-base')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Company Info / Website Branding (Order 2 on mobile, Order 1 on desktop) */}
          <div className="order-2 lg:order-1 max-w-md w-full">
            {isOnAdmin ? (
              <a href={getMainUrl('/')} className="inline-flex items-center space-x-2 mb-4 group">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-black font-bold text-sm">EC</span>
                </div>
                <span className="text-xl font-bold tracking-tight">EverCart</span>
              </a>
            ) : (
              <Link href="/" prefetch={false} className="inline-flex items-center space-x-2 mb-4 group">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-black font-bold text-sm">EC</span>
                </div>
                <span className="text-xl font-bold tracking-tight">EverCart</span>
              </Link>
            )}
            <p className="text-gray-400 mb-6 text-sm sm:text-base leading-relaxed">
              Your trusted destination for premium electronics and cutting-edge gadgets. 
              Quality products with exceptional service.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Twitter / X" 
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook" 
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram" 
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Copyright & Legal Links */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} EverCart. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {renderLink('/privacy', 'Privacy Policy', 'text-gray-400 hover:text-white text-sm transition-colors')}
              {renderLink('/terms', 'Terms of Service', 'text-gray-400 hover:text-white text-sm transition-colors')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}