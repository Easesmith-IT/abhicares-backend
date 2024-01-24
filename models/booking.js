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
      required: true,
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
      city: {
        type: String,
        required: true,
      },
      location: {
        type: Object,
        // required: true,
      },
    },
    product: {
      type: Object,
      // required: true,
    },
    package: {
      type: Object,
      // required: true,
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
      default: "not-alloted",
    },
    orderValue: {
      type: Number,
    },
    currentLocation: {
      status: {
        type: String,
        enum: [
          "booking-placed",
          "out-of-delivery",
          "reached",
          "completed",
          "completeReq",
        ],
        default: "booking-placed",
      },
      location: {
        type: [Number], // Array of [longitude, latitude]
        default: [0, 0],
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
