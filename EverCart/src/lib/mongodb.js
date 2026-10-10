import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required')
}

// Global cached connection across Next.js hot reloads and serverless invocations
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  // 1. If connection is already open and ready, return instantly in 0ms
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // 2. If connection is disconnected or in an error state, reset the promise
  if (mongoose.connection.readyState === 0 && cached.promise) {
    cached.promise = null
    cached.conn = null
  }

  // 3. If a connection is already in progress, await the existing promise rather than opening duplicate connections
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
