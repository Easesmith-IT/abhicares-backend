const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const sellerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    partnerId: {
      type: String,
    },
    legalName: {
      type: String,
      // required: true,
    },
    gstNumber: {
      type: String,
    },
    online: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "IN-REVIEW",
      enum: ["IN-REVIEW", "APPROVED", "REJECTED", "HOLD"],
    },
    Gender: {
      type: String,
      required: true,
      default: "MALE",
      enum: ["MALE", "FEMALE"],
    },
    address: {
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
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      location: {
        type: {
          type: String,
          // enum: ["Point"], // Only "Point" is allowed for type
          default: "Point",
        },
        coordinates: {
          type: [Number], // Array of [longitude, latitude]
          default: [0, 0],
        },
      },
    },
    password: {
      type: String,
      // required: true,
    },
    contactPerson: {
      name: {
        type: String,
        // required: true,
      },
      phone: {
        type: String,
        // required: true,
      },
      email: {
        type: String,
        // required: true,
      },
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
    },
    services: [
      {
        serviceId: {
          type: mongoose.Types.ObjectId,
          ref: "Service",
        },
      },
    ],
  },
  { timestamps: true }
);

sellerSchema.index({ "address.location": "2dsphere" });

module.exports = mongoose.model("Seller", sellerSchema);
