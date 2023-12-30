const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new mongoose.Schema({
  userOrderId: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  Seller: {
    type: Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  sercvice: {
    type: String,
    required: true,
  },
  product: {
    type: Object,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: String,
    required: true,
  },
  orderStatus: {
    type: String,
    default: "placed",
  },
  bookingDate: {
    type: Date,
  },
  bookingTime: {
    type: String,
  },

});

const model = new mongoose.model("SellerOrder", schema);

module.exports = model;
