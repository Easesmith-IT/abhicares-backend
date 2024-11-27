const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
    },
    reviewType: {
      type: String,
      required: true,
      enum: ["ON-PRODUCT", "ON-BOOKING"],
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: "Order",
    },
    packageId: {
      type: mongoose.Types.ObjectId,
      ref: "Package",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceType: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
    date: {
      type: String,
    },
  },
  {
    timestamps: true,
    indexes: [
      { reviewType: 1 },
      { userId: 1 },
      { productId: 1, reviewType: 1 },
      { bookingId: 1, reviewType: 1 },
      { serviceType: 1, reviewType: 1 },
    ],
  }
);

module.exports = mongoose.model("Review", reviewSchema);
