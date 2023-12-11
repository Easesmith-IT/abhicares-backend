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
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product", // Replace with the actual name of your Product model
          // required: true
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

cartSchema.methods.addProduct = function (prod) {
  const cartProductIndex = this.items.findIndex((cp) => {
    // console.log(" cart skuId",cp.skuId.toString());
    // console.log("prod skuId", sku._id.toString());
    // console.log(cp.skuId.toString() === sku._id.toString());
    return cp.productId.toString() === prod._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.items];
  // console.log(cartProductIndex);
  if (cartProductIndex >= 0) {
    newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: prod._id,
      quantity: newQuantity,
    });
  }
  this.totalPrice += prod.offerPrice;
  this.items = updatedCartItems;
  return this.save();
};

cartSchema.methods.deleteProduct = function (prod) {
  const cartProductIndex = this.items.findIndex(
    (cp) => cp.productId.toString() === prod._id.toString()
  );
  let updatedCartItems = [...this.items];
  let quantity = updatedCartItems[cartProductIndex].quantity;

  if (quantity > 1) {
    quantity = updatedCartItems[cartProductIndex].quantity - 1;
    updatedCartItems[cartProductIndex].quantity = quantity;
  } else {
    updatedCartItems = this.items.filter(
      (item) => item.productId.toString() !== prod._id.toString()
    );
  }
  this.totalPrice -= prod.offerPrice;
  this.items = updatedCartItems;
  return this.save();
};

module.exports = mongoose.model("Cart", cartSchema);
