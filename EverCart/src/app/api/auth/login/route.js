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
    
    // Strict validation to prevent NoSQL operator injection ($gt, $ne, etc.)
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password must be valid strings' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    
    // Find user
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET || 'your-secure-secret-key',
      { expiresIn: '7d', algorithm: 'HS256' }
    )
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })

    // Set cookies for browser sessions
    const cookieDomain = getCookieDomain(request)
    const isProd = process.env.NODE_ENV === 'production'

    const cookieBase = {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
    }

    // 1. Direct host-only cookies (guaranteed on current origin)
    response.cookies.set('token', token, { ...cookieBase, httpOnly: false })
    if (user.role === 'admin') {
      response.cookies.set('admin_token', token, { ...cookieBase, httpOnly: true })
    }

    // 2. Cross-subdomain cookies for evercart.murtuja.in
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
