const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    address_line1: {
      type: String,
      required: true,
    },
    pincode: {
      type: Number,
      // required: true,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const model = new mongoose.model("userAddress", schema);

module.exports = model;
