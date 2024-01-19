const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerWalletSchema = new Schema(
  {
    sellerId: {
      type: mongoose.ObjectId,
      ref: "Seller",
      required: true,
    },
    Balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerWallet", sellerWalletSchema);
