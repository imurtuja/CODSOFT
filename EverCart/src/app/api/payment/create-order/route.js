import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { getAuthUser } from "@/lib/auth";

// Initialize Razorpay client if credentials are configured
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = keyId && keySecret ? new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
}) : null;

export async function POST(request) {
  try {
    const { orderId, userId } = await request.json();
    const authUser = getAuthUser(request);

    // Verify gateway configuration
    if (!razorpay) {
      console.warn('Razorpay keys not configured in environment variables');
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
        { status: 500 }
      );
    }

    await connectDB();
    
    const effectiveUserId = (userId ? String(userId).trim() : null) || authUser?.userId;
    if (!effectiveUserId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const cleanOrderId = String(orderId).trim();

    // Lookup order by ObjectId or orderId
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

    // Verify requester ownership
    const orderUserId = order.user ? order.user.toString() : null;
    if (orderUserId && String(orderUserId) !== String(effectiveUserId) && authUser?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prevent duplicate payments or payment on cancelled orders
    if (order.paymentStatus === 'completed' || order.paymentStatus === 'paid') {
      return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
    }

    if (order.orderStatus === 'cancelled') {
      return NextResponse.json({ error: "Order is cancelled" }, { status: 400 });
    }

    // Calculate authoritative amount directly from database record
    const authoritativeAmount = Math.max(1, Math.round(Number(order.totalAmount || order.total) || 0));

    // Cap amount in test mode to satisfy Razorpay sandbox limit (₹5,00,000)
    const paiseAmount = Math.min(authoritativeAmount * 100, 49999900);
    const receiptId = String(order.orderId || order._id).slice(0, 40);

    const razorpayOrder = await razorpay.orders.create({
      amount: paiseAmount,
      currency: "INR",
      receipt: receiptId,
      notes: {
        orderId: String(order._id),
        displayOrderId: String(order.orderId || ''),
        userId: String(effectiveUserId),
        authoritativeAmount: String(authoritativeAmount)
      },
    });

    // Record gateway order ID on order record
    order.payment = {
      method: "razorpay",
      status: "pending",
      amount: authoritativeAmount,
      currency: "INR",
      razorpayOrderId: razorpayOrder.id,
    };
    order.razorpayOrderId = razorpayOrder.id;

    await order.save();

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount, // in paise
      currency: "INR",
      name: "EverCart",
      description: `Order #${order.orderId || order._id}`,
      orderId: order._id,
      displayOrderId: order.orderId
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    const errorMessage = error?.error?.description || error?.message || "Failed to create payment order";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
