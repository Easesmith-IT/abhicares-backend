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
addressSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("UserAddress", addressSchema);
