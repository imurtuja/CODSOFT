import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import User from '../../../../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getAuthUser, getCookieDomain } from '../../../../lib/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret-key'

export async function GET(request) {
  try {
    await connectDB()

    const authUser = getAuthUser(request)
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await User.findById(authUser.userId).select('-password').lean()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ authenticated: false }, { status: 403 })
    }

    return NextResponse.json({
      authenticated: true,
      user
    })
  } catch (error) {
    console.error('Session verify error:', error.message)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await connectDB()
    const cookieDomain = getCookieDomain(request)
    const isProd = process.env.NODE_ENV === 'production'

    // 1. Check if authenticated via Bearer token in header (session sync)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const incomingToken = authHeader.substring(7).trim()
      try {
        const decoded = jwt.verify(incomingToken, JWT_SECRET)
        if (decoded && decoded.role === 'admin') {
          const user = await User.findById(decoded.userId).select('-password').lean()
          if (user && user.role === 'admin') {
            const response = NextResponse.json({
              success: true,
              authenticated: true,
              token: incomingToken,
              user
            })

            const cookieOpts = {
              path: '/',
              sameSite: 'lax',
              httpOnly: false,
              secure: isProd,
              maxAge: 7 * 24 * 60 * 60,
              ...(cookieDomain ? { domain: cookieDomain } : {})
            }

            response.cookies.set('token', incomingToken, cookieOpts)
            response.cookies.set('admin_token', incomingToken, {
              ...cookieOpts,
              httpOnly: true
            })

            return response
          }
        }
      } catch (err) {}
    }

    // 2. Fallback: email/password credentials
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied: Administrator privileges required' },
        { status: 403 }
      )
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const { password: _, ...safeUser } = user.toObject()
    const response = NextResponse.json({
      success: true,
      token,
      user: safeUser
    })

    const cookieOpts = {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    }

    response.cookies.set('token', token, cookieOpts)
    response.cookies.set('admin_token', token, {
      ...cookieOpts,
      httpOnly: true
    })

    return response
  } catch (error) {
    console.error('Admin authentication error:', error.message)
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}
