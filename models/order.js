const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderPlatform: {
      type: String,
      required: true,
      default: "app",
    },
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    paymentInfo: {
      status: {
        type: String,
        enum: ["completed", "pending"],
      },

      paymentId: {
        type: String,
      },
    },
    orderValue: {
      type: Number,
      required: true,
    },
    itemTotal: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    referalDiscount: {
      type: Number,
    },
    tax: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      default: "Online payment",
    },
    items: [
      {
        product: {
          type: Object,
          // required: true
        },
        package: {
          type: Object,
          // required: true
        },
        quantity: {
          type: Number,
        },
        bookingId: {
          type: Schema.Types.ObjectId,
          ref: "Booking",
          required: false,
        },
        bookingDate: {
          type: Date,
          required: true,
        },
        bookingTime: {
          type: Date,
          required: true,
        },
        refundStatus: {
          type: String,
          enum: ["none", "pending", "processed", "failed", "not-applicable"],
          default: "none",
        },
      },
    ],
    user: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      address: {
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
          type: {
            type: String,
            enum: ["Point"], // Only "Point" is allowed for type
            default: "Point",
          },
          coordinates: {
            type: [Number], // Array of [longitude, latitude]
            default: [0, 0],
          },
        },
      },
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
        additionalInfo: Schema.Types.Mixed,
      },
    },
    cancelledAt: Date,
    cancellationReason: String,
    status: {
      required: true,
      type: String,
      default: "Pending",
      enum: ["Pending", "Completed", "Cancelled", "OutOfDelivery"],
    },
    couponId: {
      type: mongoose.Types.ObjectId,
      ref: "offerCoupon",
    },
    adminComment: {
      required: true,
      type: String,
      default: "Your oder has been placed",
    },

    No_of_left_bookings: {
      type: Number,
      required: true,
    },
    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
  },
  { timestamps: true }
);

orderSchema.index({ "refundInfo.status": 1, "paymentInfo.status": 1 });
orderSchema.index({ orderId: 1, "paymentInfo.status": 1 });

module.exports = mongoose.model("Order", orderSchema);
