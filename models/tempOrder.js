const mongoose = require('mongoose')

const Schema = mongoose.Schema

const tempOrderSchema = new Schema(
  {
    orderPlatform: {
      type: String,
      required: true,
      default: "app",
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
        bookingDate: {
          type: String,
          required: true,
        },
        bookingTime: {
          type: String,
          required: true,
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
          // required: true,
        },
        city: {
          type: String,
          // required: true,
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

        pincode: {
          type: Number,
          // required: true,
        },
        landmark: {
          type: String,
          required: true,
        },
      },
    },
    status: {
      required: true,
      type: String,
      default: "pending",
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
    orderId:{
      type:String,
      required:true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('tempOrder', tempOrderSchema)
