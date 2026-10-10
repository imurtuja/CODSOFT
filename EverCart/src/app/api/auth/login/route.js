import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import User from '../../../../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getCookieDomain } from '../../../../lib/auth.js'

export async function POST(request) {
  try {
    await connectDB()
    
    const { email, password } = await request.json()
    
    // Sanitize inputs
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password must be valid strings' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate auth token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'your-secure-secret-key',
      { expiresIn: '7d', algorithm: 'HS256' }
    )
    
    // Exclude password hash from payload
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })

    // Set session cookies
    const cookieDomain = getCookieDomain(request)
    const isProd = process.env.NODE_ENV === 'production'

    const cookieBase = {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
    }

    // Host-only cookies
    response.cookies.set('token', token, { ...cookieBase, httpOnly: false })
    if (user.role === 'admin') {
      response.cookies.set('admin_token', token, { ...cookieBase, httpOnly: true })
    }

    // Cross-subdomain cookies
    if (cookieDomain) {
      response.cookies.set('token_shared', token, { ...cookieBase, domain: cookieDomain, httpOnly: false })
      if (user.role === 'admin') {
        response.cookies.set('admin_token_shared', token, { ...cookieBase, domain: cookieDomain, httpOnly: true })
      }
    }
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}
