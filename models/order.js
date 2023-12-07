const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderPlatform: {
      type: String,
      required: true,
      default: "app",
    },
    orderValue: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      default: "Online payment",
    },
    products: [
      {
        product: {
          type: Object,
          required: true,
        },
        quantity: {
          type: Number,
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
        pincode: {
          type: Number,
          // required: true,
        },
        landmark: {
          type: String,
          required: true,
        },
        mobile: {
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
    adminComment: {
      required: true,
      type: String,
      default: "Your oder has been placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
