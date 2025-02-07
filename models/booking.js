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
    itemTotalValue: {
      type: Number,
      default: 0,
    },
    itemTotalTax: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["completed", "pending"],
    },
    paymentType: {
      type: String,
      enum: ["online", "cash", "onlineCod"],
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
      type: Date,
      required: true,
    },
    bookingTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      default: "not-alloted",
    },
    refundInfo: {
      status: {
        type: String,
        enum: ["pending", "processed", "failed", "not-applicable"],
        default: "not-applicable",
      },
      amount: {
        type: Number,
        default: 0,
      },
      processedAt: Date,
      refundId: String,
      reason: String,
      refundPercentage: Number,
      transactionDetails: {
        gatewayResponse: String,
        processedAt: Date,
        gatewayRefundId: String,
        type: {
          type: String,
          enum: ["online_refund", "cod_online_refund", "manual_refund"],
        },
      },
    },
    cancellationReason: String,
    cancelledAt: Date,
    autoAssigned: {
      type: Boolean,
      default: false,
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
          "cancelled",
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
    bookingId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
