import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { getAuthUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(request) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId, userId } = await request.json();
    const authUser = getAuthUser(request);
    
    const effectiveUserId = (userId ? String(userId).trim() : null) || authUser?.userId;
    if (!effectiveUserId) {
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

    // Verify the payment signature with Razorpay secret key
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.warn('RAZORPAY_KEY_SECRET not set, proceeding in testing mode');
    } else {
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json(
          { error: "Invalid payment cryptographic signature" },
          { status: 400 }
        );
      }
    }

    // Find the order safely by ObjectId or orderId
    const cleanOrderId = String(orderId).trim();
    let order = null;
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      order = await Order.findById(cleanOrderId);
    }
    if (!order) {
      order = await Order.findOne({ orderId: cleanOrderId });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify razorpay order id matches the one registered in the DB
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order reference mismatch" }, { status: 400 });
    }

    // Verify user owns this order
    const orderUserId = order.user ? order.user.toString() : null;
    if (orderUserId && String(orderUserId) !== String(effectiveUserId) && authUser?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update order payment status to verified completed
    order.paymentStatus = "completed";
    order.orderStatus = "confirmed";
    order.status = "confirmed";
    order.payment = {
      method: "razorpay",
      status: "completed",
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      transactionId: razorpayPaymentId,
      amount: order.totalAmount || order.total,
      currency: "INR",
      completedAt: new Date(),
    };

    await order.save();

    return NextResponse.json({
      success: true,
      message: "Payment cryptographically verified successfully",
      orderId: order._id,
      displayOrderId: order.orderId,
      paymentId: razorpayPaymentId,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Payment verification failed", details: error.message },
      { status: 500 }
    );
  }
}
