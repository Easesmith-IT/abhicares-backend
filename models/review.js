const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default:""
    },
    content: {
      type: String,
      default:""
    },
    rating: {
      type: Number,
      required:true
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
    packageId: {
      type: mongoose.Types.ObjectId,
      ref: "Package",
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required:true
    },
  },
  { timestamps: true }
);

module.exports=mongoose.model("Review", reviewSchema);
