import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

export function getAuthUser(request) {
  try {
    let token = null

    // 1. Check Bearer Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim()
    }

    // 2. Check HTTP cookie
    if (!token && typeof request.cookies?.get === 'function') {
      token = request.cookies.get('token')?.value || request.cookies.get('admin_token')?.value
    }

    if (!token) {
      token = request.headers.get('x-admin-token')
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
      token = authHeader.substring(7).trim()
    }

    if (!token && typeof request.cookies?.get === 'function') {
      token = request.cookies.get('token')?.value || request.cookies.get('admin_token')?.value
    }

    if (!token) {
      token = request.headers.get('x-admin-token')
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
