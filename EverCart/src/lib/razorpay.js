// Simple Razorpay integration
export const razorpayConfig = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'thisissupersecret'
}

export const createRazorpayOrder = async (amount, orderId) => {
  try {
    const response = await fetch('/api/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, orderId })
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Razorpay order creation failed:', error)
    throw error
  }
}

export const verifyPayment = async (paymentData) => {
  try {
    const response = await fetch('/api/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment verification failed:', error)
    throw error
  }
}
