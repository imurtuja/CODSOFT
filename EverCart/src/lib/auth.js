import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

function sanitizeToken(token) {
  if (!token || typeof token !== 'string') return null
  const trimmed = token.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'false') return null
  return trimmed
}

export function getAuthUser(request) {
  try {
    let token = null

    // 1. Check Bearer Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = sanitizeToken(authHeader.substring(7))
    }

    // 2. Check HTTP cookies (direct and cross-subdomain)
    if (!token && typeof request.cookies?.get === 'function') {
      token = sanitizeToken(
        request.cookies.get('token')?.value ||
        request.cookies.get('admin_token')?.value ||
        request.cookies.get('token_shared')?.value ||
        request.cookies.get('admin_token_shared')?.value
      )
    }

    // 2b. Check raw Cookie header fallback
    if (!token && typeof request.headers?.get === 'function') {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const parsed = Object.fromEntries(
          cookieHeader.split(';').map(c => {
            const [k, ...v] = c.trim().split('=')
            return [k, decodeURIComponent(v.join('='))]
          })
        )
        token = sanitizeToken(
          parsed['admin_token'] ||
          parsed['token'] ||
          parsed['admin_token_shared'] ||
          parsed['token_shared']
        )
      }
    }

    // 3. Check custom header fallback
    if (!token) {
      token = sanitizeToken(request.headers.get('x-admin-token'))
    }

    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    }
  } catch (error) {
    return null
  }
}

export function requireAuth(request) {
  try {
    let token = null

    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = sanitizeToken(authHeader.substring(7))
    }

    if (!token && typeof request.cookies?.get === 'function') {
      token = sanitizeToken(
        request.cookies.get('token')?.value ||
        request.cookies.get('admin_token')?.value ||
        request.cookies.get('token_shared')?.value ||
        request.cookies.get('admin_token_shared')?.value
      )
    }

    if (!token && typeof request.headers?.get === 'function') {
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        const parsed = Object.fromEntries(
          cookieHeader.split(';').map(c => {
            const [k, ...v] = c.trim().split('=')
            return [k, decodeURIComponent(v.join('='))]
          })
        )
        token = sanitizeToken(
          parsed['admin_token'] ||
          parsed['token'] ||
          parsed['admin_token_shared'] ||
          parsed['token_shared']
        )
      }
    }

    if (!token) {
      token = sanitizeToken(request.headers.get('x-admin-token'))
    }
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization header or token cookie missing' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user'
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export function getCookieDomain(request) {
  try {
    const host = (typeof request?.headers?.get === 'function' ? request.headers.get('host') : '') || ''
    const cleanHost = host.split(':')[0]
    if (!cleanHost || cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      return undefined
    }
    if (cleanHost.includes('evercart.murtuja.in')) {
      return '.evercart.murtuja.in'
    }
    const parts = cleanHost.split('.')
    if (parts.length >= 2) {
      const root = parts.slice(-2).join('.')
      return `.${root}`
    }
  } catch (e) {}
  return undefined
}
