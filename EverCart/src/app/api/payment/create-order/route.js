import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

// Check if Razorpay keys are available
const keyId = process.env.RAZORPAY_KEY_ID
const keySecret = process.env.RAZORPAY_KEY_SECRET

if (!keyId || !keySecret) {
  console.error('Razorpay keys not found in environment variables')
  console.error('RAZORPAY_KEY_ID:', keyId ? 'Set' : 'Missing')
  console.error('RAZORPAY_KEY_SECRET:', keySecret ? 'Set' : 'Missing')
}

const razorpay = keyId && keySecret ? new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
}) : null;

export async function POST(request) {
  try {
    const { orderId, amount, userId } = await request.json();
    
    // Check if Razorpay is available
    if (!razorpay) {
      console.log('Razorpay not configured, using demo mode');
      console.log(`Demo mode - Amount: ₹${amount}`);
      
      return NextResponse.json({
        razorpayOrderId: 'demo_order_' + Date.now(),
        key: 'rzp_test_demo',
        amount: amount * 100, // Convert to paise
        currency: "INR",
        name: "EverCart",
        description: `Order #${orderId}`,
        orderId: orderId,
        demo: true
      });
    }

    await connectDB();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "Order ID and amount are required" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify user owns this order
    if (order.user.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log(`Creating Razorpay order for amount: ₹${amount}`);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: orderId,
      notes: {
        orderId: orderId,
        userId: userId,
        amount: amount
      },
    });

    // Update order with Razorpay order ID
    order.payment = {
      method: "razorpay",
      status: "pending",
      amount: amount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
    };

    await order.save();

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount, // Return amount in paise from Razorpay
      currency: "INR",
      name: "EverCart",
      description: `Order #${orderId}`,
      orderId: orderId,
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { error: "Failed to create payment order", details: error.message },
      { status: 500 }
    );
  }
}
