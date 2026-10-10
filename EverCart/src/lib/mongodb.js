import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required')
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxIdleTimeMS: 60000,
      autoIndex: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    cached.conn = null
    throw e
  }

  return cached.conn
}

export default connectDB
