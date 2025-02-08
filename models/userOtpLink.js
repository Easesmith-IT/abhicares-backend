const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userOtpLinkSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    otp: {
      type: Number,
    },
    otpExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserOtpLink", userOtpLinkSchema);
