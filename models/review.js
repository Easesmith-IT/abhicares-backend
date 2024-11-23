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
    serviceType:{
      type:String,
      
    },
    bookingId:{
      type:mongoose.Types.ObjectId,
      ref:"Booking"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
