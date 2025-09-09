import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  brand: String,
  price: Number,
  quantity: { type: Number, min: 1 },
  image: String
})

const shippingAddressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  state: String,
  zipCode: String
})

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  transactionId: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  failureReason: String,
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date
})

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [orderItemSchema],
  total: Number,
  subtotal: Number,
  tax: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  shippingAddress: shippingAddressSchema,
  paymentMethod: { type: String, enum: ['razorpay', 'cod'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'completed', 'failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  payment: paymentSchema,
  paymentId: String,
  razorpayOrderId: String,
  orderDate: { type: Date, default: Date.now },
  totalAmount: Number
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
