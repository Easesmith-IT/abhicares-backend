const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
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
    },
    razorPayOrderId: {
        type: String,
        // required: true,
    },
    gender:{
        type: String,
    },
    otp:{
        type: Number,
    },
    otpExpiresAt:{
        type: Date,
    },
    cartId: {
        type: Schema.Types.ObjectId,
        ref: "Cart",
    },
    status:{
        type:String,
        default:"Active"
    }
}, { timestamps: true });

userSchema.methods.clearCart = function() {
    this.cart.items = { plants: [], pots: [] };
    this.cart.totalValue = 0;
    return this.save();
};

userSchema.methods.deletePlantFromCart = function(plant) {
    const cartProductIndex = this.cart.items.plants.findIndex(
        (cp) => cp.plantId.toString() === plant._id.toString()
    );
    let updatedCartItems = [...this.cart.items.plants];
    let quantity = updatedCartItems[cartProductIndex].quantity;

    if (quantity > 1) {
        quantity = updatedCartItems[cartProductIndex].quantity - 1;
        updatedCartItems[cartProductIndex].quantity = quantity;
    } else {
        updatedCartItems = this.cart.items.plants.filter(
            (item) => item.plantId.toString() !== plant._id.toString()
        );
    }
    this.cart.totalValue -= plant.price;
    this.cart.items.plants = updatedCartItems;
    return this.save();
};

userSchema.methods.deletePotFromCart = function(pot) {
    const cartProductIndex = this.cart.items.pots.findIndex(
        (cp) => cp.potId.toString() === pot._id.toString()
    );
    let updatedCartItems = [...this.cart.items.pots];
    let quantity = updatedCartItems[cartProductIndex].quantity;

    if (quantity > 1) {
        quantity = updatedCartItems[cartProductIndex].quantity - 1;
        updatedCartItems[cartProductIndex].quantity = quantity;
    } else {
        updatedCartItems = this.cart.items.pots.filter(
            (item) => item.potId.toString() !== pot._id.toString()
        );
    }
    this.cart.totalValue -= pot.price;
    this.cart.items.pots = updatedCartItems;
    return this.save();
};

userSchema.methods.addPlantToCart = function(plant) {
    const cartProductIndex = this.cart.items.plants.findIndex(
        (cp) => cp.plantId.toString() === plant._id.toString()
    );
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items.plants];

    if (cartProductIndex >= 0) {
        newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            plantId: plant._id,
            quantity: newQuantity,
        });
    }
    this.cart.totalValue += plant.price;
    this.cart.items.plants = updatedCartItems;
    return this.save();
};

userSchema.methods.addPotToCart = function(pot) {
    console.log(pot);
    const cartProductIndex = this.cart.items.pots.findIndex(
        (cp) => cp.potId.toString() === pot._id.toString()
    );
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items.pots];

    if (cartProductIndex >= 0) {
        newQuantity = updatedCartItems[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            potId: pot._id,
            quantity: newQuantity,
        });
    }
    this.cart.totalValue += pot.price;
    this.cart.items.pots = updatedCartItems;
    return this.save();
};

module.exports = mongoose.model("User", userSchema);