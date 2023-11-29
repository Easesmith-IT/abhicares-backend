const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // Replace with the actual name of your User model
    },
    items: [
      {
        skuId: {
          type: Schema.Types.ObjectId,
          ref: "Sku", // Replace with the actual name of your Plant model
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    totalValue: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

cartSchema.methods.addProduct = function (sku) {
// console.log("sku", sku);

  const cartProductIndex = this.items.findIndex(
    (cp) => {
      // console.log(" cart skuId",cp.skuId.toString());
      // console.log("prod skuId", sku._id.toString());
      // console.log(cp.skuId.toString() === sku._id.toString());
      return cp.skuId.toString() === sku._id.toString()
    }
  );
  let newQuantity = 1;
  const updatedCartItems = [...this.items];
  // console.log(cartProductIndex);
  if (cartProductIndex >= 0) {
    newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      skuId: sku._id,
      quantity: newQuantity,
    });
  }
  this.totalValue += sku.price;
  this.items = updatedCartItems;
  return this.save();
};

cartSchema.methods.deleteProduct = function (sku) {
  const cartProductIndex = this.items.findIndex(
    (cp) => cp.skuId.toString() === sku._id.toString()
  );
  let updatedCartItems = [...this.items];
  let quantity = updatedCartItems[cartProductIndex].quantity;

  if (quantity > 1) {
    quantity = updatedCartItems[cartProductIndex].quantity - 1;
    updatedCartItems[cartProductIndex].quantity = quantity;
  } else {
    updatedCartItems = this.items.filter(
      (item) => item.skuId.toString() !== sku._id.toString()
    );
  }
  this.totalValue -= sku.price;
  this.items = updatedCartItems;
  return this.save();
};

module.exports = mongoose.model("Cart", cartSchema);
