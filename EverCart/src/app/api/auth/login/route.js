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
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
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
      { expiresIn: '7d' }
    )
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject()
    
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })

    // Set cookie for browser sessions (scoped to root domain so admin subdomain also receives it)
    const cookieDomain = getCookieDomain(request)
    const isProd = process.env.NODE_ENV === 'production'

    const cookieOpts = {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
      ...(cookieDomain ? { domain: cookieDomain } : {})
    }

    response.cookies.set('token', token, cookieOpts)

    if (user.role === 'admin') {
      response.cookies.set('admin_token', token, {
        ...cookieOpts,
        httpOnly: true // Secure HttpOnly for admin token
      })
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
