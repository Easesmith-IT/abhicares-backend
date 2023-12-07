const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
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
    mobile: {
      type: String,
      required: true,
    },
    defaultAddress: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("userAddress", addressSchema);
