const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Replace with the actual name of your User model
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order", // Replace with the actual name of your Order model
      required: true,
    },
    razorpay_order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: {
      type: String,
      required: true,
    },
    razorpay_signature: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },

    // Add additional payment-related fields as needed (e.g., transaction ID, payment status, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);