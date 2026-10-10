import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required')
}

// Cache connection across development hot-reloads and serverless invocations
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  // Return existing active connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // Reset cache if connection was dropped
  if (mongoose.connection.readyState === 0 && cached.promise) {
    cached.promise = null
    cached.conn = null
  }

  // Initiate connection if none in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: true, // Keep true to safely buffer queries during connection handshake
      maxPoolSize: 50, // High-concurrency connection pool
      minPoolSize: 10, // Maintain active warm connections to avoid TCP handshake latency
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      autoIndex: false, // Prevents blocking index builds in production
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      cached.conn = m
      return m
    }).catch((err) => {
      cached.promise = null
      cached.conn = null
      throw err
    })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (error) {
    cached.promise = null
    cached.conn = null
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export default connectDB
