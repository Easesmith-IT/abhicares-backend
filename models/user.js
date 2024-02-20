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
    // razorPayOrderId: {
    //     type: String,
    //     // required: true,
    // },
    // gender:{
    //     type: String,
    //     required:true
    // },
    otp: {
      type: Number,
    },
    otpExpiresAt:{
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
