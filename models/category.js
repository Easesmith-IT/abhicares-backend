const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  totalServices: {
    type: Number,
    required: true,
    default: 0,
  },
});

// categorySchema.methods.deleteProductFromCart = function (product) {
//   const cartProductIndex = this.products.findIndex(
//     (cp) => cp.prodId.toString() === product._id.toString()
//   );
//   let updatedCartItems = [...this.products];
//   let quantity = updatedCartItems[cartProductIndex].quantity;

//   if (quantity > 1) {
//     quantity = updatedCartItems[cartProductIndex].quantity - 1;
//     updatedCartItems[cartProductIndex].quantity = quantity;
//   } else {
//     updatedCartItems = this.products.filter(
//       (item) => item.prodId.toString() !== product._id.toString()
//     );
//   }
//   this.totalValue -= product.price;
//   this.products = updatedCartItems;
//   return this.save();
// };

// categorySchema.methods.addProductToCart = function (product) {
//   const cartProductIndex = this.products.findIndex(
//     (cp) => cp.prodId.toString() === product._id.toString()
//   );
//   let newQuantity = 1;
//   const updatedCartItems = [...this.products];

//   if (cartProductIndex >= 0) {
//     newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
//     updatedCartItems[cartProductIndex].quantity = newQuantity;
//   } else {
//     updatedCartItems.push({
//       prodId: product._id,
//       quantity: newQuantity,
//     });
//   }
//   this.totalValue += product.price;
//   this.products = updatedCartItems;
//   return this.save();
// };

module.exports = mongoose.model("Category", categorySchema);
