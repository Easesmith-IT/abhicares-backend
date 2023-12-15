const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Types.ObjectId,
      ref: "Seller",
    },
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
    },

    userAddress: {
      addressLine: {
        type: String,
        required: true,
      },
      pincode: {
        type: Number,
        required: true,
      },
      landmark: {
        type: String,
        required: true,
      },

    },
    product: {
      type: Object,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    bookingDate: {
      type: String,
      required: true,
    },
    bookingTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "created",
    },
    orderValue: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
