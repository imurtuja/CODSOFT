import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function requireAuth(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token missing' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    return {
      userId: decoded.userId,
      email: decoded.email
    }
  } catch (error) {
    console.error('Auth error:', error.message)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
