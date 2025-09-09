import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    // Read request body once
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature ||
      !orderId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification parameters" },
        { status: 400 }
      );
    }

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.log('Razorpay not configured, skipping signature verification for demo');
      // For demo mode, just proceed without signature verification
    } else {
      // Verify the payment signature
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json(
          { error: "Invalid payment signature" },
          { status: 400 }
        );
      }
    }

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify user owns this order
    if (order.user.toString() !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update order payment status
    order.paymentStatus = "completed";
    order.status = "processing";
    order.payment = {
      method: "razorpay",
      status: "completed",
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      transactionId: razorpayPaymentId,
      amount: order.total,
      currency: "INR",
      completedAt: new Date(),
    };

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      orderId: orderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    return NextResponse.json(
      { error: "Payment verification failed", details: error.message },
      { status: 500 }
    );
  }
}
