const mongoose = require("mongoose");

const offerCouponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please provide coupon name"],
    },
    offPercentage: {
      type: Number,
      required: [true, "please provide OFF percentage"],
    },
    date: {
      type: Date,
      //   required:[true,"please provide date"]
    },
    description: {
      type: String,
      required: [true, "please provide some description"],
    },
    status: {
      type: String,
      default: "active",
    },
    noOfTimesPerUser: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", offerCouponSchema);
