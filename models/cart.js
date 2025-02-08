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
        packageId: {
          type: Schema.Types.ObjectId,
          ref: "Package", // Replace with the actual name of your Product model
          // required: true
        },
        type: {
          type: String,
          required: true,
          default: "product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    // totalPrice: {
    //   type: Number,
    //   default: 0,
    // },
    // totalTax: {
    //   type: Number,
    //   default: 0,
    // },
    // totalCartValue: {
    //   type: Number,
    //   default: 0,
    // },
  },
  { timestamps: true }
);

cartSchema.methods.addToCart = function (prod, type) {
  let newQuantity = 1;
  const updatedCartItems = [...this.items];
  if (type == "product") {
    const cartProductIndex = this.items.findIndex((cp) => {
      return String(cp.productId) === prod._id.toString();
    });
    if (cartProductIndex >= 0) {
      newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: prod._id,
        quantity: newQuantity,
        type: "product",
      });
    }
  } else if (type == "package") {
    const cartProductIndex = this.items.findIndex((cp) => {
      return String(cp.packageId) === prod._id.toString();
    });
    if (cartProductIndex >= 0) {
      newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        packageId: prod._id,
        quantity: newQuantity,
        type: "package",
      });
    }
  }
  this.totalPrice += prod.offerPrice;
  this.items = updatedCartItems;
  return this.save();
};

cartSchema.methods.deleteFromCart = function (prod, type) {
  let updatedCartItems = [...this.items];
  if (type == "product") {
    const cartProductIndex = this.items.findIndex(
      (cp) => cp.productId?.toString() === prod._id.toString()
    );
    let quantity = updatedCartItems[cartProductIndex].quantity;
    if (quantity > 1) {
      quantity = updatedCartItems[cartProductIndex].quantity - 1;
      updatedCartItems[cartProductIndex].quantity = quantity;
    } else {
      updatedCartItems = this.items.filter(
        (item) => String(item.productId) !== prod._id.toString()
      );
    }
  } else if (type == "package") {
    const cartProductIndex = this.items.findIndex(
      (cp) => String(cp.packageId) === prod._id.toString()
    );
    let quantity = updatedCartItems[cartProductIndex].quantity;
    if (quantity > 1) {
      quantity = updatedCartItems[cartProductIndex].quantity - 1;
      updatedCartItems[cartProductIndex].quantity = quantity;
    } else {
      updatedCartItems = this.items.filter(
        (item) => String(item.packageId) !== prod._id.toString()
      );
    }
  }
  this.totalPrice -= prod.offerPrice;
  this.items = updatedCartItems;
  return this.save();
};

module.exports = mongoose.model("Cart", cartSchema);
