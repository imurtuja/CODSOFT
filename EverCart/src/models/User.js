import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

const cartItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1 },
  brand: String
}, { _id: false })

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  addresses: [addressSchema],
  cart: { type: [cartItemSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', userSchema)
