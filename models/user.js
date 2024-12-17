const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      default: "password",
    },
    dateOfBirth: {
      type: String,
      required: false,
    },
    Gender: {
      type: String,
      required: false,
      enum: ["MALE", "FEMALE"],
    },
    email: {
      type: String,
    },
    otp: {
      type: Number,
    },
    otpExpiresAt: {
      type: Date,
    },
    cartId: {
      type: Schema.Types.ObjectId,
      ref: "Cart",
    },
    status: {
      type: Boolean,
      default: true,
    },

    referralCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
