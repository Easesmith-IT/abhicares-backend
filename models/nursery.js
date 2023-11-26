const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const nurserySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: [{
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        addressLine: {
            type: String,
        },
        pincode: {
            type: String,
        },
    }],
    password: {
        type: String,
        // required: true,
    },
    contactPerson: {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
    },
    // totalListedPlants: {
    //     type: Number,
    //     required: true,
    // },
    // totalListedPots: {
    //     type: Number,
    //     required: true,
    //     default: 0,
    // },
}, { timestamps: true });

nurserySchema.methods.addPlants = function() {
    let newQuantity = 1;
    const totalplant = this.totalListedPlants;
    if (totalplant > 0) {
        newQuantity = totalplant + 1;
    }
    this.totalListedPlants = newQuantity;
    this.save();
};

nurserySchema.methods.removePlant = function() {
    let newQuantity = 0;
    const totalplant = this.totalListedPlants;
    if (totalplant > 1) {
        newQuantity = totalplant - 1;
    }
    this.totalListedPlants = newQuantity;
    this.save();
};

module.exports = mongoose.model("Nursery", nurserySchema);

// const mongodb = require("mongodb");

// class Product {
//     constructor({ title, price, description, imageUrl, id, userId }) {
//         this.title = title;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this.price = price;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//         this.userId = new mongodb.ObjectId(userId);
//     }

//     save() {
//         const db = getDb();
//         let dbop;
//         if (this._id) {
//             //reach when we are updating product
//             dbop = db.collection("products").updateOne({ _id: this._id }, {
//                 $set: this,
//             });
//         } else {
//             dbop = db.collection("products").insertOne(this);
//         }
//         return dbop
//             .then((result) => {
//                 console.log(result);
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }
//     static fetchAll() {
//         const db = getDb();
//         return db
//             .collection("products")
//             .find()
//             .toArray()
//             .then((products) => {
//                 // console.log(products);
//                 return products;
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }

//     static findById(prodId) {
//         const db = getDb();
//         return db
//             .collection("products")
//             .find({ _id: new mongodb.ObjectId(prodId) })
//             .next()
//             .then((product) => {
//                 // console.log(product);
//                 return product;
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }
//     static deleteById(prodId) {
//         const db = getDb();
//         return db
//             .collection("products")
//             .deleteOne({ _id: new mongodb.ObjectId(prodId) })
//             .then(() => {
//                 console.log("deleted product !");
//             })
//             .catch((err) => {
//                 console.log(err);
//             });
//     }
// }
// module.exports = Product;