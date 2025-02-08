const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sellerCashoutSchema = new Schema(
  {
    cashoutId: {
      type: String,
    },
    sellerWalletId: {
      type: mongoose.ObjectId,
      ref: "SellerWallet",
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: true,
    },
    description: {
      type: String,
    },
    accountDetails: {
      date: {
        type: String,
      },
      paymentId: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerCashout", sellerCashoutSchema);
