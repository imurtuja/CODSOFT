import { NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb.js'
import User from '../../../../models/User.js'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    await connectDB()
    
    const { firstName, lastName, email, password } = await request.json()
    
    // Strict validation to prevent NoSQL operator injection
    if (
      !firstName || !lastName || !email || !password ||
      typeof firstName !== 'string' ||
      typeof lastName !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'All fields are required and must be valid strings' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanFirstName = firstName.trim().slice(0, 60)
    const cleanLastName = lastName.trim().slice(0, 60)
    
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: 'Password must be between 6 and 128 characters' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await User.create({
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user'
    })
    
    // Import jwt is needed at top or use inline
    const jwt = (await import('jsonwebtoken')).default
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
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      token,
      user: userWithoutPassword
    })
    
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
