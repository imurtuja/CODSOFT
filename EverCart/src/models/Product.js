import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: String,
  brand: String,
  description: String,
  price: Number,
  originalPrice: Number,
  category: String,
  images: [String],
  features: [String],
  specifications: { type: Map, of: String },
  stock: { type: Number, default: 0 },
  sku: { type: String, unique: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  tags: [String],
  isFeatured: { type: Boolean, default: false },
  sales: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
})

productSchema.index({ name: 'text', description: 'text', brand: 'text' })

export default mongoose.models.Product || mongoose.model('Product', productSchema)
