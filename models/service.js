const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },

    icon: {
      type: String,
    },
    appHomepage: {
      type: Boolean,
      default: true,
    },
    webHomepage: {
      type: Boolean,
      default: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    totalProducts:{
      type:Number
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);

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
